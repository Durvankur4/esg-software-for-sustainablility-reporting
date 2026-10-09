import { db } from "@/lib/db";
import { FactReviewCard } from "@/components/fact-review-card";

export default async function ReviewPage() {
  const facts = await db.activityFact.findMany({ where: { state: { in: ["DRAFT", "IN_REVIEW"] } }, include: { evidence: true, extraction: true }, orderBy: { createdAt: "asc" } });
  return <section className="page-stack"><div><p className="eyebrow">Controlled review</p><h1>Review queue</h1><p>Only a validated fact may become a calculation input. Every decision requires a recorded rationale.</p></div><div className="review-grid">{facts.length ? facts.map((fact) => <FactReviewCard key={fact.id} fact={fact} />) : <p className="empty-state">No draft or in-review facts are waiting.</p>}</div></section>;
}
