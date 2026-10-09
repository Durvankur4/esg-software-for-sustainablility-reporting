import Link from "next/link";

export function ProvenanceLink({ evidenceId, label = "View source evidence" }: { evidenceId: string; label?: string }) {
  return <Link className="text-link" href={`/evidence#${evidenceId}`}>{label}</Link>;
}
