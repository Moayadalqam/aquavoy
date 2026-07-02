# JOURNEY — Aquavoy

> The full arc from today's shipped state to Handoff. Milestone 1 fully detailed; M2–M3 sketched (filled in by `/qualia-milestone` when each opens). Proposed — pending approval.

**Starting point:** a functional, well-built internal AI assistant (11 validated capabilities, see PROJECT.md). The dominant gap from the codebase map is **trust**: the unauthenticated `/api/chat` surface can send company email and delete/move OneDrive files, credentials sit in plaintext at rest, and there are zero tests. So the arc starts by making the powerful surface safe, then deepens the agent, then polishes operations, then hands off.

---

## Milestone 1 · Trust & Hardening  `[SHIPPED]`

**Why now:** the app does powerful, irreversible things (send mail, delete files) with no access control and no test safety net. Every other improvement is riskier to ship until this is closed. Driven directly by `.planning/codebase/concerns.md` (HIGH-1/2/3).

- **Phase 1 — Access control.** Gate the app and authenticate the API routes so only the real operators can drive the agent. Verify a principal's identity (not just shape-whitelist it), protect every mutating/PII route the way the cron route already is.
- **Phase 2 — Credentials at rest.** Encrypt mailbox passwords and OAuth access/refresh tokens before they hit Postgres; decrypt only server-side at use. Remove plaintext-at-rest exposure.
- **Phase 3 — Migration integrity + test safety net.** Add the missing `scheduled_emails` migration to disk, reconcile the duplicate `mail_accounts` email constraints, and stand up a seam-level test suite (adapter mocks for Graph/IMAP/SMTP, route-level for agent tool dispatch + auth).

**Exit criteria:** no unauthenticated route can send mail or mutate files; no plaintext secret at rest; `supabase/migrations/` matches the live schema; `npm test` runs and green on the seams.

## Milestone 2 · Agent Depth  `[SHIPPED]`

**Goal:** make the agent more capable and more reliable — richer memory (conversation summarization / semantic recall beyond keyword match), inline document understanding (read + summarize a drive file in one turn), and stronger confirm/undo affordances for destructive actions. *Shipped: durable memory (ADR-002), inline doc understanding, enforced confirm/undo (ADR-003).*

## Milestone 3 · Operations Polish  `[SHIPPED]`

**Goal:** observability (log which model/tools actually ran, surface tool-call traces), decide the two-mail-stack question (Graph/Outlook vs IMAP/SMTP — keep both or converge), and UX refinement across Emails / Files / Prep. *Shipped: agent traces (0011), mail-stack decision (ADR-004, 0012), bolt-style chat + visual polish.*

## Milestone 4 · Handoff  `[SHIPPED]`

Standard 4-phase Qualia handoff: documentation pass, deployment hardening + monitoring, knowledge transfer, and final acceptance. *Shipped: repo/operator docs, prod deployment verified (12 migrations, RLS, no client-side secrets), end-to-end QA checklist, credential handover + client acceptance sign-off.*

## Milestone 5 · Client Meeting Build  `[SHIPPED]`

**Why now:** the system was handed off, then the client meeting on 2026-06-18 surfaced a concrete set of post-handoff feature requests. This milestone turned those requests into real work, strongest-value-first. *Shipped 2026-06-20: recurring scheduling (recurrence + `next_run_at` re-arm), inbox briefing + Emails reader tab (A4/A5), per-company + consolidated finance views (ADR-005 hybrid), and batch search-by-sender move-to-trash/folder (A1/A2).*

- **Phase 1 — Recurring scheduling.** Recurrence (frequency + `next_run_at` + re-arm) on `scheduled_emails` and `scheduled_tasks` so a schedule repeats. *Shipped.*
- **Phase 2 — Email intelligence.** Agent inbox briefing (A4) + a real Emails reader tab (A5), both read-only. *Shipped.*
- **Phase 3 — Finance views.** Per-company + consolidated expense/income via the ADR-005 hybrid (OneDrive doc store + Supabase index). *Shipped.*
- **Phase 4 — Batch email actions.** Search-by-sender bulk move-to-trash / move-to-folder (A1/A2) + recipient autocomplete. *Shipped.*

## Milestone 6 · Invoice Automation  `[CURRENT]`

