# Roadmap · Milestone 7 · Full Office

**Project:** Aquavoy
**Milestone:** 7 (CURRENT)
**Created:** 2026-07-02
**Phases:** 7
**Source:** Wency's 2026-07-02 "perfect flow" message + real documents (26-001 Gefo invoice, Gutschrift 26400013, Transportbestätigung 25-104607, `Reis registratie.xlsx`) + a 7-agent research pass (capability map + Bargeplanner/Revolut/Retell/WhatsApp/flights feasibility). Client decisions collected at the 2026-07-03 office meeting — `.planning/meeting-2026-07-03-brief.md` (Q1–Q10).
**Requirements covered:** REQ-31 … REQ-47 (see `REQUIREMENTS.md` §M7)

See `JOURNEY.md` for the full project arc. This file is ONLY the current milestone's phases.

## Exit Criteria

What "shipped" means for this milestone:

- **The invoice pipeline is finally trustworthy.** A cron-staged proposal confirms end-to-end without error, and every generated invoice books itself to the ledger (REQ-31, REQ-32) — closing the defect M6 shipped with.
- **Nothing scanned is lost.** Documents + emails are archived to Supabase Storage and routed to the right OneDrive folder per Wency's routing table (REQ-36, REQ-37).
- **Replies sound like him.** A drafted reply reflects his voice, staged behind confirm (REQ-38, REQ-39).
- **The bank agrees with the ledger.** A CAMT.053 statement imports and reconciles against `finance_entries`, human-confirmed (REQ-40, REQ-41).
- **The phone is covered.** A call becomes a summarized push (and WhatsApp, if approved) (REQ-42, REQ-43, REQ-44).
- **Crew ops has a v1.** A leave message becomes a plan-change proposal; flight options are searchable with a human-completed booking (REQ-45, REQ-46).
- **The app takes voice input** on the installed iPhone PWA (REQ-47).
- **No regression** in the M1–M6 surface (auth, encryption, traces, confirm/undo, recurring scheduling, finance/voyage views, batch mail, PWA install, web-push).

---

## Phases

| # | Phase | Goal | Requirements | Status |
|---|-------|------|--------------|--------|
| 1 | Pipeline truth & accounting completeness | Close the M6-P5 confirm-error gap; auto-book every generated invoice; derive numbering | REQ-31, REQ-32, REQ-33, REQ-34, REQ-35 | CURRENT |
| 2 | Document & email archive + attachment routing | Persist every scanned email/attachment; route saves to the right folder | REQ-36, REQ-37 | — |
| 3 | Personal-style reply drafting | Draft replies in Wency's voice, staged behind confirm | REQ-38, REQ-39 | — |
| 4 | Bank statements & reconciliation | Import CAMT.053 statements and match against the ledger | REQ-40, REQ-41 | — |
| 5 | Phone agent + WhatsApp summaries | A call becomes a summarized push (and WhatsApp, if approved) | REQ-42, REQ-43, REQ-44 | — |
| 6 | Crew ops v1: leave intake + flight search | Leave message → plan-change proposal; flight search with human booking | REQ-45, REQ-46 | — |
| 7 | Voice input | Mic capture + speech-to-text on the chat composer | REQ-47 | — |

## Phase Details

### Phase 1: Pipeline truth & accounting completeness

**Goal:** Every cron-staged finance/voyage proposal confirms cleanly and every generated invoice books itself to the ledger — the automation Wency watches live at Friday's meeting must actually complete end-to-end, closing the defect M6 shipped with.

**Touches:** `src/lib/mail/inboxScan.ts` (scan-time extraction, lines 107/122 currently stage `company: null`), `src/lib/agents/invoiceExtraction.ts` (`extractInvoiceFields` — built in M6 but unused by the scan path), `src/lib/agents/executeConfirmedAction.ts` (`generate_invoice_from_template` case — add the ledger booking it currently skips; `record_finance_entry`/`record_voyage_entry` cases already reject on missing `company`), `src/lib/finance/ledger.ts` + `voyageLedger.ts` (numbering derivation), `src/lib/finance/excelRegister.ts` (write-gate check against the real BUNKERINGEN position), new/updated invoice template for layover-time (LIGGELD).

