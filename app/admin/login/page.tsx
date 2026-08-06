import { LoginForm } from "@/components/admin/login-form";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/logo";

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string;
  }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath =
    params?.next && params.next.startsWith("/admin")
      ? params.next
      : "/admin";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-8">
        <Logo />
        <h1 className="mt-8 text-3xl font-bold tracking-tight">Admin</h1>
        <p className="mt-3 text-muted-foreground">
          Sign in to manage pipeline, businesses, billing, and delivery.
        </p>
      </div>

      <Card className="p-6 sm:p-8">
        <LoginForm nextPath={nextPath} />
      </Card>
    </main>
  );
}
