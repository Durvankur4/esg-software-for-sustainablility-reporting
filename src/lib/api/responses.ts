import { ZodError } from "zod";
import { DomainError } from "@/lib/domain/errors";

export function apiError(error: unknown) {
  if (error instanceof ZodError) return Response.json({ error: { code: "VALIDATION_ERROR", details: error.flatten() } }, { status: 400 });
  if (error instanceof DomainError) {
    const status = error.code === "INVALID_FACT_STATE_TRANSITION" ? 409 : 404;
    return Response.json({ error: { code: error.code, details: error.details } }, { status });
  }
  return Response.json({ error: { code: "INTERNAL_ERROR" } }, { status: 500 });
}
