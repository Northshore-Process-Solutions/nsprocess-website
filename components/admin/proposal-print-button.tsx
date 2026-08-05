"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ProposalPrintButton() {
  return (
    <Button
      className="print:hidden"
      onClick={() => window.print()}
      type="button"
      variant="accent"
    >
      <Printer aria-hidden className="size-4" />
      Print / Save as PDF
    </Button>
  );
}
