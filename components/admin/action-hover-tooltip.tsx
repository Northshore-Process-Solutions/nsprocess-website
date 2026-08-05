"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function ActionHoverTooltip({
  children,
  content,
}: {
  children: React.ReactNode;
  content: React.ReactNode;
}) {
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

    const width = 256;
    const left = Math.min(
      Math.max(8, rect.right - width),
      window.innerWidth - width - 8,
    );
    const placeBelow = rect.top < 140;

    setCoords({
      top: placeBelow ? rect.bottom + 8 : rect.top - 8,
      left,
      placeBelow,
    });
  }

  useEffect(() => {
    if (!open) return;

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
  }, [open]);

  const tooltip =
    open && coords && typeof document !== "undefined"
      ? createPortal(
          <div
            className="pointer-events-none fixed z-[80] w-64 rounded-2xl border border-border bg-card p-3 text-left shadow-card"
            role="tooltip"
            style={{
              top: coords.top,
              left: coords.left,
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