**Requirements covered:**
- REQ-31: scan-time extraction populates `company`/amount/year/registerItemId so cron-staged `record_finance_entry`/`record_voyage_entry` confirms without error (today `inboxScan.ts:107,122` stages `company: null` and `executeConfirmedAction.ts` hard-rejects with "company is required" on confirm — the unused `extractInvoiceFields` seam + attachment PDF text must populate the args)
- REQ-32: generated invoices auto-book as income `finance_entry` rows (today the `generate_invoice_from_template` executor uploads the `.docx` and returns `{ generated: true, itemId, ... }` with no ledger write — confirmed by reading `executeConfirmedAction.ts`'s invoice case end-to-end)
- REQ-33: `nextInvoiceNumber` (max YY-NNN in `Verzonden Facturen/{year}` + 1) and `nextVoyageNumber` (register REIS counter) derivation, per the numbering rule confirmed at the meeting
- REQ-34: register write-gate stays enforced until the BUNKERINGEN block position is verified against the real xlsx
- REQ-35: layover-time invoice template authored from a real sample, applying the confirmed LIGGELD rule

**Success criteria** (observable user behaviors):
1. Confirming a cron-staged `record_finance_entry` or `record_voyage_entry` proposal succeeds — no "company is required" error — because the proposal already carried the extracted company/amount/year.
2. Confirming a `generate_invoice_from_template` proposal produces both the `.docx` in OneDrive AND a matching income row on the finance page for the correct company, in the same confirm — no separate manual booking step.
3. Asking the agent for a new invoice number returns the next unused YY-NNN, verified against the live OneDrive folder listing — no manual entry, no collision with numbers Wency assigns himself in parallel.
4. A register auto-append attempt still returns a clear "pending verification" response until the BUNKERINGEN block position is confirmed against the real `Reis registratie.xlsx` — the gate is not silently bypassed by this phase's other changes.
5. Generating a layover-time invoice from the real sample document produces the correct LIGGELD total.

**Depends on:** none — fixes existing M6 surfaces already live in production.

---

### Phase 2: Document & email archive + attachment routing

**Goal:** Nothing the scanner touches is lost, and the cron proposes the correct OneDrive destination per document instead of one hardcoded folder — the "back up all documents/emails" ask made concrete.

**Touches:** new Supabase Storage bucket + `src/lib/mail/archiveStore.ts`, `supabase/migrations/*` (archive metadata linked to `processed_messages`), `src/lib/mail/folderRouting.ts` (new doc-type→folder rule engine), `src/lib/mail/inboxScan.ts` (stage `save_email_attachment` with the routed destination).

**Requirements covered:**
- REQ-36: Supabase Storage archive for email bodies + attachments (today `processed_messages` stores classification metadata only — per `.planning/meeting-2026-07-03-brief.md` §2 wish #6)
- REQ-37: doc-type→OneDrive-folder rule engine so the cron stages `save_email_attachment` with a proposed destination

**Success criteria:**
1. After an inbox scan, the raw email body and any attachment bytes for a processed message are retrievable from Supabase Storage — not just the classification row.
2. A staged `save_email_attachment` proposal shows a destination folder selected by document type + company + year, matching Wency's routing table from the meeting.
3. Re-scanning an already-archived message does not create a duplicate stored copy (archival is idempotent, mirroring `processed_messages` idempotency).

**Depends on:** Phase 1 (shares `inboxScan.ts` / `executeConfirmedAction.ts` — sequenced after the confirm-path fix so new staging logic isn't layered on a known-broken pipeline).

**`[NEEDS CLIENT INPUT]`** Exact OneDrive destination per document type (received invoice / credit note / Transportbestätigung / bank doc / other), per company, per year — meeting Q1. Unlocks the routing rule table; the archive store itself (REQ-36) is buildable without it.

---

### Phase 3: Personal-style reply drafting

**Goal:** A drafted reply sounds like Wency wrote it, and nothing sends without his review — the "draft replies how I would react" ask.

**Touches:** new `src/lib/agents/styleProfile.ts` (built from both mailboxes' Sent folders), new `src/lib/agents/draftReply.ts` (thread-aware), `onedriveTools.ts` (`draft_reply` tool + `DESTRUCTIVE`/confirm staging), `executeConfirmedAction.ts`, `memory_facts` (preference storage).

**Requirements covered:**
- REQ-38: style profile built from the sent folders of both mailboxes
- REQ-39: thread-aware `draft_reply` tool, staged behind confirm

**Success criteria:**
1. A style profile derived from both mailboxes' Sent folders (the agent already reads every IMAP folder) captures observable tone/structure patterns — greeting, sign-off, formality — inspectable in `memory_facts`, not a black box.
2. `draft_reply` on an open thread produces a reply that references the actual thread content, staged for confirm exactly like every other write.
3. Declining a drafted reply discards it; nothing sends without an explicit confirm.

**Depends on:** none functionally (independent tool surface, reads mail already accessible via IMAP); sequenced after Phase 2 per the JOURNEY ordering.

**`[NEEDS CLIENT INPUT]`** Consent to mine both sent folders to learn his reply voice, and anything to exclude (personal/legal correspondence) — meeting Q10.

---

### Phase 4: Bank statements & reconciliation

**Goal:** A Revolut statement import shows Wency which ledger entries the bank confirms and which don't have a match — without needing live Revolut API access.

**Touches:** new `src/lib/finance/camt053Parser.ts`, `supabase/migrations/*` (`bank_transactions`, RLS-gated, idempotent on entry-ref), new `src/lib/finance/reconciliation.ts` (amount/currency/±7-day matcher), `src/app/finance/page.tsx` (reconciliation view), new upload route + confirm UI for proposed matches.

**Requirements covered:**
- REQ-40: CAMT.053 XML import → `bank_transactions` table, idempotent on re-import
- REQ-41: amount/currency/±7-day matching against `finance_entries`, human-confirmed

**Success criteria:**
1. Uploading a real CAMT.053 XML statement creates `bank_transactions` rows with no duplicates when the same file is uploaded a second time.
2. Each imported transaction shows its best-match `finance_entries` candidate (amount + currency + within a ±7-day window) or "no match" when none qualifies.
3. A human confirms or rejects each proposed match; no automatic reconciliation happens on import.

**Depends on:** none new — matches against `finance_entries` already populated by M5/M6.

**`[NEEDS CLIENT INPUT]`** A real CAMT.053 XML statement exported in the room to validate the parser target, plus his confirmed Revolut plan tier — meeting Q5. (Live Revolut transactions-API sync needs the Grow+ plan with cert/JWT auth and is explicitly deferred to the payments follow-on, not this phase.)

---

### Phase 5: Phone agent + WhatsApp summaries

**Goal:** A phone call — answered or missed — becomes a message Wency sees on his phone, in the caller's language, without him picking up.

**Touches:** new Telnyx NL number + Retell SIP trunk config, new `src/lib/voice/retellAgent.ts` (call handling), new `src/app/api/voice/webhook/route.ts` (post-call summary webhook), `src/lib/notify/adapter.ts` (reuse `NotificationChannel` seam from M6 Phase 6), new `src/lib/notify/whatsapp.ts` (Telnyx WhatsApp Business API adapter, gated).

**Requirements covered:**
- REQ-42: Telnyx NL number + Retell SIP trunk EN/DE/NL message-taking agent
- REQ-43: post-call webhook feeds the existing `NotificationChannel` seam + cold transfer to mobile
- REQ-44: WhatsApp adapter via Telnyx WhatsApp Business API

**Success criteria:**
1. Calling the new Telnyx NL number reaches a Retell agent that takes a message in Dutch, German, or English, matching the caller's language.
2. After the call, a push notification carrying the call summary appears via the existing `NotificationChannel` seam (the same one built in M6 Phase 6) — no new notification surface built from scratch.
3. An urgent call cold-transfers live to Wency's designated mobile number.
4. If WhatsApp is approved: the same call-summary / staged-action alerts Wency gets via push today also arrive via WhatsApp.

**Depends on:** none new — reuses the M6 Phase 6 `NotificationChannel` seam (ADR-008) as the delivery path.

**`[NEEDS OWNER + CLIENT INPUT]`** New Telnyx NL number approval, language priority, and which mobile receives urgent-call transfers — meeting Q7. WhatsApp requires explicit **OWNER cost sign-off** (~$4–11/month at Wency's volume, per ADR-008 — "No proxy approval," this cannot be authorized by the client alone) plus Meta business verification via Telnyx — meeting Q6. The phone-agent piece (REQ-42, REQ-43) does not depend on the WhatsApp decision and can ship independently.

---

### Phase 6: Crew ops v1: leave intake + flight search

**Goal:** A crew leave message becomes a reviewable plan-change proposal, and a flight need becomes bookable options — without the agent ever writing to Bargeplanner directly, because no public API exists.

**Touches:** new `src/lib/crew/leaveIntake.ts` (parse leave/absence messages), new `src/lib/crew/bargeplannerExport.ts` (weekly Data Export Excel parser, cross-check), new `src/lib/agents/duffelAdapter.ts` (`search_flights` tool + Duffel Links checkout), `onedriveTools.ts`.

**Requirements covered:**
- REQ-45: parse crew leave/absence messages into plan-change proposals cross-checked against the weekly Bargeplanner Data Export Excel (read-only v1)
- REQ-46: `search_flights` Duffel adapter + Duffel Links hosted checkout

**Success criteria:**
1. A crew leave/absence message (from email or chat) produces a plan-change proposal cross-checked against the weekly Data Export Excel — the proposal states what would change, not a live Bargeplanner write.
2. The planner can view the proposal and apply it manually inside Bargeplanner; the agent has no write path into Bargeplanner in v1.
3. `search_flights` returns real Duffel flight options for a route/date, each with a working Duffel Links checkout URL for a human to complete booking.

**Depends on:** none — independent of Phases 1–5.

**`[NEEDS VENDOR + CLIENT INPUT]`** Bargeplanner access: either a planner login or the weekly Data Export Excel handed to us, plus permission to email Dockworx (hello@dockworx.nl) requesting API access on Aquavoy's behalf — meeting Q8. Bargeplanner has **no public API today**, which is why v1 is read-only-proposals rather than automated writes — a vendor constraint, not a scoping choice we can build around. Flight search (REQ-46) does not depend on the Bargeplanner answer and can ship independently (Amadeus Self-Service retires 2026-07-17 — Duffel is the only viable adapter target; Kiwi Tequila is partner-only).

---

### Phase 7: Voice input

**Goal:** Wency can talk to the agent on his phone instead of typing — the input surface only; every downstream tool call and confirm card already works.

**Touches:** chat composer component (mic button + Web Speech API / streaming STT), no changes to tool dispatch, confirm cards, or the agent loop.

**Requirements covered:**
- REQ-47: mic capture + speech-to-text on the existing chat composer

**Success criteria:**
1. Tapping the mic icon on the chat composer captures speech and transcribes it into the message input.
2. The transcribed text is sent through the exact same pipeline as typed text — no separate voice-only code path, no separate tool-call handling.
3. Voice input works on the installed iPhone PWA, not only in a desktop browser.

**Depends on:** none — pure input-surface addition; tools and confirm cards already work downstream of a text message regardless of how it was entered.

---

## Coverage Verification

Every requirement in this milestone maps to exactly one phase.

| Requirement | Phase | Covered? |
|-------------|-------|----------|
| REQ-31 | Phase 1 | ✓ |
| REQ-32 | Phase 1 | ✓ |
| REQ-33 | Phase 1 | ✓ |
| REQ-34 | Phase 1 | ✓ |
| REQ-35 | Phase 1 | ✓ |
| REQ-36 | Phase 2 | ✓ |
| REQ-37 | Phase 2 | ✓ |
| REQ-38 | Phase 3 | ✓ |
| REQ-39 | Phase 3 | ✓ |
| REQ-40 | Phase 4 | ✓ |
| REQ-41 | Phase 4 | ✓ |
| REQ-42 | Phase 5 | ✓ |
| REQ-43 | Phase 5 | ✓ |
| REQ-44 | Phase 5 | ✓ |
| REQ-45 | Phase 6 | ✓ |
| REQ-46 | Phase 6 | ✓ |
| REQ-47 | Phase 7 | ✓ |

---

## When This Milestone Closes

Triggered by `/qualia-milestone` after `/qualia-verify` passes on the last phase:

1. All phase artifacts are archived to `.planning/archive/milestone-7-full-office/`
2. `tracking.json` `milestones[]` gets a summary entry (num, name, phases_completed, shipped_url, closed_at)
3. REQUIREMENTS.md marks this milestone's requirements as **Complete**
4. Per JOURNEY.md, M7 is the milestone that reaches the discovery done-state — check whether a further milestone is warranted or the project moves to `state.js launch` (operate lifecycle) instead of a forced Handoff
5. `state.js init --force --milestone_name "{next name}"` resets current-phase fields, preserves lifetime + milestones[] history (only if another milestone opens)

---

*Progressive detail: each phase gets task-level breakdown at `/qualia-plan {N}`. Phase 1 has no external dependency and ships first. Phases 2–6 carry `[NEEDS CLIENT/VENDOR/OWNER INPUT]` gates resolved at the 2026-07-03 office meeting (Q1–Q10); Phase 7 is independent and buildable anytime. See `.planning/meeting-2026-07-03-brief.md` for the full question list and vendor research.*
