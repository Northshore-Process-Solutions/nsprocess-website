import { notFound, redirect } from "next/navigation";

import { AdminNav } from "@/components/admin/admin-nav";
import { ProjectDetail } from "@/components/admin/project-detail";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { Logo } from "@/components/logo";
import type { ProjectWithOrganization } from "@/lib/projects";
import { createClient } from "@/lib/supabase/server";

type ProjectPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/admin/login");
  }

  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      organizations (
        id,
        name
      )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load project: ${error.message}`);
  }

  if (!data) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo />
          <AdminNav current="projects" />
        </div>
        <SignOutButton />
      </header>

      <ProjectDetail project={data as ProjectWithOrganization} />
    </main>
  );
}
