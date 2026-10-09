"use client";

import { FormEvent, useState } from "react";
import { StatusBadge } from "./status-badge";
import { ProvenanceLink } from "./provenance-link";

export function FactReviewCard({ fact }: { fact: { id: string; state: "DRAFT" | "IN_REVIEW" | "VALIDATED" | "REJECTED"; quantity: { toString(): string }; unit: string; activityType: string; evidence: { id: string; title: string; sourceType: string; receivedAt: string | Date }; extraction: { structuredValue: unknown; sourceLocator: string | null } | null } }) {
  const [message, setMessage] = useState<string>();
  const [busy, setBusy] = useState(false);
  async function submitForReview() { setBusy(true); const response = await fetch("/api/facts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ factId: fact.id }) }); setBusy(false); setMessage(response.ok ? "Submitted. Refresh to review this fact." : "This fact cannot be submitted."); }
  async function review(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); setBusy(true); const response = await fetch(`/api/facts/${fact.id}/review`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision: data.get("decision"), rationale: data.get("rationale") }) }); setBusy(false); setMessage(response.ok ? "Decision saved. Refresh to see the updated state." : "Could not save the review decision."); }
  const badgeState = fact.state === "IN_REVIEW" ? "review" : fact.state === "VALIDATED" ? "validated" : "draft";
  return <article className="card review-card"><div className="card-heading"><div><p className="eyebrow">{fact.activityType.replaceAll("_", " ")}</p><h2>{fact.quantity.toString()} {fact.unit}</h2></div><StatusBadge state={badgeState} /></div><p><strong>Source:</strong> {fact.evidence.title} ({fact.evidence.sourceType.replaceAll("_", " ")})</p><p><strong>Draft extraction:</strong> {fact.extraction ? JSON.stringify(fact.extraction.structuredValue) : "No extraction attached"}</p>{fact.extraction?.sourceLocator && <p><strong>Locator:</strong> {fact.extraction.sourceLocator}</p>}<ProvenanceLink evidenceId={fact.evidence.id} label="Open source evidence" />{fact.state === "DRAFT" && <button disabled={busy} onClick={submitForReview}>Submit for review</button>}{fact.state === "IN_REVIEW" && <form className="review-form" onSubmit={review}><label>Reviewer rationale<textarea name="rationale" required maxLength={2000} /></label><div className="button-row"><button name="decision" value="VALIDATED" disabled={busy}>Validate fact</button><button className="button-secondary" name="decision" value="REJECTED" disabled={busy}>Reject fact</button></div></form>}<p aria-live="polite" className="form-message">{message}</p></article>;
}
