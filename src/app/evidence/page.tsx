import Link from "next/link";
import { db } from "@/lib/db";
import { EvidenceTable } from "@/components/evidence-table";

export default async function EvidencePage() {
  const evidence = await db.evidence.findMany({ orderBy: { createdAt: "desc" } });
  return <section className="page-stack"><div className="page-heading"><div><p className="eyebrow">Evidence register</p><h1>Source records</h1><p>Retain the metadata needed to trace every normalized reporting input.</p></div><Link className="button-link" href="/evidence/new">Add evidence</Link></div><div className="card"><EvidenceTable evidence={evidence} /></div></section>;
}
