# REQUIREMENTS — Aquavoy

> Multi-milestone, REQ-ID tracked. VAL-* are already shipped (see PROJECT.md). REQ-* are this journey's active work. Proposed — pending approval.

## M1 — Trust & Hardening ✓ COMPLETE (shipped 2026-06-15 → https://aquavoy.vercel.app)

All REQ-1…8 verified and live. See `.planning/archive/milestone-1-trust-and-hardening/`.

| ID | Requirement | Maps to concern | Phase |
|---|---|---|---|
| REQ-1 | Every mutating/PII API route rejects unauthenticated callers (chat, mail send, outlook send, onedrive write, recipients, chat/history) | HIGH-1 | 1 |
| REQ-2 | App access is gated by a real credential check, not a loading splash | HIGH-1 | 1 |
| REQ-3 | A caller's principal is verified, not just shape-whitelisted; one principal cannot read another's history | MED-1 | 1 |
| REQ-4 | Mailbox passwords encrypted at rest; decrypted only server-side at send/IMAP time | HIGH-2 | 2 |
| REQ-5 | OAuth access/refresh tokens encrypted at rest | HIGH-2 | 2 |
| REQ-6 | `scheduled_emails` table exists as a tracked migration matching live schema | migration drift | 3 |
| REQ-7 | `mail_accounts` email-uniqueness constraints reconciled to one source of truth | MED-3 | 3 |
| REQ-8 | Test framework configured; seam tests for Graph/IMAP/SMTP adapters + route-level auth/tool-dispatch | HIGH-3 | 3 |

## M2 — Agent Depth ✓ COMPLETE (shipped 2026-06-17 → https://aquavoy.vercel.app)

All REQ-9…11 verified and live. See `.planning/archive/milestone-2-agent-depth/`.

| ID | Requirement | Phase |
|---|---|---|
| REQ-9 | Durable memory: conversation summarization / semantic recall beyond keyword grep, with a server-side memory store and sweep | 1 |
| REQ-10 | Inline document understanding — read + summarize a drive file within a single agent turn | 2 |
| REQ-11 | Confirm/Undo affordances for destructive tool calls — pending-action staging, human Confirm/Cancel/Undo, scheduled-email isolation | 3 |

## M3 — Operations Polish ✓ COMPLETE (verified 2026-06-17)

All REQ-12…18 verified and live. See `.planning/archive/milestone-3-operations-polish/`.

| ID | Requirement | Source | Phase |
|---|---|---|---|
| REQ-12 | Operator can see which model and provider answered each agent turn — surfaced in the chat UI per response | JOURNEY.md §M3 — observability | 1 |
| REQ-13 | Operator can expand a per-turn tool-call trace showing tool name, argument summary, result summary, and latency — no network tab required | JOURNEY.md §M3 — observability | 1 |
| REQ-14 | Token-usage and latency metrics are stored per agent turn in the database and are queryable (model, provider, tool_calls JSONB, latency_ms, prompt_tokens, completion_tokens) | JOURNEY.md §M3 — observability | 1 |
| REQ-15 | The mail architecture decision (dual-stack vs converge) is recorded as an ADR in `.planning/decisions/` with rationale and the chosen path implemented in code | JOURNEY.md §M3 — two-mail-stack decision | 2 |
| REQ-16 | Whichever stack is authoritative for each mailbox is discoverable at runtime — no silent fallback from one stack to the other; errors surface a human-readable message to the operator | JOURNEY.md §M3 — two-mail-stack decision | 2 |
| REQ-17 | Emails / Files / Prep pages each show a skeleton loader while data is in-flight and an inline error with retry on fetch failure — no blank screen or unhandled JS error | JOURNEY.md §M3 — UX refinement | 3 |
| REQ-18 | All three management pages are usable at 375 px viewport width: no horizontal overflow, tap targets ≥ 44 px, readable type, and a non-empty empty state on each page | JOURNEY.md §M3 — UX refinement | 3 |

## M4 — Handoff ✓ ENGINEERING DELIVERABLES COMPLETE (verified 2026-06-17) · human handover ceremony pending

