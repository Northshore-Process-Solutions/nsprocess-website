"use server";

import { revalidatePath } from "next/cache";

import { escapeHtml, sendAppEmail } from "@/lib/mail";
import {
  createProposalShareToken,
  getAppOrigin,
  proposalShareUrl,
} from "@/lib/proposal-share";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ShareActionResult = {
  ok: boolean;
  error?: string;
  token?: string;
  shareUrl?: string;
};

export type ClientResponseDecision = "accepted" | "declined";

async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    return { supabase, error: "You must be signed in." as const };
  }

  return { supabase, error: null };
}

/** Ensure the proposal has a share token; mint one if missing. Does not change status. */
export async function ensureProposalShareLink(
  id: string,
): Promise<ShareActionResult> {
  if (!id) return { ok: false, error: "Missing proposal id." };

  const auth = await requireUser();
  if (auth.error) return { ok: false, error: auth.error };

  const { data: existing, error: loadError } = await auth.supabase
    .from("proposals")
    .select("id, share_token, status")
    .eq("id", id)
    .maybeSingle();

  if (loadError) return { ok: false, error: loadError.message };
  if (!existing) return { ok: false, error: "Proposal not found." };

  let token = existing.share_token as string | null;
  if (!token) {
    token = createProposalShareToken();
    const { error } = await auth.supabase
      .from("proposals")
      .update({
        share_token: token,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };
  }

  revalidatePath(`/crm/proposals/${id}`);
  return {
    ok: true,
    token,
    shareUrl: proposalShareUrl(token),
  };
}

/** Email the client a link to review and accept/decline the proposal. */
export async function sendProposalShareEmail(
  id: string,
): Promise<ShareActionResult> {
  const link = await ensureProposalShareLink(id);
  if (!link.ok || !link.shareUrl) {
    return { ok: false, error: link.error ?? "Could not create share link." };
  }

  const auth = await requireUser();
  if (auth.error) return { ok: false, error: auth.error };

  const { data: proposal, error } = await auth.supabase
    .from("proposals")
    .select(
      "proposal_number, title, client_business_name, client_contact_name, client_email",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!proposal) return { ok: false, error: "Proposal not found." };

  const to = proposal.client_email?.trim();
  if (!to) {
    return {
      ok: false,
      error: "Add a client email on the proposal before sending the link.",
    };
  }

  const greeting = proposal.client_contact_name?.trim()
    ? `Hi ${proposal.client_contact_name.trim()},`
    : "Hello,";

  const subject = `Proposal ${proposal.proposal_number} from North Shore Process Solutions`;
  const text = `${greeting}

Please review the proposal for ${proposal.client_business_name}:

${link.shareUrl}

You can accept or decline and leave a short comment for us.

Thank you,
North Shore Process Solutions`;

  const html = `
    <p>${escapeHtml(greeting)}</p>
    <p>Please review the proposal for <strong>${escapeHtml(proposal.client_business_name)}</strong>.</p>
    <p><a href="${escapeHtml(link.shareUrl)}">View proposal and respond</a></p>
    <p>You can accept or decline and leave a short comment for us.</p>
    <p>Thank you,<br />North Shore Process Solutions</p>
  `;

  const sent = await sendAppEmail({ to, subject, text, html });
  if (!sent.ok) {
    return { ok: false, error: sent.error, shareUrl: link.shareUrl };
  }

  return { ok: true, token: link.token, shareUrl: link.shareUrl };
}

export async function respondToSharedProposal(input: {
  token: string;
  decision: ClientResponseDecision;
  comment: string;
}): Promise<{ ok: boolean; error?: string }> {
  const token = input.token?.trim();
  if (!token) return { ok: false, error: "Invalid link." };

  const decision = input.decision;
  if (decision !== "accepted" && decision !== "declined") {
    return { ok: false, error: "Choose accept or decline." };
  }

  const comment = input.comment?.trim() ?? "";
  if (!comment) {
    return { ok: false, error: "Please add a short comment." };
  }
  if (comment.length > 2000) {
    return { ok: false, error: "Comment is too long (max 2000 characters)." };
  }

  let admin;
  try {
    admin = createServiceRoleClient();
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Server is missing service role configuration.",
    };
  }

  const { data: proposal, error: loadError } = await admin
    .from("proposals")
    .select(
      "id, status, proposal_number, title, client_business_name, client_email, share_token, client_responded_at, valid_until",
    )
    .eq("share_token", token)
    .maybeSingle();

  if (loadError) return { ok: false, error: loadError.message };
  if (!proposal) return { ok: false, error: "This proposal link is invalid." };

  if (proposal.client_responded_at) {
    return {
      ok: false,
      error: "A response was already recorded for this proposal.",
    };
  }

  if (proposal.status !== "sent") {
    return {
      ok: false,
      error: "This proposal is no longer open for a response.",
    };
  }

  if (proposal.valid_until) {
    const until = new Date(`${proposal.valid_until}T23:59:59`);
    if (!Number.isNaN(until.getTime()) && until.getTime() < Date.now()) {
      return {
        ok: false,
        error: "This proposal has expired and can no longer be accepted.",
      };
    }
  }

  const now = new Date().toISOString();
  const { error: updateError } = await admin
    .from("proposals")
    .update({
      status: decision,
      client_response: comment,
      client_responded_at: now,
      accepted_at: decision === "accepted" ? now : null,
      declined_at: decision === "declined" ? now : null,
      updated_at: now,
    })
    .eq("id", proposal.id)
    .is("client_responded_at", null);

  if (updateError) return { ok: false, error: updateError.message };

  revalidatePath(`/crm/proposals/${proposal.id}`);
  revalidatePath("/crm/proposals");
  revalidatePath("/crm/pipeline");
  revalidatePath(`/p/${token}`);

  const notifyTo = process.env.CONTACT_TO?.trim();
  if (notifyTo) {
    const label = decision === "accepted" ? "accepted" : "declined";
    const subject = `Proposal ${proposal.proposal_number} ${label}`;
    const text = `Proposal ${proposal.proposal_number} (${proposal.client_business_name}) was ${label}.

Client comment:
${comment}

Open in CRM:
${getCrmProposalUrl(proposal.id)}`;

    await sendAppEmail({
      to: notifyTo,
      subject,
      text,
      replyTo: proposal.client_email?.trim() || undefined,
      html: `
        <p>Proposal <strong>${escapeHtml(proposal.proposal_number)}</strong>
        (${escapeHtml(proposal.client_business_name)}) was
        <strong>${escapeHtml(label)}</strong>.</p>
        <p><strong>Client comment:</strong></p>
        <p>${escapeHtml(comment).replaceAll("\n", "<br />")}</p>
        <p><a href="${escapeHtml(getCrmProposalUrl(proposal.id))}">Open in CRM</a></p>
      `,
    });
  }

  return { ok: true };
}

function getCrmProposalUrl(id: string) {
  return `${getAppOrigin()}/crm/proposals/${id}`;
}
