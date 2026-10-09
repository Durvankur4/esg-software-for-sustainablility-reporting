"use client";

import { FormEvent, useState } from "react";

const workspaceId = "00000000-0000-4000-8000-000000000001";

export function EvidenceForm() {
  const [evidenceId, setEvidenceId] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function submitEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(undefined);
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/evidence", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workspaceId, sourceType: data.get("sourceType"), title: data.get("title"), receivedAt: data.get("receivedAt"), externalReference: data.get("externalReference") || undefined, sourceUri: data.get("sourceUri") || undefined }) });
    setBusy(false);
    if (!response.ok) return setMessage("Could not save evidence. Check the required fields.");
    const { evidence } = await response.json(); setEvidenceId(evidence.id); setMessage("Evidence saved. Add the normalized activity fact for review.");
  }

  async function submitFact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!evidenceId) return; setBusy(true); setMessage(undefined);
    const data = new FormData(event.currentTarget);
    const extractionResponse = await fetch(`/api/evidence/${evidenceId}/extractions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ structuredValue: { quantity: data.get("quantity"), unit: data.get("unit") }, sourceLocator: data.get("sourceLocator") || undefined }) });
    if (!extractionResponse.ok) { setBusy(false); return setMessage("Could not save the draft extraction."); }
    const { extraction } = await extractionResponse.json();
    const response = await fetch("/api/facts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ evidenceId, extractionId: extraction.id, quantity: data.get("quantity"), unit: data.get("unit"), activityType: data.get("activityType"), periodStart: data.get("periodStart"), periodEnd: data.get("periodEnd"), siteContext: data.get("siteContext") || undefined }) });
    setBusy(false);
    if (!response.ok) return setMessage("Could not save the activity fact.");
    const { fact } = await response.json(); setMessage(`Draft fact saved. Submit it from the review queue: ${fact.id}`); event.currentTarget.reset();
  }

  return <div className="form-stack"><form className="card form-grid" onSubmit={submitEvidence}><h2>Source metadata</h2><label>Title<input name="title" required /></label><label>Source type<select name="sourceType" defaultValue="UTILITY_BILL"><option value="UTILITY_BILL">Utility bill</option><option value="INVOICE">Invoice</option><option value="SUPPLIER_DECLARATION">Supplier declaration</option><option value="ERP_EXPORT">ERP export</option><option value="OTHER">Other</option></select></label><label>Received date<input name="receivedAt" type="date" required /></label><label>External reference<input name="externalReference" /></label><label className="full-width">Source URL (optional)<input name="sourceUri" type="url" /></label><button disabled={busy}>{busy ? "Saving..." : "Save evidence"}</button></form>{evidenceId && <form className="card form-grid" onSubmit={submitFact}><h2>Draft extraction and activity fact</h2><label>Quantity<input name="quantity" type="number" min="0.000001" step="any" required /></label><label>Unit<input name="unit" defaultValue="kWh" required /></label><label>Activity type<select name="activityType" defaultValue="ELECTRICITY"><option value="ELECTRICITY">Electricity</option><option value="NATURAL_GAS">Natural gas</option><option value="FUEL">Fuel</option><option value="FREIGHT">Freight</option><option value="WASTE">Waste</option><option value="OTHER">Other</option></select></label><label>Source locator<input name="sourceLocator" placeholder="Page 1, meter total" /></label><label>Period start<input name="periodStart" type="date" required /></label><label>Period end<input name="periodEnd" type="date" required /></label><label className="full-width">Site context<input name="siteContext" /></label><button disabled={busy}>{busy ? "Saving..." : "Save draft fact"}</button></form>}<p aria-live="polite" className="form-message">{message}</p></div>;
}
