import { LoginForm } from "@/components/admin/login-form";
import { Card } from "@/components/ui/card";
import { getAppBrand } from "@/lib/app-brand";

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string;
  }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath =
    params?.next && params.next.startsWith("/crm")
      ? params.next
      : "/crm";
  const brand = await getAppBrand();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          {brand.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={brand.companyName}
              className="h-10 w-auto max-w-[10rem] object-contain"
              src={brand.logoUrl}
            />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-900 text-sm font-bold text-white">
              {brand.companyName.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div>
            <p className="text-sm font-semibold tracking-tight text-slate-900">
              {brand.companyName}
            </p>
            {brand.tagline ? (
              <p className="text-xs text-muted-foreground">{brand.tagline}</p>
            ) : null}
          </div>
        </div>
        <h1 className="mt-8 text-3xl font-bold tracking-tight">
          {brand.portalName}
        </h1>
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
