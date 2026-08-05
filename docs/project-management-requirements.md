# Lightweight Project Management — Requirements

Audience: North Shore Process Solutions (internal delivery after deposit).
Surface: Admin **Projects** list + project workspace.
Principle: Lightweight — enough to run delivery without becoming a full PM suite.

---

## Personas

- **Delivery owner** — runs active engagements day to day.
- **Owner / principal** — needs a quick read on which projects need attention.

---

## Epic acceptance criteria (user stories)

### Portfolio (Projects list)

1. As a delivery owner, I should be able to see all projects in one list so that I know what is in flight and what is finished.
2. As a delivery owner, I should be able to filter projects by status so that I can focus on active work.
3. As a delivery owner, I should be able to see each project’s priority so that I know what to work on first.
4. As a delivery owner, I should be able to see the next action and its due date on each project so that I know what is due soon without opening every project.
5. As a delivery owner, I should be able to see how many open tasks a project has so that I can spot overloaded or stalled work.
6. As an owner, I should be able to see portfolio KPIs (in progress, overdue next actions, projects past target end) so that I can triage risk quickly.
7. As a delivery owner, I should be able to open a project from an Actions column so that row content stays scannable and non-interactive.

### Project identity & control

8. As a delivery owner, I should be able to name a project and set its status (planning, active, on hold, completed, cancelled) so that the engagement state is explicit.
9. As a delivery owner, I should be able to set priority (low / normal / high) so that urgency is visible in the portfolio and on the project.
10. As a delivery owner, I should be able to record start date and target end date so that I know whether delivery is on track.
11. As a delivery owner, I should be able to capture scope / internal summary so that context survives beyond the original inquiry.
12. As a delivery owner, I should be able to set a next action and next-action due date so that every project has a clear “what’s next.”

### Customer context

13. As a delivery owner, I should be able to see the customer contact (business, name, email, phone) so that I can reach them without leaving the project.
14. As a delivery owner, I should be able to see the original inquiry so that I remember why they hired us.
15. As a delivery owner, I should be able to jump to the CRM business so that business history and relationships stay one click away.

### Tasks (lightweight work breakdown)

16. As a delivery owner, I should be able to add tasks to a project so that delivery work is broken into concrete steps.
17. As a delivery owner, I should be able to mark tasks complete / incomplete so that progress is visible.
18. As a delivery owner, I should be able to set an optional due date on a task so that deadlines are explicit.
19. As a delivery owner, I should be able to delete a task so that the list stays current.
20. As a delivery owner, I should be able to see open vs completed tasks at a glance so that I know remaining work.

### Schedule

21. As a delivery owner, I should be able to see the next upcoming event on the project so that the imminent meeting is obvious.
22. As a delivery owner, I should be able to schedule a new event from the project so that onsites/calls stay attached to delivery.
23. As a delivery owner, I should be able to view all project events in a popup so that I do not leave the workspace.
24. As a delivery owner, I should be able to toggle past events in that list so that history is available without cluttering the default view.
25. As a delivery owner, I should be able to open an event to edit or delete it so that the schedule stays accurate.

### Communication & history

26. As a delivery owner, I should be able to email the customer from the project so that outreach is logged against delivery, not buried in Pipeline.
27. As a delivery owner, I should be able to log activities (notes, calls, meetings, emails) on the project so that the working record is complete.
28. As a delivery owner, I should be able to see lead history that carried over at convert so that discovery and sales context are not lost.
29. As a delivery owner, when a lead converts to a project, I should get the lead’s activities and calendar events attached automatically so that I do not rebuild the timeline by hand.

### Out of scope for this lightweight release

- Client-facing portal / shared task boards
- File / proposal attachments
- Multi-assignee / team roles
- Time tracking / billable hours
- Invoicing / payment milestones UI
- Task dependencies, Gantt, or resource capacity
- Automated reminders / notifications

These may be added later without changing the core model above.

---

## Definition of done (lightweight v1)

- [x] Requirements above for stories 1–29 are implemented (1–29 covered; out-of-scope items remain deferred)
- [x] Projects list supports status filter + priority / next action / open-task signal
- [x] Project workspace is a dashboard: contact, events, tasks, activity, details
- [x] `project_tasks` exists with RLS; project gains priority, target end, next action, scope fields
- [x] Convert still attaches lead history to the project
- [x] Typecheck passes

---

## Implementation notes

Prefer:

- Tasks as first-class rows (not activity-type notes)
- Next action as project-level fields (fast to scan in the list)
- Events remaining on `calendar_events` with `project_id`
- Activity log remaining the dated communication stream
