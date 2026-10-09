import type { FactState, ReviewDecisionType } from "@prisma/client/index";
import { db } from "@/lib/db";
import { assertFactTransition } from "./fact-service";
import { DomainError } from "./errors";

type DatabaseClient = typeof db;

export async function reviewFact(
  factId: string,
  input: { decision: Extract<FactState, "VALIDATED" | "REJECTED">; rationale: string; reviewerId?: string },
  client: DatabaseClient = db,
) {
  return client.$transaction(async (transaction) => {
    const fact = await transaction.activityFact.findUnique({ where: { id: factId } });
    if (!fact) throw new DomainError("FACT_NOT_FOUND", { id: factId });
    assertFactTransition(fact.state, input.decision);
    const updatedFact = await transaction.activityFact.update({ where: { id: factId }, data: { state: input.decision } });
    const review = await transaction.reviewDecision.create({
      data: { factId, reviewerId: input.reviewerId ?? "local-reviewer", decision: input.decision as ReviewDecisionType, rationale: input.rationale },
    });
    return { fact: updatedFact, review };
  });
}
