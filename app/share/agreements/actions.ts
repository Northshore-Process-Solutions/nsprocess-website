"use server";

import { revalidatePath } from "next/cache";

import {
  agreementShareUrl,
  createAgreementShareToken,
} from "@/lib/agreement-share";
import { escapeHtml, sendAppEmail } from "@/lib/mail";
import { getAppBrand } from "@/lib/app-brand";
import { getAppOrigin } from "@/lib/proposal-share";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ShareActionResult = {
  ok: boolean;
  error?: string;
  token?: string;
  shareUrl?: string;
};

async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    return { supabase, error: "You must be signed in." as const };
  }

  return { supabase, error: null };
}

function revalidateAgreementShare(input: {
  id: string;
  leadId?: string | null;
  organizationId?: string | null;
  proposalId?: string | null;
  token?: string;
}) {
  revalidatePath("/crm/agreements");
  revalidatePath(`/crm/agreements/${input.id}`);
  revalidatePath("/crm/pipeline");
  revalidatePath("/crm/billing");
  if (input.proposalId) {
    revalidatePath(`/crm/proposals/${input.proposalId}`);
  }
  if (input.organizationId) {
    revalidatePath(`/crm/organizations/${input.organizationId}`);
  }
  if (input.token) {
    revalidatePath(`/a/${input.token}`);
  }
}

