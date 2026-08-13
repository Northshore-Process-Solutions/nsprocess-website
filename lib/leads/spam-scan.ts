import { revalidatePath } from "next/cache";

import { classifyLeadSpam } from "@/lib/ai/classify-lead-spam";
import { generateLeadInsight } from "@/lib/ai/generate-lead-insight";
import { getAppAiConfigForBackground } from "@/lib/app-ai";
import { researchLeadContext } from "@/lib/leads/research-lead";
import { createServiceRoleClient } from "@/lib/supabase/admin";

/** Run AI research, lead insight, and spam classification; persist on the lead. */
export async function scanLeadForSpam(
  leadId: string,
  options?: { force?: boolean },
) {
  if (!leadId?.trim()) return;
  if (!process.env.OPENAI_API_KEY?.trim()) {
    console.warn("scanLeadForSpam skipped: missing OPENAI_API_KEY");
    return;
  }

  let admin;
  try {
    admin = createServiceRoleClient();
  } catch (error) {
    console.error("scanLeadForSpam: no service role client", error);
    return;
  }

  const { data: lead, error: loadError } = await admin
    .from("leads")
    .select(
      "id, business_name, contact_name, email, phone, title, source, message, notes, spam_scanned_at",
    )
    .eq("id", leadId)
    .maybeSingle();

  if (loadError || !lead) {
    console.error("scanLeadForSpam: lead not found", loadError?.message);
    return;
  }

  if (lead.spam_scanned_at && !options?.force) {
    return;
  }

  const research = await researchLeadContext({
    businessName: lead.business_name,
    contactName: lead.contact_name,
    email: lead.email,
    phone: lead.phone,
    message: lead.message,
  });

  const ai = await getAppAiConfigForBackground();
  const leadInput = {
    businessName: lead.business_name,
    contactName: lead.contact_name,
    email: lead.email,
    phone: lead.phone,
    title: lead.title,
    source: lead.source,
    message: lead.message,
    notes: lead.notes,
    researchSummary: research.summary,
    researchSources: research.sources,
  };

  const [insight, result] = await Promise.all([
    generateLeadInsight(leadInput, ai),
    classifyLeadSpam(leadInput, ai),
  ]);

  const scannedAt = new Date().toISOString();
  const update: Record<string, unknown> = {
    research_summary: research.summary,
    research_sources: research.sources.length > 0 ? research.sources : null,
    researched_at: scannedAt,
    updated_at: scannedAt,
  };

  if (insight) {
    update.lead_insight = insight;
    update.insight_generated_at = scannedAt;
  }

  if (result.ok) {
    update.spam_flag = result.isSpam;
    update.spam_reason = result.reason;
    update.spam_scanned_at = scannedAt;
  } else {
    console.error("scanLeadForSpam classification failed", result.error);
  }

  const { error: updateError } = await admin
    .from("leads")
    .update(update)
    .eq("id", leadId);

  if (updateError) {
    console.error("scanLeadForSpam update failed", updateError.message);
    return;
  }

  revalidatePath("/crm/pipeline");
  revalidatePath("/crm");
}
