import type { ReactNode } from "react";

export function Card({ children }: { children: ReactNode }) { return <article className="card">{children}</article>; }