/** Ensure the agreement has a share token; mint one if missing. */
export async function ensureAgreementShareLink(
  id: string,
): Promise<ShareActionResult> {
  if (!id) return { ok: false, error: "Missing agreement id." };

  const auth = await requireUser();
  if (auth.error) return { ok: false, error: auth.error };

  const { data: existing, error: loadError } = await auth.supabase
    .from("agreements")
    .select("id, share_token, status")
    .eq("id", id)
    .maybeSingle();

  if (loadError) return { ok: false, error: loadError.message };
  if (!existing) return { ok: false, error: "Agreement not found." };

  let token = existing.share_token as string | null;
  if (!token) {
    token = createAgreementShareToken();
    const { error } = await auth.supabase
      .from("agreements")
      .update({
        share_token: token,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };
  }

  revalidatePath(`/crm/agreements/${id}`);
  return {
    ok: true,
    token,
    shareUrl: agreementShareUrl(token),
  };
}

/** Email the client a link to review and sign the agreement. */
export async function sendAgreementShareEmail(
  id: string,
): Promise<ShareActionResult> {
  const link = await ensureAgreementShareLink(id);
  if (!link.ok || !link.shareUrl) {
    return { ok: false, error: link.error ?? "Could not create share link." };
  }

  const auth = await requireUser();
  if (auth.error) return { ok: false, error: auth.error };

  const { data: agreement, error } = await auth.supabase
    .from("agreements")
    .select(
      "id, status, agreement_number, title, client_business_name, client_contact_name, client_email, lead_id, organization_id, sent_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!agreement) return { ok: false, error: "Agreement not found." };

  const to = agreement.client_email?.trim();
  if (!to) {
    return {
      ok: false,
      error: "Add a client email on the agreement before sending the link.",
    };
  }

  const greeting = agreement.client_contact_name?.trim()
    ? `Hi ${agreement.client_contact_name.trim()},`
    : "Hello,";

  const brand = await getAppBrand();
  const company = brand.companyName;

  const subject = `Agreement ${agreement.agreement_number} — please review and sign`;
  const text = `${greeting}

Please review and sign the agreement for ${agreement.client_business_name}:

${link.shareUrl}

By signing, you confirm the scope and investment in the agreement. A deposit invoice will follow.

Thank you,
${company}`;

  const html = `
    <p>${escapeHtml(greeting)}</p>
    <p>Please review and sign the agreement for <strong>${escapeHtml(agreement.client_business_name)}</strong>.</p>
    <p><a href="${escapeHtml(link.shareUrl)}">View agreement and sign</a></p>
    <p>By signing, you confirm the scope and investment in the agreement. A deposit invoice will follow.</p>
    <p>Thank you,<br />${escapeHtml(company)}</p>
  `;

  const sent = await sendAppEmail({ to, subject, text, html });
  if (!sent.ok) {
    return { ok: false, error: sent.error, shareUrl: link.shareUrl };
  }

  const now = new Date().toISOString();
  if (agreement.status === "draft" || agreement.status === "void") {
    await auth.supabase
      .from("agreements")
      .update({
        status: "sent",
        sent_at: agreement.sent_at ?? now,
        updated_at: now,
      })
      .eq("id", id);
  } else if (!agreement.sent_at) {
    await auth.supabase
      .from("agreements")
      .update({ sent_at: now, updated_at: now })
      .eq("id", id);
  }

  if (agreement.lead_id || agreement.organization_id) {
    await auth.supabase.from("activities").insert({
      lead_id: agreement.lead_id,
      organization_id: agreement.organization_id,
      activity_type: "email",
      email_direction: "sent",
      email_address: to,
      subject,
      body: text,
      occurred_at: now,
    });
  }

  revalidateAgreementShare({
    id,
    leadId: agreement.lead_id,
    organizationId: agreement.organization_id,
  });

  return { ok: true, token: link.token, shareUrl: link.shareUrl };
}

export async function signSharedAgreement(input: {
  token: string;
  signerName: string;
}): Promise<{ ok: boolean; error?: string }> {
  const token = input.token?.trim();
  if (!token) return { ok: false, error: "Invalid link." };

  const signerName = input.signerName?.trim() ?? "";
  if (!signerName) {
    return { ok: false, error: "Enter your full name to sign." };
  }
  if (signerName.length > 200) {
    return { ok: false, error: "Name is too long." };
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

  const { data: agreement, error: loadError } = await admin
    .from("agreements")
    .select(
      "id, status, agreement_number, title, client_business_name, client_email, lead_id, organization_id, proposal_id, share_token, signed_at",
    )
    .eq("share_token", token)
    .maybeSingle();

  if (loadError) return { ok: false, error: loadError.message };
  if (!agreement) return { ok: false, error: "This agreement link is invalid." };

  if (agreement.signed_at || agreement.status === "signed") {
    return { ok: false, error: "This agreement was already signed." };
  }

  if (agreement.status === "void") {
    return { ok: false, error: "This agreement is no longer available." };
  }

  if (agreement.status !== "sent" && agreement.status !== "draft") {
    return {
      ok: false,
      error: "This agreement is no longer open for signature.",
    };
  }

  const now = new Date().toISOString();
  const patch: Record<string, string> = {
    status: "signed",
    signer_name: signerName,
    signed_at: now,
    updated_at: now,
  };
  if (agreement.status === "draft") {
    patch.sent_at = now;
  }

  const { error: updateError } = await admin
    .from("agreements")
    .update(patch)
    .eq("id", agreement.id)
    .is("signed_at", null);

  if (updateError) return { ok: false, error: updateError.message };

  if (agreement.proposal_id) {
    const { data: proposal } = await admin
      .from("proposals")
      .select("id, status, accepted_at")
      .eq("id", agreement.proposal_id)
      .maybeSingle();

    if (proposal) {
      await admin
        .from("proposals")
        .update({
          status: "accepted",
          accepted_at: proposal.accepted_at ?? now,
          updated_at: now,
        })
        .eq("id", proposal.id);
    }
  }

  if (agreement.lead_id || agreement.organization_id) {
    await admin.from("activities").insert({
      lead_id: agreement.lead_id,
      organization_id: agreement.organization_id,
      activity_type: "note",
      email_direction: null,
      subject: `Agreement ${agreement.agreement_number} signed`,
      body: `Signed by ${signerName}`,
      occurred_at: now,
    });
  }

  revalidateAgreementShare({
    id: agreement.id,
    leadId: agreement.lead_id,
    organizationId: agreement.organization_id,
    proposalId: agreement.proposal_id,
    token,
  });

  const notifyTo = process.env.CONTACT_TO?.trim();
  if (notifyTo) {
    const crmUrl = `${getAppOrigin()}/crm/agreements/${agreement.id}`;
    await sendAppEmail({
      to: notifyTo,
      subject: `Agreement ${agreement.agreement_number} signed`,
      replyTo: agreement.client_email?.trim() || undefined,
      text: `Agreement ${agreement.agreement_number} (${agreement.client_business_name}) was signed by ${signerName}.

Open in CRM:
${crmUrl}`,
      html: `
        <p>Agreement <strong>${escapeHtml(agreement.agreement_number)}</strong>
        (${escapeHtml(agreement.client_business_name)}) was signed by
        <strong>${escapeHtml(signerName)}</strong>.</p>
        <p><a href="${escapeHtml(crmUrl)}">Open in CRM</a></p>
      `,
    });
  }

  return { ok: true };
}
