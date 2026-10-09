import type { ActivityType, FactState } from "@prisma/client/index";
import { db } from "@/lib/db";
import { DomainError } from "./errors";

type DatabaseClient = typeof db;

export const allowedTransitions: Record<FactState, readonly FactState[]> = {
  DRAFT: ["IN_REVIEW"],
  IN_REVIEW: ["VALIDATED", "REJECTED"],
  VALIDATED: [],
  REJECTED: ["DRAFT"],
};

export function assertFactTransition(from: FactState, to: FactState) {
  if (!allowedTransitions[from].includes(to)) {
    throw new DomainError("INVALID_FACT_STATE_TRANSITION", { from, to });
  }
}

export interface CreateFactInput {
  evidenceId: string;
  extractionId?: string;
  quantity: string;
  unit: string;
  activityType: ActivityType;
  periodStart: Date;
  periodEnd: Date;
  siteContext?: string;
  supplierContext?: string;
}

export async function createActivityFact(input: CreateFactInput, client: DatabaseClient = db) {
  return client.activityFact.create({ data: input });
}

export async function updateActivityFact(id: string, input: Partial<Omit<CreateFactInput, "evidenceId" | "extractionId">>, client: DatabaseClient = db) {
  return client.activityFact.update({ data: input, where: { id } });
}

export async function submitFactForReview(id: string, client: DatabaseClient = db) {
  const fact = await client.activityFact.findUnique({ where: { id } });
  if (!fact) throw new DomainError("FACT_NOT_FOUND", { id });
  assertFactTransition(fact.state, "IN_REVIEW");
  return client.activityFact.update({ where: { id }, data: { state: "IN_REVIEW" } });
}
