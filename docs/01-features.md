# Features

What the assistant does, layer by layer. Each feature states what the student asks, what the assistant does, and where the answer comes from.

**Data source key:**
- **KB** — the portal's curated knowledge base (authored + ingested).
- **Adapter** — the student's own portal records, read through the adapter.
- **Live** — a real-time source pulled at answer time (e.g. the announcement feed).

---

## Layer 1 — Informational

Answers about the school, from knowledge the school has published or authored. Requires **no identity** and works for any visitor.

| Feature | Student asks | Assistant answers from |
| --- | --- | --- |
| Announcements | "Any news this week?" | Live feed + KB |
| Academic calendar | "When does the term start?" | KB |
| Enrollment steps | "How do I enroll?" | KB |
| Clearance process | "How do I clear my account?" | KB |
| Payment how-to | "How do I pay my tuition?" | KB |
| Requirements & checklists | "What do I need for enrollment?" | KB |
| Programs & courses | "What is BSIT about?" | KB |
| Contacts & offices | "Where is the registrar?" | KB |
| Policies & handbook | "What's the grading policy?" | KB |
| General FAQs | "Do you offer scholarships?" | KB |

**Rules:** answers must cite the KB entry they came from. If nothing in the KB covers it, the assistant says so and escalates (see below). No inventing procedures, dates, or amounts.

---

## Layer 2 — Personal

Answers about **this student's own** records. Requires a verified identity (see `03-security.md`). Every read is scoped to the token's student id.

| Feature | Student asks | Assistant answers from |
| --- | --- | --- |
| My grades | "What's my grade in [subject]?" | Adapter |
| My balance & dues | "How much do I still owe?" | Adapter |
| Due dates | "When is my payment due?" | Adapter |
| My enrollment status | "Am I enrolled for next term?" | Adapter |
| My clearance tasks | "What's holding my clearance?" | Adapter |
| My schedule | "What time is my [subject] class?" | Adapter |
| Announcements for me | "Anything I need to act on?" | Adapter + Live |

**Rules:**
- **Computed, not generated.** The adapter returns the fact; the model only phrases it. The model never calculates a balance or infers a grade.
- **Scoped, always.** A tool call can only read the token's student. There is no "look up another student" path.
- **Read-only.** No tool writes, submits, enrolls, or pays.
- **Silent if unverified.** No valid token means no personal answers — the assistant offers the public alternative and the login link.

---

## Layer 3 — Proactive

Things the student did not ask for. In v1 these are surfaced **inside the chat** (the widget shows a badge / an opening nudge), not pushed externally.

| Trigger | Surfaced as |
| --- | --- |
| New announcement relevant to the student | Nudge on next open |
| Grade released | Nudge on next open |
| Payment due soon / overdue | Nudge on next open |
| Clearance item pending | Nudge on next open |
| Enrollment window open | Nudge on next open |

**Rules:** a nudge is a *pointer*, not a payload — it says "your grade in X was released, ask me about it" rather than dumping the grade unprompted. This keeps sensitive data behind an explicit student action.

**Fog:** external push (email, SMS, web push) is out of scope for v1. The polling/trigger model that would drive it is noted in `05-roadmap.md`.

---

## Escalation

When the assistant cannot answer, or the question needs a person, it routes — it does not guess and does not dead-end.

| Situation | Assistant response |
| --- | --- |
| Not in the KB | "I don't have that. Here's who to ask: [office, hours, contact]." |
| Grade dispute | Route to registrar / subject teacher |
| Financial hardship / dispute | Route to cashier / finance office |
| Complaint | Route to the dean's office |
| Out of scope entirely | Politely refuse, restate what it can help with |

**Fog:** filing a ticket into the school's request queue (Edusuite has a *Ticket Requests* module) is a natural next step but is **out of scope for v1** — it turns a read-only assistant into one that writes.

---

## Out of scope (v1)

- Faculty, parents, guardians, and applicant roles.
- Any write action on the portal (enroll, pay, submit, update).
- Live human chat / agent handover.
- External push notifications (email / SMS / web push).
- Self-hosting the model.
- Filing tickets or requests into school systems.

These are not "not yet specified" — they are consciously beyond the destination of this effort. They return only if the destination is redrawn.

---

## Success criteria

The feature set is working when, from the student's side:

- A student can get a correct, sourced answer to a public question without leaving the page.
- A verified student can get their own balance, next due date, grade, and clearance status — and never another student's.
- A student who would have missed a due date or a released grade learns about it the next time they open the chat.
- The assistant never invents a procedure, a date, or an amount.
- When it can't help, the student leaves with the right office to contact, not a dead end.
