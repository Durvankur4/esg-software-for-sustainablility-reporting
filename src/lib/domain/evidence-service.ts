import type { EvidenceSource, Prisma } from "@prisma/client/index";
import { db } from "@/lib/db";

type DatabaseClient = typeof db;

export interface CreateEvidenceInput {
  workspaceId: string;
  sourceType: EvidenceSource;
  title: string;
  receivedAt: Date;
  externalReference?: string;
  sourceUri?: string;
  checksum?: string;
  metadata?: Prisma.InputJsonValue;
}

export async function createEvidence(input: CreateEvidenceInput, client: DatabaseClient = db) {
  return client.evidence.create({ data: input });
}

export interface CreateExtractionInput {
  evidenceId: string;
  structuredValue: Prisma.InputJsonValue;
  confidence?: number;
  sourceLocator?: string;
}

export async function createDraftExtraction(input: CreateExtractionInput, client: DatabaseClient = db) {
  return client.extraction.create({
    data: { ...input, confidence: input.confidence, status: "DRAFT" },
  });
}
