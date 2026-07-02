import { z } from "zod";
import { complete, type ChatMessage } from "@/lib/openrouter/client";

/**
 * Zod schema for an LLM-extracted invoice.
 *
 * Amount fields (`crewing`, `travel`, `service_fee`, `cash_advance`, `total`)
 * accept both a plain number and a string from the model, coercing both to a
 * formatted "X.XX" string.  Missing optional amounts default to "0.00".
 * `company` is restricted to the two companies Aquavoy issues invoices for.
 *
 * This schema is the type contract for the confirm card — a wrong amount must
 * be a typed field the UI can show and the user can correct before the template
 * is filled (ADR-007 §3).
 */

/** Coerce number | string → "X.XX" string. */
const moneyString = z
  .union([z.number(), z.string()])
  .transform((v) => {
    const n = typeof v === "number" ? v : parseFloat(v);
    if (isNaN(n)) return "0.00";
    return n.toFixed(2);
  });

export const ExtractedInvoiceSchema = z.object({
  company: z.enum(["Gefo", "Novo Porto"]),
  recipient_name: z.string(),
  recipient_address: z.string(),
  recipient_vat: z.string(),
  vessel: z.string(),
  invoice_date: z.string(),
  invoice_number: z.string(),
  crewing: moneyString.default("0.00"),
  travel: moneyString.default("0.00"),
  service_fee: moneyString.default("0.00"),
  cash_advance: moneyString.default("0.00"),
  // European display strings ("35.967,28") pass through verbatim — parseFloat
  // would mangle them; plain numerics still normalize to "X.XX".
  total: z.union([z.number(), z.string()]).transform((v) => {
    if (typeof v === "string" && v.includes(",")) return v;
    const n = typeof v === "number" ? v : parseFloat(v);
    if (isNaN(n)) return "0.00";
    return n.toFixed(2);
  }),
  currency: z.string().default("EUR"),
  // Transport-invoice fields (Gefo Gutschrift source). Display-formatted
  // European strings, passed through verbatim to the template fill — no
  // numeric coercion, so "37.860,30" stays "37.860,30".
  recipient_reg: z.string().default(""),
  voyage_no: z.string().default(""),
  product: z.string().default(""),
  load_port: z.string().default(""),
  discharge_port: z.string().default(""),
  tonnage: z.string().default(""),
  price_per_ton: z.string().default(""),
  freight_amount: z.string().default(""),
  commission_pct: z.string().default(""),
  commission_amount: z.string().default(""),
});

export type ExtractedInvoice = z.infer<typeof ExtractedInvoiceSchema>;

/**
 * Extract invoice fields from the text of a source credit-note / voyage PDF.
 *
 * Pure function — no IO beyond the OpenRouter call (ADR-007 §3 "adapters-at-seams").
 * The caller owns reading the PDF text (`read_file` via `unpdf`) and passing it here.
 *
 * @param pdfText - Plain text extracted from the source PDF.
 * @returns       - Validated `ExtractedInvoice` ready for the confirm card.
 * @throws        - `Error("invoice extraction failed validation: ...")` when the
 *                  model's JSON doesn't match the schema, naming each invalid field.
 */
export async function extractInvoiceFields(pdfText: string): Promise<ExtractedInvoice> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: [
        "You are a precise invoice data extractor for Aquavoy Shipping Ltd, an inland-tanker shipping company.",
        "The document is ONE of two kinds — detect which, then extract:",
        "",
        "KIND 1 — GEFO Gutschrift (German self-billing credit note, headed 'G U T S C H R I F T'):",
        "Aquavoy re-invoices this as a TRANSPORTATION invoice → company is \"Gefo\".",
        "  vessel          — from 'Schiff', title-cased without hyphen: 'AQUA-DONNA' → 'Aqua Donna'",
        "  product         — from 'Produkt' (e.g. 'HVO')",
        "  load_port       — from 'Ladehafen', REORDERED 'City, Terminal' → 'Terminal City' (e.g. 'Amsterdam, Eurotank' → 'Eurotank Amsterdam')",
        "  discharge_port  — from 'Löschhafen', same reorder (e.g. 'Hamburg, Evos' → 'Evos Hamburg')",
        "  tonnage         — billed integer tonnes from the 'Fracht' line; German '1.062 t' means '1062'",
        "  price_per_ton   — €/t rate in European format (e.g. '35,65')",
        "  freight_amount  — Fracht line amount, European format (e.g. '37.860,30')",
        "  commission_pct  — Bereederungskommission percentage as bare number (e.g. '5')",
        "  commission_amount — commission deduction, European format, NEGATIVE (e.g. '-1.893,02')",
        "  total           — the 'Endbetrag' in European format (e.g. '35.967,28')",
        "  invoice_date    — the Gutschrift 'Datum' as DD-MM-YYYY",
        "  invoice_number  — leave \"\" (Aquavoy assigns its own sequential YY-NNN; the Belegnummer is NOT it)",
        "  voyage_no       — leave \"\" (Wency's own voyage counter, not in the document)",
        "  recipient_name/address/vat/reg — the GEFO company block (e.g. 'Gefo gesellschaft für oeltransporte MBH', 'Raboisen 5 20095 Hamburg', VAT 'DE118512502', reg 'HRB 9605')",
        "",
        "KIND 2 — crewing-services source (Novo Porto Scheepvaart BV) → company is \"Novo Porto\":",
        "  crewing / travel / service_fee / cash_advance / total — amounts as plain numbers (e.g. 4500.00)",
        "  invoice_number  — the document's YY-NNN number if present (e.g. '26-047')",
        "  vessel          — vessel name (look for 'Mts' prefix)",
        "",
        "Return ONLY a valid JSON object with exactly these keys, no markdown, no code fences:",
        "  company, recipient_name, recipient_address, recipient_vat, recipient_reg,",
        "  vessel, invoice_date, invoice_number, voyage_no, product, load_port, discharge_port,",
        "  tonnage, price_per_ton, freight_amount, commission_pct, commission_amount,",
        "  crewing, travel, service_fee, cash_advance, total, currency",
        "If a field cannot be determined, use an empty string for text fields and 0 for the crewing-set amounts.",
        "Output only the raw JSON — no prose, no explanation.",
      ].join("\n"),
    },
    {
      role: "user",
      content: `Extract invoice fields from this document:\n\n${pdfText}`,
    },
  ];

  const raw = await complete(messages);

  // Strip code fences that some models wrap around JSON output.
  const stripped = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    throw new Error(
      `invoice extraction failed: model did not return valid JSON. Raw output: ${raw.slice(0, 200)}`,
    );
  }

  try {
    return ExtractedInvoiceSchema.parse(parsed);
  } catch (err) {
    if (err instanceof z.ZodError) {
      const issues = err.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      throw new Error(`invoice extraction failed validation: ${issues}`);
    }
    throw err;
  }
}
