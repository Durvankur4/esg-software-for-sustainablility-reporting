import Link from "next/link";
import type { Evidence } from "@prisma/client/index";

export function EvidenceTable({ evidence }: { evidence: Evidence[] }) {
  if (!evidence.length) return <p className="empty-state">No evidence has been recorded yet.</p>;
  return <div className="table-wrap"><table><thead><tr><th>Source</th><th>Type</th><th>Received</th><th>Reference</th></tr></thead><tbody>{evidence.map((item) => <tr id={item.id} key={item.id}><td><Link className="text-link" href={`/evidence#${item.id}`}>{item.title}</Link></td><td>{item.sourceType.replaceAll("_", " ")}</td><td>{item.receivedAt.toLocaleDateString()}</td><td>{item.externalReference ?? "-"}</td></tr>)}</tbody></table></div>;
}
