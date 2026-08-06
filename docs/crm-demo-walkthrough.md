# CRM Demo Walkthrough

Use this script to demo the portal end to end from a new Pipeline inquiry through billing, a delivered statement, and the final Business account hub view.

## Demo Setup

Start at `/crm`. If you are signed out, use `/crm/login`.

Suggested demo business:

- Business: `Northshore Demo Co`
- Contact: `Jordan Smith`
- Email: use an address you control for email tests, or `demo@example.com` if you will not send
- Phone: `(978) 555-0142`
- Need: `We need a cleaner way to intake jobs, track approvals, and know what is ready to invoice.`

## 1. Create The Pipeline Inquiry

1. Go to `Pipeline`.
2. Create a new inquiry.
3. Enter the demo business/contact details.
4. Set the source to whatever is easiest to explain, such as `Manual` or `Referral`.
5. Save the lead.
6. Confirm the lead appears in Pipeline.

What to say: Pipeline is where new work starts before it is a customer or project.

## 2. Move The Lead Toward A Proposal

1. Open the lead from Pipeline.
2. Update the stage through the sales flow:
   - `New inquiry`
   - `Review booked`
   - `Review completed`
3. Add one activity note that summarizes the process review.
4. Confirm the lead now feels ready for proposal work.

What to say: The lead owns the pre-sale conversation and activity history.

## 3. Create And Send The Proposal

1. From the lead, create a Proposal.
2. Fill in scope and line items.
3. Use `Draft with AI` on the scope if you want to show the AI assist.
4. Save the proposal.
5. Open the PDF/print view to show client-ready output.
6. Mark the proposal sent.

What to say: Proposal is the offer. It is still pre-agreement and can stay lightweight.

## 4. Create And Sign The Agreement

1. From the proposal, create an Agreement.
2. Confirm the agreement copied the client, scope, line items, and totals.
3. Make any small edit if useful for the demo.
4. Save and open the PDF/print view.
5. Mark the agreement signed.

What to say: Agreement turns an accepted proposal into engagement terms.

## 5. Create The Invoice

1. From the signed agreement, create an Invoice.
2. Choose a deposit invoice for the simplest demo.
3. Confirm the line items and total.
4. Save the invoice.
5. Open the PDF/print view.
6. Mark the invoice sent.

What to say: Invoice is the ask for money. It is separate from the agreement and can be tracked for payment.

## 6. Deliver A Statement

1. Go to `Billing` → `Statements`.
2. Select `Northshore Demo Co`.
3. Choose a date range that includes the invoice.
4. Generate the statement.
5. Open/print the statement view.

What to say: Statement is the account snapshot, useful when a client asks what is open or paid.

## 7. Mark Payment And Trigger Delivery

1. Return to the invoice.
2. Mark the invoice paid.
3. Go back to Pipeline and confirm the lead is no longer treated as an open inquiry.
4. Go to `Projects`.
5. Confirm a project exists or create one if you are demoing manual delivery setup.
6. Add a first project task, such as `Schedule kickoff`.
7. Schedule a kickoff event.

What to say: Once money is received, the work shifts from selling to delivery.

## 8. Show The Business Hub

1. Go to `Businesses`.
2. Open `Northshore Demo Co`.
3. Walk through the account hub:
   - Snapshot: open balance, pipeline count, active projects, spend
   - Account: business profile and primary contact
   - Billing: latest proposal, agreement, invoice, statement shortcut
   - Pipeline: open or closed inquiry context
   - Projects: delivery work and next action
   - Purchases: spend linked to the business or project
   - Activity and history

What to say: At the end, the customer is just another business in the hub, with the full sales, billing, and delivery trail attached.

## Cleanup After Demo

If you want to reset after the demo:

1. Open `Businesses`.
2. Open `Northshore Demo Co`.
3. Delete the business only if you no longer need the demo account.
4. Also review Billing and Projects for any documents or projects you want removed.

