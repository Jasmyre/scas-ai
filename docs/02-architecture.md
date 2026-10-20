# Architecture

How the pieces fit together. This describes the **target system** the blueprint specifies. The concept stage does not build it.

---

## Components

```
                          ┌─────────────────────────────────────────────┐
                          │              PLATFORM (multi-tenant)         │
                          │                                              │
  Host page               │   ┌────────────┐      ┌───────────────────┐  │
  (school-controlled)     │   │  Dashboard │      │   Chat Service    │  │
  ┌────────────────┐      │   │  (webapp)  │      │                   │  │
  │ <script> widget│──────┼──▶│            │      │  ┌─────────────┐  │  │
  │  [ chat btn ]──┼──┐   │   │  tenants   │      │  │Intent Router│  │  │
  └────────────────┘  │   │   │  portals   │      │  └──────┬──────┘  │  │
                      │   │   │  knowledge │      │         │         │  │
        identity      │   │   │  guardrails│      │  ┌──────▼──────┐  │  │
        handoff       │   │   │  audit     │      │  │ Tool Layer  │  │  │
        (signed       │   │   └────────────┘      │  └──────┬──────┘  │  │
         token)       └───┼───────────────────────────────┐ │         │  │
                          │                               │ │         │  │
                          │                       ┌───────▼─▼──────┐  │  │
                          │                       │  Data Adapter  │  │  │
                          │                       └───────┬────────┘  │  │
                          │                               │           │  │
                          │   ┌──────────────┐   ┌────────▼────────┐  │  │
                          │   │ LLM Gateway  │   │ Knowledge Store │  │  │
                          │   │ (zero-train) │   │  (per-portal)   │  │  │
                          │   └──────────────┘   └─────────────────┘  │  │
                          └──────────────────────────────────────────────┘
                                          │
                             ┌────────────┴────────────┐
                             │  Edusuite (real, later)  │
                             │  or Mock portal (now)    │
                             └──────────────────────────┘
```

| Component | Responsibility |
| --- | --- |
| **Widget** | The embed script. Renders the floating button and chat window on a host page. Performs the identity handoff. Talks only to the Chat Service. |
| **Dashboard** | The management webapp. Schools configure tenants, portals, assistants, knowledge, guardrails, and read the audit trail. |
| **Chat Service** | The runtime brain. Receives a message + identity token, runs the guardrail pipeline, calls tools, composes the answer. |
| **Intent Router** | Classifies the message (in-domain / out-of-domain, which tools permitted) *before* the LLM. See `03-security.md`. |
| **Tool Layer** | The only path to data. Exposes permit-listed tools, each scoped to the verified student. |
| **Data Adapter** | One interface over portal records. Mock implementation now; documented Edusuite implementation later. |
| **Knowledge Store** | Per-portal knowledge base + vector index for retrieval. |
| **LLM Gateway** | The single outbound boundary to the model. Enforces no-train / zero-retention and PII minimization. |

---

## Multi-tenancy

Tenancy is the backbone of the data model. The chosen shape: **school = tenant, portal = sub-resource.**

```
School (tenant)
  └── Portal (e.g. "SCAS Edusuite UNI")
        ├── Assistant (knowledge, rules, guardrails)
        ├── Knowledge base entries / documents
        ├── Identity config (token secret, allowed host origins)
        └── Conversation + audit records (per student)
  └── Staff (School Admin, Content Editor, Analyst)
```

**Isolation rules:**
- Every stored row carries a `school_id`. Nothing crosses tenants, ever.
- A portal belongs to exactly one school. An assistant belongs to exactly one portal.
- Knowledge, guardrails, and identity secrets are **per portal** — two portals under one school do not share a corpus by default.
- The same student id from two different schools is two different people. Identity is `(school, student)`.

**Not v1:** cross-portal knowledge sharing, shared guardrail templates across schools, self-service tenant signup. Note them as roadmap, not architecture.

---

## The adapter interface

The adapter is the *only* way the assistant reaches portal data. Keeping it an interface — not a direct Edusuite call — is what lets the concept be honest and demoable before Edusuite access exists.

```
getGrades(student)        -> [{ subject, term, grade, status }]
getBalance(student)       -> { amount, currency, dueDates[] }
getEnrollment(student)    -> { term, status, subjects[] }
getClearance(student)     -> [{ item, status, dueDate }]
getSchedule(student)      -> [{ subject, day, time, room }]
getAnnouncements(student) -> [{ id, title, body, publishedAt, relevantToStudent }]
```

- **Mock implementation (now):** seeded with synthetic SCAS-shaped data so the whole pipeline runs end to end.
- **Edusuite implementation (later):** documented against Edusuite's modules but not wired. See `04-integration.md`.

Every method takes a `student` that originates from a verified token. The adapter never accepts a student id from the model.

---

## Request flow

What happens when a student sends a message:

1. **Widget → Chat Service.** Message + identity token.
2. **Verify identity.** Token signature and expiry checked. Invalid → public-only mode (fail closed).
3. **Intent Router.** Message classified: in-domain (informational / personal / proactive) or out-of-domain. Out-of-domain → refusal, logged, stop.
4. **Tool selection.** Router decides which permit-listed tools the message needs. No tool runs unless permitted.
5. **Tool execution.** Tools call the adapter, scoped to the verified student. Facts computed at the data layer.
6. **LLM Gateway.** Only the *phrasing* goes to the model: retrieved KB snippets and computed facts, never credentials, never raw record dumps, never another student's data.
7. **Compose + cite.** Answer returned with its source (KB entry or "your portal records").
8. **Audit.** Message, classification, tools called, and outcome appended to the audit trail.
9. **Widget renders** the answer.

Proactive nudges use the same pipeline on open: the service checks triggers and offers pointers, not payloads.

---

## Embed widget

The script is designed to be dropped onto **any page the school controls**.

```html
<script
  src="https://<platform>/embed.js"
  data-portal="scas-edusuite-uni"
  data-token-endpoint="/api/chat-token"
  async
></script>
```

| Attribute | Meaning |
| --- | --- |
| `data-portal` | Which assistant to load. |
| `data-token-endpoint` | Where the host page's server issues the short-lived identity token (blank = public-only mode). |
| `data-theme` | Optional branding (colour, position, greeting). |

**Constraint:** this works only on pages the school controls. It **cannot** be injected into Edusuite — see `04-integration.md` for the link-out fallback.

---

## Dashboard roles

| Role | Scope | Can |
| --- | --- | --- |
| **Platform Owner** | All tenants | Provision schools, portals, assistants; platform-wide ops |
| **School Admin** | One school | Configure portals, staff, knowledge, guardrails; read audit trail |
| **Content Editor** | One school | Author and publish knowledge; cannot change guardrails or staff |

Three roles, deliberately. Role sprawl is where multi-tenant dashboards lose their shape.

---

## Deliberately deferred

Decisions this blueprint does **not** make, and why:

- **Specific LLM provider** — the architecture requires *a* gateway with no-train/zero-retention; the vendor is swappable and not a concept decision.
- **Hosting / cloud** — not a concept decision.
- **Vector store choice** — an implementation detail behind the Knowledge Store.
- **Auth for dashboard staff** — conventional; not differentiating; decide at build.
