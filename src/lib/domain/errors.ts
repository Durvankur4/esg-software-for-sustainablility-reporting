export class DomainError extends Error {
  constructor(
    public readonly code: "INVALID_FACT_STATE_TRANSITION" | "FACT_NOT_FOUND" | "EVIDENCE_NOT_FOUND",
    public readonly details: Record<string, unknown> = {},
  ) {
    super(code);
    this.name = "DomainError";
  }
}