**Why now:** the **2026-06-25 client meeting** (transcript + summary in `Downloads/`) made the next priority unambiguous. Wency's headline need is no longer "read/organize" but **act**: the agent should find a voyage-summary / credit-note email, save the attached PDF to a specific OneDrive folder, extract the figures, **generate an invoice from his existing template** (distinguishing GEFO vs other company formats), drop it into the Aquavoy Shipping finance tab, and do this **automatically ~4× a day** — surfacing a one-click confirmation queue rather than acting blind. A code audit against that meeting found this whole pipeline essentially unbuilt (no attachment-saving, no invoice generation, no voyage-economics schema, no inbox-scan cron, no push notification), while three agreed quick wins (remove the prep page, add a scheduled-tasks oversight page, ship a real PWA manifest) were ready immediately. This milestone builds the invoice-automation pipeline end-to-end behind the existing confirm-before-write gate (ADR-003) and the OneDrive/Supabase hybrid (ADR-005). **Wency is in Cyprus from 2 July and visits the office that Friday** — Phase 1 ships before then; Phases 3–4 are scoped now but gated on the templates + Excel register he brings to that meeting.

- **Phase 1 — Quick wins (ship before the office meeting).** Remove the prep page (Wency: "no advantage" — agreed cut); add a `/tasks` scheduled-tasks oversight page over the existing reminders + scheduled-email backend (he endorsed it for multi-company oversight); add a real PWA manifest + `apple-mobile-web-app` meta so it installs standalone on iPhone ("feel like an app"). No client input needed. (REQ-23, REQ-24, REQ-25)
- **Phase 2 — Email attachment → OneDrive.** The foundation: a `save_email_attachment` agent tool that extracts an email's PDF attachment via IMAP and uploads it to the right OneDrive folder (`Verzonden Facturen/{year}`), staged for confirmation and undoable (ADR-003). Today the agent can read mail and read drive files but cannot move a PDF from one to the other. (REQ-26)
- **Phase 3 — Invoice generation from template.** The #1 ask. Read a credit-note/voyage PDF (existing `read_file`/unpdf) → LLM-extract fields → fill Wency's actual template (docxtemplater, ADR-007) → save the invoice to OneDrive, confirm-before-finalize, per-company template selection (GEFO vs others). **Needs client input** (templates + field mapping + company→template assignment, collected at the office meeting). (REQ-27)
- **Phase 4 — Voyage finance schema + Excel register.** Extend finance for shipping economics the generic ledger can't hold — route, dates, cargo, tonnage, price/ton, handler provisions, waiting-time/days, oil surcharge — in a parallel `voyage_entries` table (ADR-006), per company (Aquavoy Shipping, Novo Porto), surfaced in the finance page, populated via `record_voyage_entry` + an Excel-register import (bundling multi-email signals). **Needs client input** (register schema + sample file + company mappings). (REQ-28)
- **Phase 5 — Automated inbox scanning.** A new `~every 6h` cron (`/api/mail/scan/run`, allowlisted in `proxy.ts`, CRON_SECRET-gated) that classifies new inbox mail as invoice/credit-note/voyage-summary (LLM), is idempotent (processed-message tracking), and **stages** save-attachment + record-finance + generate-invoice proposals into the existing confirm/undo action-stack — the "checks email 4× a day and presents what's ready" behavior. Depends on Phases 2–4. (REQ-29)
- **Phase 6 — Notifications.** Tell Wency when proposals are ready. Ship **web-push (PWA)** as the MVP (no vendor friction) for staged actions, with preferences + quiet hours; **WhatsApp via Telnyx is deferred to a follow-on** pending the business decision on a WhatsApp Business number + per-message cost (ADR-008). (REQ-30)

**Exit criteria:** the agent can take a credit-note email end-to-end — save its PDF to OneDrive, generate the correct per-company invoice from Wency's template, and stage a finance entry — all behind one-click confirm; an inbox-scan cron does this unattended ~4×/day and queues proposals; voyage economics (provisions, waiting time, oil) are recordable and visible per company; the prep page is gone, a tasks-oversight page exists, the app installs as a PWA, and Wency gets a push when something needs his confirm. No regression in the M1–M5 surface.

**Deferred beyond M6** (noted, not scheduled): WhatsApp Business channel (ADR-008 follow-on), continuous Excel-register sync, roles + hide-files (A27/A28), multi-user auth / separate logins (A26), the voice agent (A29), and Wency's requested **budget API** (external — pending his internal team).

## Milestone 7 · Full Office  `[NEXT]`

