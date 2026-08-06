"use client";

import { createContext, useContext, useMemo } from "react";

import {
  portalPath,
  type PortalMode,
} from "@/lib/portal/paths";

type PortalContextValue = {
  mode: PortalMode;
  basePath: string;
  isDemo: boolean;
  /** Build a portal-scoped href from a path like `/pipeline`. */
  href: (path?: string) => string;
};

const PortalContext = createContext<PortalContextValue>({
  mode: "live",
  basePath: "/crm",
  isDemo: false,
  href: (path = "") => portalPath("live", path),
});

export function PortalProvider({
  mode,
  children,
  headerSubtitle,
}: {
  mode: PortalMode;
  children: React.ReactNode;
  headerSubtitle?: string;
}) {
  const value = useMemo<PortalContextValue>(
    () => ({
      mode,
      basePath: portalPath(mode),
      isDemo: mode === "demo",
      href: (path = "") => portalPath(mode, path),
    }),
    [mode],
  );

  return (
    <PortalContext.Provider value={value}>
      {/* subtitle available via data attribute for shell */}
      <div
        className="contents"
        data-portal-mode={mode}
        data-portal-subtitle={headerSubtitle ?? ""}
      >
        {children}
      </div>
    </PortalContext.Provider>
  );
}

export function usePortal() {
  return useContext(PortalContext);
}

export function usePortalHref(path = "") {
  return usePortal().href(path);
}
