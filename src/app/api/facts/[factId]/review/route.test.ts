import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "@/lib/domain/errors";

const { reviewFact } = vi.hoisted(() => ({ reviewFact: vi.fn() }));
vi.mock("@/lib/domain/review-service", () => ({ reviewFact }));
import { POST } from "./route";

describe("POST /api/facts/:factId/review", () => {
  beforeEach(() => reviewFact.mockReset());

  it("returns 400 for a malformed request", async () => {
    const response = await POST(new Request("http://test/api/facts/id/review", { method: "POST", body: JSON.stringify({ decision: "VALIDATED", rationale: "" }) }), { params: Promise.resolve({ factId: "fact-1" }) });
    expect(response.status).toBe(400);
  });

  it("returns a conflict for an illegal transition", async () => {
    reviewFact.mockRejectedValue(new DomainError("INVALID_FACT_STATE_TRANSITION", { from: "DRAFT", to: "VALIDATED" }));
    const response = await POST(new Request("http://test/api/facts/id/review", { method: "POST", body: JSON.stringify({ decision: "VALIDATED", rationale: "Reviewed source." }) }), { params: Promise.resolve({ factId: "fact-1" }) });
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "INVALID_FACT_STATE_TRANSITION" } });
  });
});