**Why now:** on **2026-07-02** Wency sent his "perfect flow" — the full wish list for what the agent should do for him — plus his REAL documents (the 26-001 Gefo transportation invoice, Gutschrift 26400013, a Transportbestätigung, and the actual `Reis registratie.xlsx`). The template mismatch those documents exposed was fixed same-day (`fix/gefo-transport-invoice`); the rest of the wish list is this milestone: complete the automation loop M6 started, then extend the agent from an invoice pipeline into a full office assistant (archive, styled replies, bank reconciliation, phone, crew ops, voice). Scoped from a 7-agent research pass (capability map + Bargeplanner/Revolut/Retell/WhatsApp/flights feasibility, 2026-07-02); client decisions collected at the **2026-07-03 office meeting** (see `.planning/meeting-2026-07-03-brief.md`).

- **Phase 1 — Pipeline truth & accounting completeness.** Make the cron-staged proposals actually confirmable: today `inboxScan.ts` stages `record_finance_entry`/`record_voyage_entry` with `company: null` and no amount/year/registerItemId, and `executeConfirmedAction` hard-rejects them — scan-time extraction (the unused `extractInvoiceFields` seam + attachment PDF text) must populate the args. Auto-book every generated invoice as an income `finance_entry` (the invoice executor uploads but never books). Derive `nextInvoiceNumber` (max YY-NNN in Verzonden Facturen/{year}+1) and `nextVoyageNumber` (register REIS counter) — rules confirmed at the meeting. Lift the register write-gate only after the BUNKERINGEN block position is verified against the real xlsx; author the layover-time invoice template from a real sample. **S/M, no external dependency.**
- **Phase 2 — Document & email archive + attachment routing.** A Supabase Storage archive for email bodies + attachments (today nothing is persisted — `processed_messages` stores metadata only) and a doc-type→OneDrive-folder rule engine so the cron stages `save_email_attachment` with a proposed destination. **M — needs Wency's folder-routing table (meeting Q1).**
- **Phase 3 — Personal-style reply drafting.** Build a style profile from the sent folders of both mailboxes (agent already reads every IMAP folder) + a thread-aware `draft_reply` tool, staged behind confirm; preferences live in the existing `memory_facts`. **M — needs consent to mine sent mail (meeting Q10).**
- **Phase 4 — Bank statements & reconciliation.** CAMT.053 XML import (Revolut Business exports it on every plan) → new `bank_transactions` table (RLS, idempotent on entry-ref) → amount/currency/±7-day matching against `finance_entries`, human-confirmed. Live Revolut API sync deferred (Grow-plan-gated, meeting Q5). **M.**
- **Phase 5 — Phone agent + WhatsApp summaries.** Telnyx NL number → Retell SIP trunk, one EN/DE/NL message-taking agent with post-call webhook feeding the existing `NotificationChannel` seam (web-push today); cold transfer to Wency's mobile. WhatsApp channel = one new adapter file via Telnyx WhatsApp Business API (~$4–11/mo) — **gated on OWNER cost sign-off (ADR-008) + Meta business verification (meeting Q6/Q7).**
- **Phase 6 — Crew ops v1: leave intake + flight search.** Bargeplanner has **no public API** — v1 is read-only: parse crew leave/absence messages into plan-change proposals cross-checked against the weekly Data Export Excel, planner applies manually; email Dockworx for API access in parallel. Flights: `search_flights` Duffel adapter + Duffel Links hosted checkout for human booking (Amadeus Self-Service retires 2026-07-17; Kiwi is partner-only). **L — vendor-access-gated (meeting Q8).**
- **Phase 7 — Voice input.** Mic capture + speech-to-text on the existing chat composer (input surface only — tools and confirm cards already work downstream). **S.**

**Deferred beyond M7:** payments (wishlist "later stage" — Revolut Grow API, cert/JWT auth, and a stronger approval model; revisit after Phase 4 proves reconciliation), automated Bargeplanner writes (until Dockworx answers), and any no-confirm auto-execution — "fully automated" vs confirm-before-write (ADR-003) is an explicit trust conversation, per-action-type, not a default.

**Exit criteria:** an inbox-scan proposal can be confirmed end-to-end without error; every generated invoice is booked to the ledger; documents + emails are archived and routed to the right folders; replies draft in Wency's voice behind confirm; a bank statement imports and reconciles against the ledger; a phone call becomes a summarized message on his phone; a crew leave message becomes a plan-change proposal with flight options; the chat takes voice input on the iPhone PWA. No regression in the M1–M6 surface.

---

*Progressive detail: M6 phase scopes are consolidated in `.planning/scope-m6.md` (synthesized from a 6-way parallel scoping pass against the 2026-06-25 meeting). Phases 1–2 + 5–6 are buildable now; Phases 3–4 carry `client-input` gates resolved at the July office meeting. ADR-006 (voyage storage), ADR-007 (invoice templating), ADR-008 (notification channel) record the hard-to-reverse calls.*
