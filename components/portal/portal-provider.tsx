"use client";

import { createContext, useContext, useMemo } from "react";

import {
  portalPath,
  type PortalMode,
} from "@/lib/portal/paths";
import type { AppBrand } from "@/lib/app-brand";

type PortalContextValue = {
  mode: PortalMode;
  basePath: string;
  isDemo: boolean;
  brand: AppBrand | null;
  /** Build a portal-scoped href from a path like `/pipeline`. */
  href: (path?: string) => string;
};

const PortalContext = createContext<PortalContextValue>({
  mode: "live",
  basePath: "/crm",
  isDemo: false,
  brand: null,
  href: (path = "") => portalPath("live", path),
});

export function PortalProvider({
  mode,
  children,
  headerSubtitle,
  brand = null,
}: {
  mode: PortalMode;
  children: React.ReactNode;
  headerSubtitle?: string;
  brand?: AppBrand | null;
}) {
  const value = useMemo<PortalContextValue>(
    () => ({
      mode,
      basePath: portalPath(mode),
      isDemo: mode === "demo",
      brand,
      href: (path = "") => portalPath(mode, path),
    }),
    [mode, brand],
  );

  return (
    <PortalContext.Provider value={value}>
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
