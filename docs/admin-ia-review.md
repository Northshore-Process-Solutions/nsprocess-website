# Admin IA / UX review — grouping

Date: 2026-08-05  
Scope: Full admin after Billing (Agreements, Invoices, Statements) landed.

---

## Current top nav (after regroup)

| Nav item | Role |
|---|---|
| **CRM** | Customer record of truth (businesses/contacts) |
| **Pipeline** | Pre-sale deal flow |
| **Billing** | Money paperwork hub (Proposals → Agreements → Invoices → Statements) |
| **Projects** | Post-deposit delivery |
| **Calendar** | Time / consults / onsites |
| **Purchases** | Company spend (outflow) |
| **Stack** | Tools inventory |

Billing uses a **subnav** so Proposals no longer compete as a peer with CRM/Projects.

---

## Why this grouping

1. **Sell vs deliver vs money** were blurred when Proposals sat next to Projects.  
2. Agreement/Invoice/Statement belong with Proposal — same chain, same PDFs.  
3. Purchases stay separate: internal spend ≠ client billing.  
4. Calendar stays delivery/ops — not billing.

---

## Recommended mental model

```text
Attract / convert     Operate delivery      Money in          Money out     Meta
CRM + Pipeline   →    Projects + Calendar → Billing hub   →   Purchases  →  Stack
```

---

## Follow-ups (not blocking)

1. **Shared admin chrome** — Logo/nav/sign-out repeated on every page; extract layout shell.  
2. **CRM business page** — add compact Billing strip (latest proposal/agreement/invoice + statement link). ✅ Account hub live under `/crm/organizations/[id]`.  
3. **Pipeline lead detail** — “Create proposal” already exists; add “Open billing” when proposal exists.  
4. **Purchases** — optional rename to “Spend” later if Billing confusion appears.  
5. **KPI cards → filters** — make drafts/sent counts clickable (same pattern as Purchases type filters).  

---

## Definition of done for this regroup

- [x] Top nav: Billing replaces standalone Proposals  
- [x] `/admin/billing` overview hub  
- [x] Billing subnav on Proposals / Agreements / Invoices / Statements  
- [x] Cross-links: Proposal → Agreement → Deposit/Full Invoice  
