import type { BillingInvoice, BillingInvoiceLine } from "@openportal/db";

// ─────────────────────────────────────────────
// UBL 2.1 invoice generator — conform CIUS-RO
// (Customisation profile required by ANAF e-Factura).
//
// Spec: https://mfinante.gov.ro/static/10/eFactura/Documentatie/CIUS-RO.pdf
//
// Returns a UBL XML string ready for upload to /upload?standard=UBL.
//
// Romanian county codes (BT-77 PostalAddress/CountrySubentity) are
// strings like "RO-B" for București, "RO-CJ" for Cluj, etc.
// ─────────────────────────────────────────────

const ROMANIAN_COUNTIES: Record<string, string> = {
  AB: "RO-AB", AR: "RO-AR", AG: "RO-AG", BC: "RO-BC", BH: "RO-BH",
  BN: "RO-BN", BT: "RO-BT", BR: "RO-BR", BV: "RO-BV", B: "RO-B",
  BZ: "RO-BZ", CL: "RO-CL", CS: "RO-CS", CJ: "RO-CJ", CT: "RO-CT",
  CV: "RO-CV", DB: "RO-DB", DJ: "RO-DJ", GL: "RO-GL", GR: "RO-GR",
  GJ: "RO-GJ", HR: "RO-HR", HD: "RO-HD", IL: "RO-IL", IS: "RO-IS",
  IF: "RO-IF", MM: "RO-MM", MH: "RO-MH", MS: "RO-MS", NT: "RO-NT",
  OT: "RO-OT", PH: "RO-PH", SM: "RO-SM", SJ: "RO-SJ", SB: "RO-SB",
  SV: "RO-SV", TR: "RO-TR", TM: "RO-TM", TL: "RO-TL", VS: "RO-VS",
  VL: "RO-VL", VN: "RO-VN",
};

function countyCode(input: string | null | undefined): string {
  if (!input) return "RO-B";
  const upper = input.trim().toUpperCase();
  if (ROMANIAN_COUNTIES[upper]) return ROMANIAN_COUNTIES[upper];
  // Allow already-formatted codes (e.g. "RO-CJ")
  if (/^RO-[A-Z]{1,2}$/.test(upper)) return upper;
  // Best-effort name → code map for common spellings
  const byName: Record<string, string> = {
    BUCURESTI: "RO-B", "BUCUREȘTI": "RO-B", BUCHAREST: "RO-B",
    CLUJ: "RO-CJ", "CLUJ-NAPOCA": "RO-CJ",
    TIMIS: "RO-TM", "TIMIȘ": "RO-TM", TIMISOARA: "RO-TM",
    IASI: "RO-IS", "IAȘI": "RO-IS",
    CONSTANTA: "RO-CT", "CONSTANȚA": "RO-CT",
    BRASOV: "RO-BV", "BRAȘOV": "RO-BV",
    SIBIU: "RO-SB", ARAD: "RO-AR", BACAU: "RO-BC", "BACĂU": "RO-BC",
    ILFOV: "RO-IF", PRAHOVA: "RO-PH", DOLJ: "RO-DJ", GALATI: "RO-GL",
    "GALAȚI": "RO-GL", MURES: "RO-MS", "MUREȘ": "RO-MS",
  };
  return byName[upper] ?? "RO-B";
}

function vatCategoryCode(category: string | null | undefined): string {
  // CIUS-RO BT-118 codes
  const c = (category || "S").toUpperCase();
  if (["S", "Z", "E", "AE", "K", "G", "O"].includes(c)) return c;
  return "S";
}

