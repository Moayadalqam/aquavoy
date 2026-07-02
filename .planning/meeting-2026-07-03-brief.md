# Office meeting brief — Friday 2026-07-03 (Wency in Cyprus)

> Prepared 2026-07-02 from Wency's "perfect flow" message + his real documents
> (26-001 invoice, Gutschrift 26400013, Transportbestätigung 25-104607, Reis
> registratie.xlsx) and a 7-agent research pass. M7 arc: `.planning/JOURNEY.md`.
> Supersedes nothing — extends `m6-client-input-checklist.md` (its §1/§2 asks
> are now largely ANSWERED by the files he sent; remaining asks folded in below).

## 0. Before the meeting (owner/ops)

- [ ] **`vercel --prod`** — M6 is on main but the prod deploy was left as the
      OWNER's call; the meeting demo needs it live. The Gefo template fix
      (`fix/gefo-transport-invoice`, pushed) should be shipped to main first
      so the demo generates the REAL invoice format.
- [ ] Revoke the leaked `sbp_…` Supabase token (still open from M6).

## 1. Demo arc (all works today, chat-driven)

Real Gutschrift email in admin@ → agent reads it → `save_email_attachment`
(confirm) → `generate_invoice_from_template` (confirm card shows every
extracted field, editable) → invoice lands in OneDrive `Verzonden Facturen/2026`
named `26-XXX Invoice Aquavoy - Gefo DD-MM-YYYY voyage NN.docx`, matching his
real 26-001 structure (Barge/Product/ports/tonnage × €/t/commission/VAT
reverse/Total) → push notification. Also demo: /tasks page, PWA install,
finance views, batch mail, recurring schedules.

**Steer around:** don't tap Confirm on an *inbox-scan* card (cron-staged
finance/voyage proposals stage with empty company/amount and error on
confirm — known M6-P5 gap, fixed in M7 Phase 1). Drive the same flow from
chat instead, which works end-to-end.

**Honest caveats if asked:** cron scans the newest 20 inbox messages per
mailbox per 6h run (no historical backlog); generated invoices aren't
auto-booked to the ledger yet (M7 P1); generated .docx has the right
structure/fields but plain styling — if he gives us his actual .docx template
file, swapping it in is a data change, no redeploy.

## 2. His wish list → status (tell him what's already done)

| # | Wish | Status |
|---|------|--------|
| 1 | Read all emails automatically | ✅ cron 4×/day on admin@ + rice@, LLM-classified, idempotent |
| 2 | Save attachments to the right folders | 🟡 works from chat behind confirm; auto folder-routing = M7 P2 (needs his routing table) |
| 3 | Create invoices when info is available | ✅ per-company template fill, confirm-gated; real Gefo format as of today |
| 4 | Draft replies "how I would react" | 🔜 M7 P3 — style profile from his sent mail (needs his consent) |
| 5 | Accounting from received AND sent invoices | 🟡 ledger + voyage economics live; auto-booking generated invoices + backfill = M7 P1 |
| 6 | Back up all documents/emails in the app | 🔜 M7 P2 — archive store (nothing persisted today by design) |
| 7 | Phone calls → message → WhatsApp/push summary | 🟡 push exists; phone agent (Telnyx+Retell) + WhatsApp = M7 P5 (cost sign-off) |
| 8 | Crew planning → flight plans | 🔜 M7 P6 — flight search (Duffel) with human booking |
| 9 | Bargeplanner + leave messages | 🔜 M7 P6 — read-only proposals; Bargeplanner has NO public API (we'll email Dockworx) |
| 10 | Payments | ⏳ deferred (his words: "later stage") — after bank reconciliation proves out |
| 11 | Bank statements import | 🔜 M7 P4 — CAMT.053 import + reconciliation (Revolut exports it on every plan) |
| 12 | Voice commands | 🔜 M7 P7 — mic on the chat composer |

Also done from the 25-June list: prep page gone, /tasks oversight page, PWA
install, batch move-to-trash (~450-email cleanup), recurring schedules,
finance views, web-push with quiet hours.

## 3. Questions that BLOCK engineering (get answers in the room)

1. **Folder routing table** — exact OneDrive destination per document type
   (received invoice / credit note / Transportbestätigung / bank doc / other),
   per company, per year. → unlocks M7 P2.
2. **Register file** — open the real `Reis registratie.xlsx` together: where
   does the BUNKERINGEN block sit relative to voyage rows in each year sheet?
   (Auto-append writes to "next empty row" — we keep register writes gated
   until this is verified.) Confirm KWZ / GMP / ZHC column meanings.
3. **Numbering rules** — is YY-NNN one sequence across all customers per year?
   Is the voyage/REIS counter per-year per-vessel or per-company? What are the
   NEXT free numbers of each right now? (Collision risk if he keeps numbering
   manually in parallel.)
4. **"Sent" accounting scope** — backfill historical invoices from Verzonden
   Facturen into the ledger? How far back?
5. **Revolut** — which plan tier (Grow+ unlocks the API)? Have him export ONE
   CAMT.053 XML statement in the room to validate our parser target.
6. **WhatsApp** — approve ~$4–11/month + Meta business verification (via
   Telnyx), or is push sufficient for v1? (OWNER sign-off too — ADR-008.)
7. **Phone agent** — new Telnyx NL number OK? Language priority NL/DE/EN?
   Which mobile gets urgent-call transfers?
8. **Bargeplanner** — planner login or the weekly Data Export Excel for us; may
   we email Dockworx (hello@dockworx.nl) for API access on Aquavoy's behalf?
9. **Layover invoices** — bring one real "Layover time" invoice; confirm the
   LIGGELD rule (95 €/h beyond 26 free hours — load + discharge combined?).
10. **Email style consent** — OK to analyze both sent folders to learn his
    reply voice? Anything to exclude (personal/legal)?

## 4. Expectation to set (the one hard conversation)

His message says **"fully automated"**; the system is deliberately
**confirm-before-write** (ADR-003) for anything financial or destructive.
Proposal: keep confirms until trust is earned per action type, then define
explicit auto-execute rules (e.g. "attachment saves auto-execute, invoices
always confirm"). Do NOT promise blanket automation tomorrow.

## 5. Vendor facts (from the 2026-07-02 research pass)

- **Bargeplanner (Dockworx):** no public API; weekly Data Export Excel exists;
  integration path = export parsing + proposals, ask vendor for API.
- **Revolut Business:** CAMT.053 XML export on all plans; transactions API
  needs Grow+ plan with cert/JWT auth — that's the later payments/live-sync path.
- **Retell + Telnyx:** inbound SIP number ≈ $1/mo + ~$0.07–0.12/min voice
  agent; post-call webhook with transcript + structured summary; supports
  transfer-to-human. Multilingual EN/DE/NL.
- **WhatsApp Business (via Telnyx):** ~$4–11/mo at his volume (~10–30 msg/day,
  single recipient); business-initiated messages need approved templates +
  Meta verification; can deep-link into the PWA confirm page.
- **Flights:** Duffel = search + hosted checkout (Duffel Links), fits the
  adapter pattern; Amadeus Self-Service retires 2026-07-17 (avoid); Kiwi
  Tequila is partner-only.