REQ-19 + REQ-20 fully delivered (docs + deployment/security audit). REQ-21 (QA checklist) and REQ-22 (handover artifacts) are **document-ready** — the prepared checklists are committed, but the live-production QA execution, the client's written acceptance sign-off, the credential ownership transfer, and the removal of Qualia access are **human/business actions performed off-repo** and are intentionally NOT recorded as done. See `.planning/archive/milestone-4-handoff/` and `docs/handover/`.

| ID | Requirement | Source | Phase |
|---|---|---|---|
| REQ-19 | A maintainer or operator can orient from the repo and docs alone: README covers local dev + page map; operator runbook covers the confirm/undo flow, the 12 mailboxes, and the OneDrive connection; env-var reference lists every variable; ADR index links ADR-001 through ADR-004 | JOURNEY.md §M4 — documentation pass | 1 |
| REQ-20 | Production deployment is verified and documented: Vercel cron fires on schedule, all 12 migrations (0001–0012) are applied to prod with no schema drift, RLS is confirmed on every table, no secret (`service_role`, mail creds, API keys) is reachable from client code, and a monitoring approach is documented | JOURNEY.md §M4 — deployment hardening + monitoring | 2 |
| REQ-21 | A QA checklist is produced and all items verified pass on production: auth gate, agent chat with tool trace, confirm/undo a destructive action, send/schedule mail via the IMAP stack, OneDrive file ops (list + download), and all three management pages at 375 px — checklist committed to repo with tester name and date per row | JOURNEY.md §M4 — final QA | 3 |
| REQ-22 | Operator walkthrough delivered to Wency and Jeanette; credential handover checklist completed (Supabase, Vercel, Microsoft app registration, 12 mailbox creds, OpenRouter/Gemini/Tavily keys); client has independent Vercel deploy access; written acceptance sign-off obtained tying back to M1–M3 exit criteria; Qualia developer access removed or downgraded after handover | JOURNEY.md §M4 — knowledge transfer + acceptance | 4 |

## M5 — Client Meeting Build ✓ COMPLETE (shipped 2026-06-20 → https://aquavoy.vercel.app)

Four phases shipped from the 2026-06-18 meeting: recurring scheduling, inbox briefing + Emails reader (A4/A5), per-company + consolidated finance views (ADR-005), batch search-by-sender move-to-trash/folder (A1/A2). Tracked in `.planning/archive/` and JOURNEY §M5. (REQ-IDs were not separately enumerated for M5; work is recorded in JOURNEY + tracking.json. Numbering resumes at REQ-23 for M6.)

## M6 — Invoice Automation ✓ COMPLETE (shipped 2026-06-29 to main, closed 2026-07-02)

Turns the 2026-06-25 meeting into the invoice-automation pipeline: find invoice/credit-note emails → save PDF to OneDrive → generate the per-company invoice from Wency's template → record into finance → do it automatically ~4×/day behind one-click confirm. Plus three agreed quick wins. All six phases built + verified (panel PASS each) + shipped to main 2026-06-29. REQ-23…REQ-30 delivered. Post-ship: the Gefo template was re-authored 2026-07-02 against Wency's REAL 26-001 transportation invoice (`fix/gefo-transport-invoice`) — the placeholder had the Novo Porto crewing structure. Known gap carried to M7 Phase 1: cron-staged finance/voyage proposals (REQ-29) stage without extracted fields and error on confirm; scan-time extraction closes it. Full scope: `.planning/scope-m6.md`.

