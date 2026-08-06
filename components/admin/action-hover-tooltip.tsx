"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

/** True only on devices that actually hover (not phones/tablets). */
function useFineHover() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setEnabled(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return enabled;
}

export function ActionHoverTooltip({
  children,
  content,
  width = 256,
  className,
}: {
  children: React.ReactNode;
  content: React.ReactNode;
  width?: number;
  className?: string;
}) {
  const fineHover = useFineHover();
  const triggerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    placeBelow: boolean;
  } | null>(null);

  function updatePosition() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const left = Math.min(
      Math.max(8, rect.right - width),
      window.innerWidth - width - 8,
    );
    const placeBelow = rect.top < 160;

    setCoords({
      top: placeBelow ? rect.bottom + 8 : rect.top - 8,
      left,
      placeBelow,
    });
  }

  useEffect(() => {
    if (!open || !fineHover) return;

    updatePosition();
    function handleReposition() {
      updatePosition();
    }

    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);
    return () => {
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [open, width, fineHover]);

  useEffect(() => {
    if (!fineHover) setOpen(false);
  }, [fineHover]);

  if (!fineHover) {
    return <>{children}</>;
  }

  const tooltip =
    open && coords && typeof document !== "undefined"
      ? createPortal(
          <div
            className={cn(
              "pointer-events-none fixed z-[80] rounded-2xl border border-border bg-card p-3 text-left shadow-card",
              className,
            )}
            role="tooltip"
            style={{
              top: coords.top,
              left: coords.left,
              width,
              transform: coords.placeBelow ? "none" : "translateY(-100%)",
            }}
          >
            {content}
          </div>,
          document.body,
        )
      : null;

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
      onFocus={() => {
        updatePosition();
        setOpen(true);
      }}
      onMouseEnter={() => {
        updatePosition();
        setOpen(true);
      }}
      onMouseLeave={() => setOpen(false)}
      ref={triggerRef}
    >
      {children}
      {tooltip}
    </div>
  );
}
