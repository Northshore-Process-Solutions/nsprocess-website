# Proposals — Requirements

Audience: North Shore Process Solutions (internal ops).
Surface: Admin **Proposals** list + editor + print/PDF page; create from Pipeline leads.
Principle: Lightweight proposal builder inspired by MCC quotes — scope + line items + printable PDF. Not contracts, e-sign, or invoicing.

---

## Naming

- Customer-facing and UI term: **Proposal**
- Pipeline stage already: **Proposal sent**
- Not called “Quote” in product (HVAC-style); informal speech may still say quote

---

## Personas

- **Owner** — drafts proposals after consults and sends a PDF to the client.
- **Delivery owner** — reviews accepted scope before deposit / kickoff.

---

## Epic acceptance criteria (user stories)

1. As an owner, I should be able to create a proposal linked to a Pipeline lead so that pricing follows the consult.
2. As an owner, I should be able to set title, scope summary, terms, issue date, and valid-until so the client understands the offer.
3. As an owner, I should be able to add line items (description, quantity, unit price) so investment is itemized.
4. As an owner, I should be able to see calculated totals and optional deposit amount so I know what to ask for.
5. As an owner, I should be able to save drafts and edit them before sending.
6. As an owner, I should be able to open a print-ready PDF view and print/save as PDF so I can attach it to email.
7. As an owner, I should be able to mark a proposal sent (and optionally advance the lead to Proposal sent).
8. As an owner, I should be able to mark a proposal accepted, declined, or expired so Pipeline status stays accurate.
9. As an owner, I should be able to list and filter proposals by status on an admin page.
10. As an owner, I should be able to start a proposal from a lead detail dialog so drafting is one click after consult.

### Out of scope (v1)

- E-signature / DocuSign  
- Stripe deposit / invoices  
- Contract generation  
- Client-facing portal / magic links  
- Email send with PDF attached from the app (manual attach from Print → Save as PDF is fine)  
- HVAC margin / parts markup tooling from MCC  

---

## Definition of done

- [x] `proposals` + `proposal_items` tables with RLS  
- [x] Admin Proposals list + editor  
- [x] Print/PDF page  
- [x] Create from Pipeline lead  
- [x] Mark sent updates lead stage when linked  
- [x] Nav entry  
- [x] Typecheck passes  
