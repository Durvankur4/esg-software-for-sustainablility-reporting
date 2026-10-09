type Status = "draft" | "review" | "validated" | "published";

export function StatusBadge({ state }: { state: Status }) { return <span className={`status-badge status-badge--${state}`}>{state}</span>; }
