import { Navigation } from "@/components/navigation";
import Link from "next/link";

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="app-shell"><aside className="sidebar"><Link className="brand" href="/"><span className="brand-mark">V</span>Verity</Link><Navigation /></aside><div className="shell-main"><header className="topbar"><span className="workspace-label">Sample Sustainability Workspace</span><span className="environment">Local demo</span></header><main className="content">{children}</main></div></div>;
}
