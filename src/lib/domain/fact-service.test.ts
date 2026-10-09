import { describe, expect, it, vi } from "vitest";
import { assertFactTransition, createActivityFact, submitFactForReview } from "./fact-service";
import { DomainError } from "./errors";
import { reviewFact } from "./review-service";

describe("fact workflow", () => {
  it.each([["DRAFT", "IN_REVIEW"], ["IN_REVIEW", "VALIDATED"], ["IN_REVIEW", "REJECTED"], ["REJECTED", "DRAFT"]] as const)("allows %s to %s", (from, to) => {
    expect(() => assertFactTransition(from, to)).not.toThrow();
  });

  it("rejects prohibited transitions", () => {
    expect(() => assertFactTransition("DRAFT", "VALIDATED")).toThrow(DomainError);
    expect(() => assertFactTransition("VALIDATED", "IN_REVIEW")).toThrow(DomainError);
  });

  it("links a fact to its evidence and extraction", async () => {
    const create = vi.fn().mockResolvedValue({ id: "fact-1" });
    await createActivityFact({ evidenceId: "evidence-1", extractionId: "extraction-1", quantity: "20", unit: "kWh", activityType: "ELECTRICITY", periodStart: new Date(), periodEnd: new Date() }, { activityFact: { create } } as never);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ evidenceId: "evidence-1", extractionId: "extraction-1" }) }));
  });

  it("moves draft facts into review", async () => {
    const update = vi.fn().mockResolvedValue({ state: "IN_REVIEW" });
    await submitFactForReview("fact-1", { activityFact: { findUnique: vi.fn().mockResolvedValue({ state: "DRAFT" }), update } } as never);
    expect(update).toHaveBeenCalledWith({ where: { id: "fact-1" }, data: { state: "IN_REVIEW" } });
  });

  it("writes a review decision in the same transaction as the state change", async () => {
    const update = vi.fn().mockResolvedValue({ id: "fact-1", state: "VALIDATED" });
    const create = vi.fn().mockResolvedValue({ id: "review-1" });
    const transaction = { activityFact: { findUnique: vi.fn().mockResolvedValue({ state: "IN_REVIEW" }), update }, reviewDecision: { create } };
    const client = { $transaction: (callback: (value: typeof transaction) => unknown) => callback(transaction) };
    await reviewFact("fact-1", { decision: "VALIDATED", rationale: "Checked against invoice." }, client as never);
    expect(update).toHaveBeenCalled();
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ factId: "fact-1", rationale: "Checked against invoice." }) }));
  });
});
