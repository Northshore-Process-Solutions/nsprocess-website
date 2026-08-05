# Billing — Agreements, Invoices, Statements

Audience: North Shore Process Solutions (internal ops).
Surfaces: Admin **Billing** hub (Proposals, Agreements, Invoices, Statements) + links from Pipeline/CRM.
Principle: Lightweight engagement paperwork and collections — not full accounting.

---

## Document chain

1. **Proposal** — offer (already built)  
2. **Agreement** — accepted terms / binding engagement  
3. **Invoice** — request for a specific payment  
4. **Statement** — generated account snapshot for a business  

---

## Agreements

### Acceptance criteria

1. Create an agreement from a proposal (copies client, scope, items, terms, totals).  
2. Edit title, scope, terms, line items, status before sending.  
3. Print/PDF with signature block (typed name + date for v1).  
4. Mark signed; optionally mark source proposal accepted.  
5. List/filter by status; open from Billing hub and proposal detail.  

Statuses: `draft | sent | signed | void`

### Out of scope

E-sign vendors, client portal, legal clause library.

---

## Invoices

### Acceptance criteria

1. Create invoice from agreement (deposit % or custom lines) or manually for a business.  
2. Types: `deposit | progress | final | other`.  
3. Line items, due date, totals, amount paid.  
4. Statuses: `draft | sent | paid | void`.  
5. Print/PDF; mark paid (records paid_at / amount_paid).  
6. When a linked deposit invoice is paid, advance lead to `deposit_received` when appropriate.  

### Out of scope

Stripe, tax engine, recurring billing, double-entry ledger.

---

## Statements

### Acceptance criteria

1. Pick a business + date range.  
2. Generate a printable statement listing invoices in range with amounts, paid, and balance.  
3. Show opening context (simple: invoices issued in range + unpaid prior summary optional).  
4. No separate draft/edit workflow — always generated.  

### Out of scope

Payment plans, aging reports beyond the statement PDF, AR collections automation.

---

## Definition of done

- [x] Schema + RLS for agreements, agreement_items, invoices, invoice_items  
- [x] Agreement create/edit/PDF/sign  
- [x] Invoice create/edit/PDF/pay  
- [x] Statement generator PDF  
- [x] Billing hub + nav regroup  
- [x] Typecheck passes  
