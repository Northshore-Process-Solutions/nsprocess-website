export type PortalMode = "live" | "demo";

export const PORTAL_BASE: Record<PortalMode, string> = {
  live: "/crm",
  demo: "/demo",
};

/** Join portal base with a path like `/pipeline` or `pipeline`. */
export function portalPath(mode: PortalMode, path = ""): string {
  const base = PORTAL_BASE[mode];
  if (!path || path === "/") return base;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function portalModeFromPathname(pathname: string): PortalMode {
  return pathname === "/demo" || pathname.startsWith("/demo/")
    ? "demo"
    : "live";
}
