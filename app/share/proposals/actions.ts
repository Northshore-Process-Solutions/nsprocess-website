"use server";

import { revalidatePath } from "next/cache";

import { escapeHtml, sendAppEmail } from "@/lib/mail";
import { getAppBrand, getLiveDocumentIssuer } from "@/lib/app-brand";
import { nextLeadStageForProposalStatus, type LeadStage } from "@/lib/leads";
import {
  buildProposalPdfBuffer,
  proposalPdfFilename,
} from "@/lib/proposal-pdf";
import {
  createProposalShareToken,
  getAppOrigin,
  proposalShareUrl,
} from "@/lib/proposal-share";
import type { ProposalWithItems } from "@/lib/proposals";
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
      `
      id,
      status,
      proposal_number,
      title,
      client_business_name,
      client_contact_name,
      client_email,
      client_phone,
      issued_at,
      valid_until,
      scope_summary,
      terms,
      deposit_percent,
      lead_id,
      organization_id,
      proposal_items (
        id,
        proposal_id,
        description,
        quantity,
        unit_price,
        line_total,
        sort_order,
        created_at
      )
    `,
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

  let pdfBuffer: Buffer;
  try {
    const issuer = await getLiveDocumentIssuer();
    pdfBuffer = await buildProposalPdfBuffer(
      proposal as ProposalWithItems,
      issuer,
    );
  } catch (pdfError) {
    console.error("Failed to build proposal PDF attachment", pdfError);
    return {
      ok: false,
      error: "Could not generate the proposal PDF attachment.",
      shareUrl: link.shareUrl,
    };
  }

  const pdfName = proposalPdfFilename(proposal);

  const greeting = proposal.client_contact_name?.trim()
    ? `Hi ${proposal.client_contact_name.trim()},`
    : "Hello,";

  const brand = await getAppBrand();
  const company = brand.companyName;

  const subject = `Proposal ${proposal.proposal_number} from ${company}`;
  const text = `${greeting}

Please review the proposal for ${proposal.client_business_name}:

${link.shareUrl}

A PDF copy is attached for your records. You can accept or decline on the link above. A short comment is optional.

Thank you,
${company}`;

  const html = `
    <p>${escapeHtml(greeting)}</p>
    <p>Please review the proposal for <strong>${escapeHtml(proposal.client_business_name)}</strong>.</p>
    <p><a href="${escapeHtml(link.shareUrl)}">View proposal and respond</a></p>
    <p>A PDF copy is attached for your records. You can accept or decline on the link above. A short comment is optional.</p>
    <p>Thank you,<br />${escapeHtml(company)}</p>
  `;

  const sent = await sendAppEmail({
    to,
    subject,
    text,
    html,
    attachments: [
      {
        filename: pdfName,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
  if (!sent.ok) {
    return { ok: false, error: sent.error, shareUrl: link.shareUrl };
  }

  const now = new Date().toISOString();

  // Mark sent so the public link accepts responses.
  if (proposal.status === "draft" || proposal.status === "expired") {
    await auth.supabase
      .from("proposals")
      .update({
        status: "sent",
        sent_at: now,
        updated_at: now,
      })
      .eq("id", id);

    if (proposal.lead_id) {
      const { data: lead } = await auth.supabase
        .from("leads")
        .select("stage")
        .eq("id", proposal.lead_id)
        .maybeSingle();

      const nextStage = lead
        ? nextLeadStageForProposalStatus(lead.stage as LeadStage, "sent")
        : null;

      if (nextStage) {
        await auth.supabase
          .from("leads")
          .update({ stage: nextStage, updated_at: now })
          .eq("id", proposal.lead_id);
      }
    }
  }

  let projectId: string | null = null;
  if (proposal.lead_id) {
    const { data: project } = await auth.supabase
      .from("projects")
      .select("id")
      .eq("lead_id", proposal.lead_id)
      .maybeSingle();
    projectId = project?.id ?? null;
  }

  if (proposal.lead_id || proposal.organization_id || projectId) {
    const { error: activityError } = await auth.supabase
      .from("activities")
      .insert({
        lead_id: proposal.lead_id,
        organization_id: proposal.organization_id,
        project_id: projectId,
        activity_type: "email",
        email_direction: "sent",
        email_address: to,
        subject,
        body: text,
        occurred_at: now,
      });

    if (activityError) {
      return {
        ok: false,
        error: `Email sent, but failed to log activity: ${activityError.message}`,
        token: link.token,
        shareUrl: link.shareUrl,
      };
    }
  }

  revalidatePath("/crm/pipeline");
  revalidatePath(`/crm/proposals/${id}`);
  if (proposal.organization_id) {
    revalidatePath(`/crm/organizations/${proposal.organization_id}`);
  }
  if (projectId) {
    revalidatePath(`/crm/projects/${projectId}`);
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
      "id, status, proposal_number, title, client_business_name, client_email, lead_id, organization_id, share_token, client_responded_at, valid_until",
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
      client_response: comment || null,
      client_responded_at: now,
      accepted_at: decision === "accepted" ? now : null,
      declined_at: decision === "declined" ? now : null,
      updated_at: now,
    })
    .eq("id", proposal.id)
    .is("client_responded_at", null);

  if (updateError) return { ok: false, error: updateError.message };

  if (proposal.lead_id) {
    const { data: lead } = await admin
      .from("leads")
      .select("stage")
      .eq("id", proposal.lead_id)
      .maybeSingle();

    const nextStage = lead
      ? nextLeadStageForProposalStatus(lead.stage as LeadStage, decision)
      : null;

    if (nextStage) {
      await admin
        .from("leads")
        .update({ stage: nextStage, updated_at: now })
        .eq("id", proposal.lead_id);
    }
  }

  if (proposal.lead_id || proposal.organization_id) {
    const label = decision === "accepted" ? "accepted" : "declined";
    await admin.from("activities").insert({
      lead_id: proposal.lead_id,
      organization_id: proposal.organization_id,
      activity_type: "note",
      email_direction: null,
      subject: `Proposal ${proposal.proposal_number} ${label}`,
      body: comment || null,
      occurred_at: now,
    });
  }

  revalidatePath(`/crm/proposals/${proposal.id}`);
  revalidatePath("/crm/proposals");
  revalidatePath("/crm/pipeline");
  revalidatePath(`/p/${token}`);
  if (proposal.organization_id) {
    revalidatePath(`/crm/organizations/${proposal.organization_id}`);
  }

  const notifyTo = process.env.CONTACT_TO?.trim();
  if (notifyTo) {
    const label = decision === "accepted" ? "accepted" : "declined";
    const subject = `Proposal ${proposal.proposal_number} ${label}`;
    const text = [
      `Proposal ${proposal.proposal_number} (${proposal.client_business_name}) was ${label}.`,
      comment ? `\nClient comment:\n${comment}` : "",
      `\nOpen in CRM:\n${getCrmProposalUrl(proposal.id)}`,
    ]
      .filter(Boolean)
      .join("\n");

    await sendAppEmail({
      to: notifyTo,
      subject,
      text,
      replyTo: proposal.client_email?.trim() || undefined,
      html: `
        <p>Proposal <strong>${escapeHtml(proposal.proposal_number)}</strong>
        (${escapeHtml(proposal.client_business_name)}) was
        <strong>${escapeHtml(label)}</strong>.</p>
        ${
          comment
            ? `<p><strong>Client comment:</strong></p>
        <p>${escapeHtml(comment).replaceAll("\n", "<br />")}</p>`
            : ""
        }
        <p><a href="${escapeHtml(getCrmProposalUrl(proposal.id))}">Open in CRM</a></p>
      `,
    });
  }

  return { ok: true };
}

function getCrmProposalUrl(id: string) {
  return `${getAppOrigin()}/crm/proposals/${id}`;
}
