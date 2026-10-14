/* The preview uses a browser blob URL, which next/image cannot optimize. */
/* eslint-disable @next/next/no-img-element */
"use client";

import { ChangeEvent, useState } from "react";

type Field = { value: string; evidence: string; status: "extracted" | "missing" | "uncertain"; original: string };
type ExtractionRecord = { document_type: "electricity_bill" | "fuel_receipt"; fields: globalThis.Record<string, Field> };
const labels: Record<string, string> = { provider_name: "Provider", invoice_number: "Invoice number", invoice_date: "Invoice date", billing_period: "Billing period", electricity_consumption: "Electricity consumption", consumption_unit: "Consumption unit", supplier_name: "Supplier", receipt_number: "Receipt number", transaction_date: "Transaction date", fuel_type: "Fuel type", fuel_quantity: "Fuel quantity", quantity_unit: "Quantity unit", total_amount: "Total amount", currency: "Currency" };
const critical = new Set(["invoice_date", "billing_period", "electricity_consumption", "consumption_unit", "transaction_date", "fuel_quantity", "quantity_unit"]);

export function DocumentExtractionDemo() {
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState<string>();
  const [record, setRecord] = useState<ExtractionRecord>();
  const [state, setState] = useState("Choose a document to begin.");
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState(false);

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0];
    if (!next) return;
    if (!["application/pdf", "image/jpeg", "image/png"].includes(next.type)) return setState("Only PDF, JPG, and PNG documents are supported.");
    if (next.size > 10 * 1024 * 1024) return setState("Choose a document smaller than 10 MB.");
    setFile(next); setPreview(URL.createObjectURL(next)); setRecord(undefined); setVerified(false); setState("Ready. Select Extract information to analyze document contents.");
  }

  async function extract() {
    if (!file) return;
    setBusy(true); setVerified(false); setState("Reading document contents with the configured AI service...");
    const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
    try {
      const response = await fetch("/api/document-extraction", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mimeType: file.type, dataUrl }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (result.document_type === "unsupported") { setRecord(undefined); setState(`Unsupported document: ${result.reason}`); return; }
      setRecord({ ...result, fields: Object.fromEntries(Object.entries(result.fields).map(([key, value]) => { const field = value as Omit<Field, "original">; return [key, { ...field, original: field.value }]; })) });
      setState("Extraction complete. Review the proposed values and evidence before verification.");
    } catch (error) { setRecord(undefined); setState(error instanceof Error ? error.message : "Processing failed. No result was created."); } finally { setBusy(false); }
  }

  function update(key: string, value: string) { setRecord((current) => current && { ...current, fields: { ...current.fields, [key]: { ...current.fields[key], value } } }); }
  const missing = record ? Object.entries(record.fields).filter(([key, field]) => critical.has(key) && !field.value).length : 0;
  function download(format: "json" | "csv") {
    if (!record || !file) return;
    const values = Object.entries(record.fields).map(([name, field]) => ({ field: name, value: field.value || null, source_evidence: field.evidence || null, extraction_status: field.status, verification_status: field.value === field.original ? "human_verified" : "human_corrected" }));
    const content = format === "json" ? JSON.stringify({ source_document: { name: file.name, mime_type: file.type, size_bytes: file.size }, document_type: record.document_type, verification_status: "verified", fields: values }, null, 2) : `field,value,source_evidence,extraction_status,verification_status\n${values.map((row) => Object.values(row).map((item) => `"${String(item || "").replaceAll('"', '""')}"`).join(",")).join("\n")}`;
    const link = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([content], { type: format === "json" ? "application/json" : "text/csv" })), download: `verified-energy-record.${format}` }); link.click(); URL.revokeObjectURL(link.href);
  }

  return <div className="extraction-demo">
    <div className="card extraction-source"><p className="eyebrow">1. Source document</p><label className="upload-zone"><input type="file" accept="application/pdf,image/jpeg,image/png" onChange={selectFile} /><strong>Select an electricity bill or fuel receipt</strong><span>PDF, JPG, or PNG · 10 MB maximum</span></label><p className="sample-links">Fictional demo documents: <a href="/demo-samples/synthetic-electricity-bill.png" download>electricity bill</a> · <a href="/demo-samples/synthetic-fuel-receipt.png" download>fuel receipt</a></p>{preview && (file?.type === "application/pdf" ? <object className="document-preview" data={preview} type="application/pdf" title="Document preview" /> : <img className="document-preview" src={preview} alt="Uploaded document preview" />)}<button onClick={extract} disabled={!file || busy}>{busy ? "Extracting..." : "Extract information"}</button></div>
    <div className="card extraction-results"><div className="card-heading"><div><p className="eyebrow">2. Extraction review</p><h2>{record ? record.document_type === "fuel_receipt" ? "Fuel receipt" : "Electricity bill" : "No extraction record"}</h2></div><span className={`status-badge status-badge--${record ? "review" : "draft"}`}>{busy ? "Processing" : verified ? "Verified" : record ? "Needs review" : "Waiting"}</span></div><p className="extraction-message" aria-live="polite">{state}</p>{record && <div className="extraction-fields">{Object.entries(record.fields).map(([key, field]) => <div className="extraction-field" key={key}><label>{labels[key]}<input value={field.value} placeholder={field.status === "missing" ? "Unknown / not found" : ""} onChange={(event) => update(key, event.target.value)} /></label><small className={`field-status field-status--${field.status}`}>{field.status === "missing" ? "Missing" : field.status === "uncertain" ? "Uncertain" : "AI extracted"}</small><details><summary>Source evidence</summary><p>{field.evidence || "No source evidence returned."}</p></details></div>)}</div>}{record && <div className="button-row extraction-actions"><span>{missing ? `${missing} critical field${missing === 1 ? "" : "s"} need a value` : "All critical fields have a value"}</span><button disabled={missing > 0 || verified} onClick={() => setVerified(true)}>{verified ? "Record verified" : "Verify record"}</button></div>}{verified && <div className="button-row"><button className="button-secondary" onClick={() => download("json")}>Export JSON</button><button className="button-secondary" onClick={() => download("csv")}>Export CSV</button></div>}</div>
  </div>;
}
