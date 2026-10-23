# SCAS AI Assistant — Concepts & Vision

A multi-tenant platform for embedding an AI assistant into a school's portal, so students can ask questions and get answers grounded in the school's own knowledge and in their own portal records.

This is the concept stage: a blueprint, not a build. It is written to be read by two audiences at once — an SCAS decision-maker deciding whether to fund a build, and a developer who will build it.

---

## The problem

SCAS students already have a portal: **Edusuite UNI** at `scas.edusuite.asia`. It holds announcements, grades, payment history, enrollment status, the account balance, and clearance tasks. But the portal is a *place to look things up*, not a thing that *tells you what you need to know*.

The result is predictable:

- A student only discovers their balance or a due date by going in and hunting for it.
- Grade releases, enrollment windows, and clearance holds are missed until they cause a problem.
- Administrative questions ("how do I clear my account?", "when is the deadline?", "how do I pay?") are answered human-to-human, over and over, by staff who already wrote the answer down somewhere.
- Announcements are posted but not *delivered to the people they concern*.

The school pays for this in staff time and in student confusion. The students pay for it in late payments, missed windows, and stress.

## What we are building

Two cooperating pieces:

1. **A management webapp ("the dashboard").** Where a school sets up and runs its chatbots: the knowledge they may use, the rules and guardrails they obey, the portals they serve, and a record of what students asked and how the assistant answered.

2. **An embeddable chat script.** A small `<script>` a school drops onto a page it controls. It renders a floating chat button; clicking it opens the assistant. The host page vouches for *who* the visitor is, so the assistant can answer personal questions.

The platform is **multi-tenant**. Many schools can use it. Each **school** is a tenant; a school owns one or more **portals**; each portal has its own **assistant** with its own knowledge, rules, and guardrails.

The first and reference tenant is **SCAS**.

## What it is not (v1 scope)

- **Not for faculty, parents, guardians, or applicants.** Students only. Every other role is a different data surface, a different guardrail, and a different liability.
- **Not a replacement for Edusuite.** The assistant sits beside the portal and reads from it; the portal remains the system of record.
- **Not an agent that acts on the account.** It reads and answers. It does not enroll, pay, submit, or change anything.
- **Not a live human chat.** When a student needs a person, the assistant routes them to the right office. It does not staff a help desk.
- **Not a general-purpose chatbot.** It refuses anything outside its domains (see `03-security.md`).

## The assistant's three jobs

The value is layered. Each layer is useful alone; together they are the product.

1. **Informational** — answers public school questions from a curated knowledge base: announcements, the academic calendar, enrollment steps, clearance procedure, payment channels, program and course info, contacts, policies, FAQs.

2. **Personal** — answers questions about *this* student's own portal records: my grades, my balance and due dates, my enrollment status, my clearance tasks, my schedule.

3. **Proactive** — surfaces things the student did not ask for but needs: a grade was released, a payment is due, a clearance item is pending, an announcement concerns you, enrollment is open.

**The personal layer is the differentiator.** A public FAQ bot is a commodity. An assistant that knows *your* balance, *your* clearance, *your* released grade — without leaking anyone else's — is the thing worth building.

## Principles

These hold across every part of the system. When a design choice conflicts with one, the principle wins.

- **Grounded or silent.** If the assistant does not know, it says so and routes to a human. A confident wrong answer about grades or money is worse than "I don't know."
- **Identity, never in the chat.** The chat is not where you log in. The host page vouches for the student; the chat never asks for a password.
- **The prompt is not the fence.** An LLM told "don't" is not a security control. Scope is enforced at the router, the tool allowlist, and the data layer.
- **PII stays out of the model.** The data layer computes the fact ("balance: ₱12,400, due Nov 15"); the model only phrases it. Raw records never become free text in a third-party model's context.
- **Fail closed.** A missing, expired, or forged identity token yields public answers only — never personal data.
- **The school owns its content.** Knowledge and rules are authored and versioned per tenant, not baked into the platform.

---

## Language (glossary)

The shared vocabulary for this project. Use these words; avoid the alternatives listed.

### Tenancy

**School**:
An institution using the platform. The tenant. Owns its own data, portals, staff, and knowledge.
_Avoid_: Organization, account, client, customer

**Portal**:
A specific student-facing site or system a school runs (e.g. SCAS's Edusuite UNI portal). The unit a chatbot is attached to and scoped by.
_Avoid_: Site, instance, deployment

**School Admin**:
A school-side person who operates the dashboard for their tenant — configures portals, staff, knowledge, and guardrails. At SCAS, the intended first holder is the dean.
_Avoid_: Tenant admin, client admin, owner

### The assistant

**Assistant**:
The configured chatbot for one portal: its knowledge, rules, guardrails, and identity wiring. One portal has one assistant.
_Avoid_: Bot, agent, chatbot (as a noun for the configured thing)

**Widget**:
The floating chat button and chat window rendered by the embed script on a host page.
_Avoid_: Button, launcher, bubble

**Host page**:
Any web page a school controls that embeds the widget (a page on the school's own site, or a link-out target reached from the portal).
_Avoid_: Embed site, parent page

**Knowledge base**:
The curated content an assistant is allowed to answer from — authored entries and ingested documents, scoped to one portal.
_Avoid_: Corpus, dataset, training data

### Security

**Identity handoff**:
The mechanism by which a host page passes a verified student identity to the widget via a short-lived signed token. The chat never authenticates.
_Avoid_: Login, SSO, sign-in

**Guardrail**:
Any mechanism that limits what the assistant will do. There are four layers; see `03-security.md`.
_Avoid_: Filter, moderation, safety check

**Intent router**:
The component that classifies an incoming message as in-domain or out-of-domain *before* the LLM sees it, and picks which tools (if any) it may use.
_Avoid_: Classifier, dispatcher

**Tool**:
A permit-listed function the assistant may call (e.g. `getBalance`, `getAnnouncements`). The only way the assistant reaches data.
_Avoid_: Function, action, API call

**Row-level scoping**:
Enforcing at the data layer that a tool call can only ever read rows belonging to the verified student in the token.
_Avoid_: Access control, permissions (too broad)

### Data

**Adapter**:
The single interface through which the assistant reads portal data (`getGrades`, `getBalance`, `getEnrollment`, `getClearance`, `getSchedule`, `getAnnouncements`). Has a mock implementation and a documented Edusuite implementation.
_Avoid_: Connector, integration layer, service

**GWA (general weighted average)**:
The unit-weighted average of a student's final grades for a term, or across terms. Computed by the adapter and returned with its inputs; never calculated by the model.
_Avoid_: Average grade, GPA

**Schedule**:
A student's own class meetings for a term, each carrying subject, section, professor, room, day, date, and start–end time.
_Avoid_: Timetable, calendar

**Escalation**:
Routing a student to the correct human office and contact details when the assistant cannot or should not answer.
_Avoid_: Handoff, fallback, transfer

**Audit trail**:
The per-tenant record of conversations, refusals, out-of-scope attempts, and tool calls, visible to the School Admin.
_Avoid_: Logs, history, analytics

_See `01-features.md` for what each layer does, `02-architecture.md` for how it fits together._
