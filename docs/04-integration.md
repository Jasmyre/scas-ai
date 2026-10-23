# Integration with SCAS & Edusuite

The reality of the environment the assistant must live in, and how it attaches.

---

## The environment

**SCAS's student portal is Edusuite UNI**, a third-party cloud SIS at `scas.edusuite.asia` (observed version 2.10.17.30), by Edusuite (Muntinlupa). SCAS does not self-host it and does not control its code.

What Edusuite's student side already holds — and therefore what the personal layer wants to answer from:

- Announcements
- Grades viewing
- Payment history / account balance / SOA
- Enrollment status / enlistment
- Clearance tasks

Edusuite's stack, as documented publicly:

- **REST APIs with token-based auth** — yes, it has them.
- **Integrations are provisioned by Edusuite's own development team** via API keys. There is **no self-service** way for a third party to get access.
- The platform is documented to align with the **Data Privacy Act of 2012**.

**Consequence:** any access to *real* SCAS student records is a **partnership between SCAS, Edusuite, and this project** — not a configuration toggle. It cannot be assumed, and it is the single biggest "will this deploy" risk.

---

## The attach problem

The original plan was to hand the school a `<script>` to embed in the portal. That plan does not survive contact with Edusuite.

**Finding:** Edusuite's only portal-customization surface is the **Links Manager**, which adds links (name, URL, image, order) to the login/landing page. There is **no custom-JavaScript injection point**. A SaaS like Edusuite does not let an arbitrary script into its DOM, and this one documents no exception.

So the widget **cannot** be embedded in the Edusuite portal. Two attach paths remain.

### Path A — Embed on a page SCAS controls *(primary)*

The `<script>` works on any page the school owns or can edit — the school's own website, a school-hosted student landing page, or any page where SCAS can add a script tag. This is the real target.

- Identity handoff works cleanly here: the page's backend issues the signed token.
- Requires SCAS to have a page it controls, which is a question for the school (the institutional domain is `scas.edu.ph`).

### Path B — Link-out from Edusuite *(fallback for reaching students inside the portal)*

Because Links Manager *can* add a link, SCAS can add an "Ask the Assistant" link on the Edusuite landing page that opens the assistant as a standalone page or popup.

- This reaches students where they already are.
- Identity handoff is weaker: the link must carry a **one-time token** to identify the student, and it cannot know who is logged into Edusuite. Realistically this path starts in **public-only mode** unless SCAS can provide a per-student link — an open question.

**The blueprint specifies both.** Path A is the honest "it works" story; Path B is the pragmatic "at least it's reachable" story. The constraint is stated up front so the dean is not surprised at deployment.

---

## The adapter mapping

The data adapter (`02-architecture.md`) has two implementations.

### Mock implementation *(built now)*

Synthetic, SCAS-shaped data across all six methods — grades, balance, enrollment, clearance, schedule, announcements. Lets the entire pipeline run end to end without touching Edusuite. This is what the concept prototype would use.

### Edusuite implementation *(documented, not wired)*

A mapping from each adapter method to the corresponding Edusuite source. Indicative mapping:

| Adapter method | Edusuite source |
| --- | --- |
| `getGrades` | Grades Viewing (student portal) |
| `getBalance` | Payment History / SOA |
| `getEnrollment` | Enrollment Status / Enlistment |
| `getClearance` | Clearance tasks |
| `getSchedule` | Schedule / Ongoing Classes |
| `getAnnouncements` | Announcements module |

**Grade and schedule field notes:**

- **GWA.** Grades Viewing is the source for per-subject final grades and credit units. If Edusuite exposes a GWA field, the adapter passes it through. If it does not, the adapter computes `Σ(finalGrade × units) / Σ(units)` from the term's grades and returns those inputs alongside. The model only phrases the result.
- **Schedule.** Schedule / Ongoing Classes is the source for subject, section, instructor, room, day, and time. Recurring classes carry the term date range; one-off sessions carry a calendar date. Fields Edusuite leaves blank (usually room or instructor before a term starts) are surfaced as TBA, never inferred.

This implementation is **written as a stub** — real method signatures, real mapping notes, no working credentials — so the concept is honest without pretending access exists.

---

## What would need to happen for real data

If SCAS wants the personal layer to be real:

1. **SCAS decides to adopt** the assistant and authorizes the data sharing.
2. **Edusuite is engaged** to provision API access (their team provisions it).
3. **A data-sharing agreement** is put in place covering purpose, scope, retention, and the DPA roles (SCAS as controller, the platform as processor).
4. **Identity**: SCAS/Edusuite identifies how a logged-in student is vouched-for to a third party (the token source). This is unresolved and is the hardest open question.
5. **Scopes**: exactly which records the assistant may read, per field.
6. **An opt-in**: students should be able to decline the assistant without losing portal access.

Steps 2 and 4 are the blockers. Neither is a coding problem.

---

## Open questions (fog)

These are known, in-scope, and not yet answerable — they depend on facts we don't have:

- Does `scas.edu.ph` exist as a page SCAS controls, and can it host a script?
- Can Edusuite create **per-student** links, or only static ones? (Decides whether Path B can ever be authenticated.)
- Will Edusuite grant a third-party assistant API access at all?
- Does Edusuite expose credit units and a GWA field, or only per-subject grades? (Decides whether the adapter computes the GWA.)
- Are the schedule's room and professor fields populated before the term starts, or do they appear late as TBA?
- What is SCAS's appetite for a formal data-sharing agreement?
- Who at SCAS owns the "page the widget lives on"?

These are questions for the school, not for the builder. They are listed so the blueprint does not pretend they are settled.
