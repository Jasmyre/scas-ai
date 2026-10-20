# Roadmap, Risks & Open Questions

Where this goes after the blueprint. The concept stage ends here; everything below is a future effort, sequenced.

---

## Phases

### Phase 0 — Blueprint *(this document set)*
The concept, features, architecture, security model, and integration reality, written for both a decision-maker and a builder. **Done** when the dean can say yes/no to funding a build, and a developer can start without asking a design question.

### Phase 1 — Prototype *(the next effort)*
Prove the pipeline end to end with no real data.

- Mock SCAS portal (a page mimicking the Edusuite student dashboard) hosting the widget.
- Chat service with the four-layer guardrail pipeline.
- Mock adapter with synthetic data.
- A small authored knowledge base.
- Identity handoff via signed token on the mock portal.
- Outcome: you can sit with the dean and *use it* — ask a public question, ask for "my balance," watch an out-of-scope request get refused.

### Phase 2 — Pilot *(needs SCAS + Edusuite)*
Turn the prototype toward reality.

- Real knowledge base authored by SCAS staff.
- Edusuite adapter wired (gated on API access and the data-sharing agreement).
- Attach on a real SCAS-controlled page.
- Pilot with a small student group, opt-in.

### Phase 3 — Adopt / platform
- Onboard additional schools (the multi-tenant promise, realized).
- Proactive delivery beyond in-chat (see fog).
- Only if Phase 2 proved value.

---

## Risks

| Risk | Severity | Mitigation |
| --- | --- | --- |
| **Edusuite won't grant API access** | High | Concept the personal layer behind an adapter; demo entirely with mock data; treat real access as a Phase-2 prerequisite, not a Phase-1 dependency |
| **Edusuite can't host the widget** *(already true)* | High | Two attach paths; Path A (school-controlled page) is primary, Path B (link-out) reaches inside the portal |
| **Identity on the portal path is weak** | High | Documented openly; fail-closed public-only mode as the safe default; resolve before pilot |
| **DPA / data-sharing negotiation stalls** | Medium | Blueprint states the posture; the school drives the agreement |
| **Knowledge base goes stale** | Medium | Content is school-owned and versioned; announcements are pulled live, not re-authored |
| **Guardrails leak under jailbreak** | Medium | Layered enforcement below the model; audit + jailbreak metrics to catch drift |
| **Scope creep beyond students** | Medium | Every other role is explicitly out of scope for v1 |
| **LLM provider changes terms** | Low | Provider-agnostic gateway; no-train/zero-retention is a hard requirement, not a vendor |

---

## Open questions (fog)

In scope, suspected, not yet sharp enough to decide. These graduate into real work as the frontier advances.

- **Proactive delivery channel.** In-chat only in v1. Email / SMS / web push later — but that needs a trigger/polling model and raises consent questions.
- **Ticket filing / write actions.** Edusuite has a Ticket Requests module; letting the assistant file one would make it act, not just answer. Whole new risk class.
- **Conversation quality feedback.** Thumbs up/down, flags to staff for KB gaps.
- **Analytics for the school.** Aggregate, anonymized dashboards of what students ask — where the KB has holes.
- **Multi-portal knowledge sharing.** A school reusing one corpus across portals.
- **Student opt-in mechanics.** How a student declines the assistant without losing portal access.
- **Filipino / Taglish UI copy.** Answers already match the student's language; interface text is English for now.
- **Self-hosted model.** Only if DPA or cost demands it.

---

## What we are *not* doing (out of scope)

Beyond the destination of this effort, not to be resumed within it:

- Faculty, parent, guardian, and applicant roles.
- Any write action on the portal.
- Live human chat.
- Becoming a general-purpose assistant.

If any of these become desirable, they start a **fresh effort** with a redrawn destination — not a resumption of this one.

---

## Decision log

The load-bearing choices, and where they came from. (These are candidates for formal ADRs once code exists — see `docs/adr/` in the domain-modeling convention.)

| Decision | Why |
| --- | --- |
| Students only, v1 | Other roles multiply data, guardrails, and liability |
| School = tenant, portal = sub-resource | Matches how schools buy; keeps isolation clean |
| Personal layer built on an **adapter**, not direct Edusuite calls | Access isn't guaranteed; the mock keeps the concept honest and demoable |
| Widget embeds on school-controlled pages; **link-out** for Edusuite | Edusuite cannot host custom JavaScript |
| Identity via **signed-token handoff**, never in-chat login | Keeps credentials out of the chat; enables fail-closed |
| Four **layered** guardrails | The prompt is not a security control |
| PII kept out of the model; provider must be no-train/zero-retention | DPA posture |
| Escalation routes to offices; ticket-filing deferred | Writing is a different risk class |
| Three dashboard roles | Role sprawl loses the multi-tenant shape |
| Deliverable is a **docs-only blueprint** | The honest scope for a concept stage |