function esc(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return "";
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function num(input: string | number | null | undefined, places = 2): string {
  if (input === null || input === undefined || input === "") return (0).toFixed(places);
  const n = typeof input === "string" ? Number(input) : input;
  if (!Number.isFinite(n)) return (0).toFixed(places);
  return n.toFixed(places);
}

function stripCui(cui: string | null | undefined): string {
  if (!cui) return "";
  return cui.replace(/^RO/i, "").trim();
}

function invoiceTypeCode(t: string | null | undefined): string {
  // BT-3 UBL 2.1 invoice type codes (UNTDID 1001)
  switch (t) {
    case "credit_note": return "381";
    case "advance":     return "386";
    case "proforma":    return "325";
    case "receipt":     return "380"; // receipts not strictly e-Factura
    case "invoice":
    default:            return "380"; // Commercial invoice
  }
}

// ─────────────────────────────────────────────
// Main generator
// ─────────────────────────────────────────────

export interface InvoiceInput {
  invoice: BillingInvoice;
  lines: BillingInvoiceLine[];
}

export function generateUblXml({ invoice, lines }: InvoiceInput): string {
  if (lines.length === 0) {
    throw new Error("Cannot generate UBL for invoice with zero lines");
  }

  const isCreditNote = invoice.type === "credit_note";
  const rootEl = isCreditNote ? "CreditNote" : "Invoice";

  const xmlns = {
    main: isCreditNote
      ? "urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2"
      : "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
    cac: "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
    cbc: "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
  };

  // ─── Aggregations from lines (TaxSubtotal per VAT rate) ───
  const taxByRate = new Map<string, { taxable: number; tax: number; category: string; rate: number }>();
  for (const line of lines) {
    const rate = Number(line.vatRate);
    const category = vatCategoryCode(line.vatCategory);
    const taxable = Number(line.subtotal);
    const tax = Number(line.vatAmount);
    const key = `${category}-${rate.toFixed(2)}`;
    const cur = taxByRate.get(key);
    if (cur) {
      cur.taxable += taxable;
      cur.tax += tax;
    } else {
      taxByRate.set(key, { taxable, tax, category, rate });
    }
  }

  // ─── Supplier (issuer) ───
  const supplier = `
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cbc:EndpointID schemeID="9947">${esc(stripCui(invoice.issuerTaxId))}</cbc:EndpointID>
      <cac:PartyName><cbc:Name>${esc(invoice.issuerName)}</cbc:Name></cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${esc(invoice.issuerAddress || "n/a")}</cbc:StreetName>
        <cbc:CityName>${esc(invoice.issuerCity || "Bucuresti")}</cbc:CityName>
        <cbc:CountrySubentity>${esc(countyCode(invoice.issuerCounty))}</cbc:CountrySubentity>
        <cac:Country><cbc:IdentificationCode>${esc(invoice.issuerCountry || "RO")}</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>RO${esc(stripCui(invoice.issuerTaxId))}</cbc:CompanyID>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${esc(invoice.issuerName)}</cbc:RegistrationName>
        <cbc:CompanyID>${esc(invoice.issuerRegistrationNumber || stripCui(invoice.issuerTaxId))}</cbc:CompanyID>
      </cac:PartyLegalEntity>
      ${invoice.issuerEmail ? `<cac:Contact><cbc:ElectronicMail>${esc(invoice.issuerEmail)}</cbc:ElectronicMail></cac:Contact>` : ""}
    </cac:Party>
  </cac:AccountingSupplierParty>`;

  // ─── Customer ───
  const customerTaxId = stripCui(invoice.customerTaxId);
  const customer = `
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cbc:EndpointID schemeID="9947">${esc(customerTaxId || "0000000")}</cbc:EndpointID>
      <cac:PartyName><cbc:Name>${esc(invoice.customerName)}</cbc:Name></cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${esc(invoice.customerAddress || "n/a")}</cbc:StreetName>
        <cbc:CityName>${esc(invoice.customerCity || "Bucuresti")}</cbc:CityName>
        <cbc:CountrySubentity>${esc(countyCode(invoice.customerCounty))}</cbc:CountrySubentity>
        <cac:Country><cbc:IdentificationCode>${esc(invoice.customerCountry || "RO")}</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>
      ${invoice.customerIsCompany && customerTaxId ? `
      <cac:PartyTaxScheme>
        <cbc:CompanyID>RO${esc(customerTaxId)}</cbc:CompanyID>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:PartyTaxScheme>` : ""}
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${esc(invoice.customerName)}</cbc:RegistrationName>
        ${invoice.customerRegistrationNumber ? `<cbc:CompanyID>${esc(invoice.customerRegistrationNumber)}</cbc:CompanyID>` : ""}
      </cac:PartyLegalEntity>
      ${invoice.customerEmail ? `<cac:Contact><cbc:ElectronicMail>${esc(invoice.customerEmail)}</cbc:ElectronicMail></cac:Contact>` : ""}
    </cac:Party>
  </cac:AccountingCustomerParty>`;

  // ─── Payment means ───
  const paymentMeans = invoice.issuerIban
    ? `
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>42</cbc:PaymentMeansCode>
    <cac:PayeeFinancialAccount>
      <cbc:ID>${esc(invoice.issuerIban)}</cbc:ID>
      ${invoice.issuerBank ? `<cbc:Name>${esc(invoice.issuerBank)}</cbc:Name>` : ""}
    </cac:PayeeFinancialAccount>
  </cac:PaymentMeans>`
    : "";

  // ─── Tax totals per rate ───
  const taxSubtotalsXml = Array.from(taxByRate.values())
    .map((t) => `
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${esc(invoice.currency)}">${num(t.taxable)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${esc(invoice.currency)}">${num(t.tax)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>${esc(t.category)}</cbc:ID>
        <cbc:Percent>${num(t.rate)}</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>`)
    .join("");

  const totalTax = Array.from(taxByRate.values()).reduce((sum, t) => sum + t.tax, 0);

  const taxTotal = `
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${esc(invoice.currency)}">${num(totalTax)}</cbc:TaxAmount>
    ${taxSubtotalsXml}
  </cac:TaxTotal>`;

  // ─── Legal totals ───
  const monetaryTotal = `
  <cac:${isCreditNote ? "LegalMonetaryTotal" : "LegalMonetaryTotal"}>
    <cbc:LineExtensionAmount currencyID="${esc(invoice.currency)}">${num(invoice.subtotal)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${esc(invoice.currency)}">${num(invoice.subtotal)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${esc(invoice.currency)}">${num(invoice.totalAmount)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${esc(invoice.currency)}">${num(invoice.amountDue)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>`;

  // ─── Invoice/CreditNote lines ───
  const linesXml = lines
    .map((line) => {
      const lineEl = isCreditNote ? "CreditNoteLine" : "InvoiceLine";
      const qtyEl = isCreditNote ? "CreditedQuantity" : "InvoicedQuantity";
      return `
  <cac:${lineEl}>
    <cbc:ID>${esc(line.lineNumber)}</cbc:ID>
    <cbc:${qtyEl} unitCode="${esc(line.unitOfMeasure || "H87")}">${num(line.quantity, 4)}</cbc:${qtyEl}>
    <cbc:LineExtensionAmount currencyID="${esc(invoice.currency)}">${num(line.subtotal)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>${esc(line.description || "Serviciu")}</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>${esc(vatCategoryCode(line.vatCategory))}</cbc:ID>
        <cbc:Percent>${num(line.vatRate)}</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${esc(invoice.currency)}">${num(line.unitPrice, 4)}</cbc:PriceAmount>
    </cac:Price>
  </cac:${lineEl}>`;
    })
    .join("");

  // ─── Document head ───
  const documentCurrency = invoice.currency || "RON";
  const customizationId = "urn:cen.eu:en16931:2017#compliant#urn:efactura.mfinante.ro:CIUS-RO:1.0.1";
  const profileId = "urn:cen.eu:en16931:2017";

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<${rootEl} xmlns="${xmlns.main}" xmlns:cac="${xmlns.cac}" xmlns:cbc="${xmlns.cbc}">
  <cbc:CustomizationID>${customizationId}</cbc:CustomizationID>
  <cbc:ProfileID>${profileId}</cbc:ProfileID>
  <cbc:ID>${esc(invoice.documentNumber)}</cbc:ID>
  <cbc:IssueDate>${esc(invoice.issueDate)}</cbc:IssueDate>
  ${invoice.dueDate && !isCreditNote ? `<cbc:DueDate>${esc(invoice.dueDate)}</cbc:DueDate>` : ""}
  <cbc:${isCreditNote ? "CreditNoteTypeCode" : "InvoiceTypeCode"}>${invoiceTypeCode(invoice.type)}</cbc:${isCreditNote ? "CreditNoteTypeCode" : "InvoiceTypeCode"}>
  ${invoice.notes ? `<cbc:Note>${esc(invoice.notes)}</cbc:Note>` : ""}
  <cbc:DocumentCurrencyCode>${esc(documentCurrency)}</cbc:DocumentCurrencyCode>
  ${supplier}
  ${customer}
  ${paymentMeans}
  ${taxTotal}
  ${monetaryTotal}
  ${linesXml}
</${rootEl}>`;

  // Tidy whitespace
  return xml.replace(/\n\s*\n/g, "\n").trim();
}
