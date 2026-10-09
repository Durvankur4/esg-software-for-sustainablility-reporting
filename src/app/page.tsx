import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";

const stages = ["Evidence", "Review", "Calculate", "Disclose"];

export default function HomePage() {
  return <section className="page-stack">
    <div className="hero"><p className="eyebrow">Reporting workspace</p><h1>Evidence that stands behind every number.</h1><p>Register source material, validate normalized facts, and retain the context needed for sustainability disclosures.</p></div>
    <div className="stage-grid">{stages.map((stage, index) => <Card key={stage}><p className="stage-number">0{index + 1}</p><h2>{stage}</h2><p>{index === 0 ? "Capture source records and retained metadata." : "Available as the workflow is built."}</p>{index === 0 && <StatusBadge state="draft" />}</Card>)}</div>
  </section>;
}
