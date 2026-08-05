# Purchases — Requirements

Audience: North Shore Process Solutions (internal ops).
Surface: Admin **Purchases** list + optional links from Projects and CRM businesses.
Principle: Lightweight spend tracking — not inventory, depreciation, or procurement.

---

## Personas

- **Owner** — tracks promo materials and general business purchases.
- **Delivery owner** — records project-specific spend against an engagement.

---

## Epic acceptance criteria (user stories)

1. As an owner, I should be able to log a purchase with name, type, amount, and date so that I have a record of what was spent.
2. As an owner, I should be able to mark a purchase as promo, equipment, supplies, or other so that I can filter by kind.
3. As an owner, I should be able to leave a purchase unassigned so that general business spend (e.g. promotional materials) is tracked without a project.
4. As a delivery owner, I should be able to link a purchase to a project so that job-specific spend is visible on that engagement.
5. As a delivery owner, I should be able to optionally link a purchase to a business so that CRM history can show related spend.
6. As an owner, I should be able to edit or delete a purchase so that the list stays accurate.
7. As an owner, I should be able to see total spend and counts on the Purchases page so that I can scan costs quickly.
8. As a delivery owner, I should be able to see purchases for a project on the project page so that I know what was bought for that job.
9. As an owner, I should be able to see purchases linked to a business on the CRM business page so that company-related spend is easy to find.
10. As an owner, I should be able to filter purchases by type so that I can focus on promo vs project supplies.

### Out of scope

- Inventory counts / reorder points  
- Depreciation / asset lifecycle  
- Vendor invoices / AP  
- Receipt file uploads (later)

---

## Definition of done

- [x] `purchases` table with RLS  
- [x] Admin Purchases page with create/edit/delete  
- [x] Optional `project_id` and `organization_id`  
- [x] Project + business detail sections  
- [x] Nav entry next to Stack  
- [x] Typecheck passes