| ID | Requirement | Source | Phase |
|---|---|---|---|
| REQ-23 | The prep page is removed: `/prep` returns 404, no nav/footer link to it remains, its dead drafting API route + orphaned styles are deleted, and no agent tool path is broken by the removal | 2026-06-25 meeting (Wency: prep has "no advantage") | 1 |
| REQ-24 | A `/tasks` scheduled-tasks oversight page lists reminders + scheduled emails in one timeline with status, mailbox/owner, recurrence, and a working cancel action; data is principal-scoped (an operator sees only their own) and the page has loading/error/empty states | 2026-06-25 meeting (Wency endorsed a tasks page) | 1 |
| REQ-25 | The app installs as a PWA on iPhone: a valid `public/manifest.json` (name, start_url, `display: standalone`, icons) plus `apple-mobile-web-app` meta are served; add-to-home-screen launches standalone (no browser chrome) | 2026-06-25 meeting ("feel like an app") | 1 |
| REQ-26 | A `save_email_attachment` agent tool extracts an email's attachment via IMAP and uploads it to a specified/inferred OneDrive folder; it is staged for confirmation (ADR-003) — nothing writes until approved — and an undo deletes the uploaded item | 2026-06-25 meeting (save voyage/credit-note PDF to a specific OneDrive folder) | 2 |
| REQ-27 | A `generate_invoice_from_template` flow reads a credit-note/voyage PDF, LLM-extracts the invoice fields, fills Wency's actual template (docxtemplater, ADR-007), and saves the result to OneDrive; the correct template is selected per company (GEFO vs others); generation is confirm-before-finalize and the extracted fields are shown for correction before the write | 2026-06-25 meeting (#1 ask: make invoices from his template) | 3 |
| REQ-28 | Voyage economics are recordable and visible: a `voyage_entries` table (ADR-006, RLS-gated) captures route, dates, cargo, tonnage, price/unit, handler provisions, waiting-time days+rate, oil surcharge per company (Aquavoy Shipping, Novo Porto); a confirm-before-write `record_voyage_entry` tool inserts rows; an Excel-register import stages rows from Wency's file; the finance page shows per-company voyage drill-down with correct aggregation | 2026-06-25 meeting (specialized Excel register + extra costs) | 4 |
| REQ-29 | An inbox-scan cron (`/api/mail/scan/run`, ~every 6h, CRON_SECRET-gated, allowlisted in `proxy.ts` + `vercel.json`) classifies new inbox mail as invoice/credit-note/voyage-summary, is idempotent against re-processing the same message, and stages save-attachment/record-finance/generate-invoice proposals into the existing confirm/undo action-stack — never auto-executing financial writes | 2026-06-25 meeting (check email ~4×/day, present what's ready) | 5 |
| REQ-30 | Web-push notifications (PWA) alert the operator when a proposal/action stages for confirmation, with per-event preferences and quiet hours, scoped to the principal; delivery failures are logged, not thrown. (WhatsApp via Telnyx is deferred per ADR-008 pending the business decision.) | 2026-06-25 meeting (Wency: "like a WhatsApp") | 6 |

## M7 — Full Office ✓ SCOPED (2026-07-02) — opened, Phase 1 CURRENT

On 2026-07-02 Wency sent his "perfect flow" wish list (12 items) plus his REAL documents (26-001 Gefo invoice, Gutschrift 26400013, Transportbestätigung, `Reis registratie.xlsx`). This milestone closes the accounting gap M6 left open (cron-staged proposals that error on confirm; generated invoices that upload but never book), then extends the agent from an invoice pipeline into a full office assistant: document/email archive, styled reply drafting, bank reconciliation, phone + WhatsApp, crew-ops leave/flight proposals, and voice input. Client decisions for Phases 2–6 are collected at the **2026-07-03 office meeting** (`.planning/meeting-2026-07-03-brief.md`, Q1–Q10); Phase 1 and Phase 7 need no external input. Payments (wish #10) are explicitly deferred — see note below the table. Full phase detail: `.planning/ROADMAP.md`.

| ID | Requirement | Source | Phase |
|---|---|---|---|
| REQ-31 | The agent auto-populates `company`/amount/year/registerItemId at scan time, so a cron-staged `record_finance_entry`/`record_voyage_entry` proposal confirms without error (closes the M6-P5 known gap — today `inboxScan.ts` stages `company: null` and `executeConfirmedAction.ts` rejects on confirm) | 2026-06-29 M6 close note (known gap: cron-staged proposals stage with `company: null` and error on confirm) | 1 |
| REQ-32 | Every invoice generated by `generate_invoice_from_template` is auto-booked as an income `finance_entry` in the same confirmed action, not left upload-only (today the executor uploads the `.docx` and returns without booking) | 2026-07-02 Wency "perfect flow" message (wish #5 — accounting from received AND sent invoices) | 1 |
| REQ-33 | The agent derives the next free invoice number (max YY-NNN across `Verzonden Facturen/{year}` + 1) and the next voyage/REIS register number without manual input, per the numbering rule confirmed at the meeting | 2026-07-03 office meeting (pending) — Q3 numbering rules | 1 |
| REQ-34 | Register auto-append writes stay blocked until the BUNKERINGEN block position is verified against the real `Reis registratie.xlsx`; the write-gate lifts only after that verification | 2026-07-03 office meeting (pending) — Q2 register file review | 1 |
| REQ-35 | A layover-time invoice generates correctly from a real "Layover time" sample, applying the confirmed LIGGELD rule (95 €/h beyond the free-hours threshold) | 2026-07-03 office meeting (pending) — Q9 layover invoice sample | 1 |
| REQ-36 | Every scanned email body and attachment is archived to Supabase Storage — not just metadata in `processed_messages` as today — and is retrievable per message | 2026-07-02 Wency "perfect flow" message (wish #6 — back up all documents/emails in the app) | 2 |
| REQ-37 | The inbox-scan cron stages `save_email_attachment` proposals with a proposed OneDrive destination folder chosen by a doc-type→folder rule engine (received invoice / credit note / Transportbestätigung / bank doc / other, per company, per year) — not a single hardcoded path | 2026-07-03 office meeting (pending) — Q1 folder-routing table | 2 |
| REQ-38 | A style profile is built from the sent folders of both mailboxes (agent already reads every IMAP folder), capturing Wency's tone, structure, and sign-off patterns | 2026-07-03 office meeting (pending) — Q10 email-style consent | 3 |
| REQ-39 | A thread-aware `draft_reply` tool proposes a reply in Wency's voice for an open thread, staged for confirm before send (nothing sends unreviewed) | 2026-07-02 Wency "perfect flow" message (wish #4 — draft replies "how I would react") | 3 |
| REQ-40 | A Revolut CAMT.053 XML statement import creates `bank_transactions` rows (RLS-gated), idempotent on re-import of the same statement (no duplicate rows on a re-upload) | 2026-07-02 Wency "perfect flow" message (wish #11 — bank statements import) | 4 |
| REQ-41 | Imported bank transactions are matched against existing `finance_entries` by amount/currency/±7-day date window and presented for human confirm — no automatic reconciliation | 2026-07-02 Wency "perfect flow" message (wish #11 — bank statements import) | 4 |
| REQ-42 | An inbound Telnyx NL phone number answers calls with a Retell voice agent that takes a message in English, German, or Dutch | 2026-07-02 Wency "perfect flow" message (wish #7 — phone calls become a message) | 5 |
| REQ-43 | A completed call produces a summarized push notification via the existing `NotificationChannel` seam, and an urgent call can be cold-transferred to Wency's mobile | 2026-07-02 Wency "perfect flow" message (wish #7 — phone calls → message → push summary) | 5 |
| REQ-44 | A WhatsApp channel (Telnyx WhatsApp Business API) delivers the same staged-action/call-summary notifications Wency receives via push today | 2026-07-03 office meeting (pending) — Q6/Q7 WhatsApp cost + number sign-off (ADR-008, OWNER-only) | 5 |
| REQ-45 | Crew leave/absence messages are parsed into a plan-change proposal, cross-checked against the weekly Bargeplanner Data Export Excel, for the planner to apply manually (read-only v1 — Bargeplanner has no public API) | 2026-07-02 Wency "perfect flow" message (wish #9 — Bargeplanner + leave messages) | 6 |
| REQ-46 | A `search_flights` tool returns Duffel flight options with a Duffel Links hosted-checkout link for a human to complete the booking (no automated booking) | 2026-07-02 Wency "perfect flow" message (wish #8 — crew planning → flight plans) | 6 |
| REQ-47 | The chat composer accepts voice input via mic capture + speech-to-text, feeding the same message pipeline as typed text | 2026-07-02 Wency "perfect flow" message (wish #12 — voice commands) | 7 |

**Deferred (no REQ-ID):** Payments (wish #10 — Wency's own words: "later stage") — Revolut Grow-plan API, cert/JWT auth, and a stronger approval model; revisit after Phase 4 proves reconciliation. Tracked in JOURNEY.md §M7 "Deferred beyond M7", not this milestone.

---

*Last updated: 2026-07-02.*
