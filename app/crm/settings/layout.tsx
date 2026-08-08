import { redirect } from "next/navigation";

import { SettingsSubnav } from "@/components/admin/settings-subnav";
import { createClient } from "@/lib/supabase/server";

export default async function CrmSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/crm/login?next=/crm/settings");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Company identity and how this CRM install behaves.
        </p>
        <SettingsSubnav />
      </div>
      {children}
    </div>
  );
}
