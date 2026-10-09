import { z } from "zod";

export const evidenceSourceSchema = z.enum(["INVOICE", "UTILITY_BILL", "SUPPLIER_DECLARATION", "ERP_EXPORT", "SHIPPING_DOCUMENT", "EMAIL", "PURCHASE_ORDER", "OTHER"]);
export const activityTypeSchema = z.enum(["ELECTRICITY", "NATURAL_GAS", "FUEL", "FREIGHT", "WASTE", "OTHER"]);

export const createEvidenceSchema = z.object({
  workspaceId: z.string().uuid(),
  sourceType: evidenceSourceSchema,
  title: z.string().trim().min(1).max(300),
  receivedAt: z.coerce.date(),
  externalReference: z.string().trim().max(300).optional(),
  sourceUri: z.string().url().optional(),
  checksum: z.string().trim().max(300).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const createExtractionSchema = z.object({
  structuredValue: z.record(z.string(), z.unknown()),
  confidence: z.number().min(0).max(1).optional(),
  sourceLocator: z.string().trim().max(1000).optional(),
});

export const createFactSchema = z.object({
  evidenceId: z.string().uuid(),
  extractionId: z.string().uuid().optional(),
  quantity: z.coerce.number().positive(),
  unit: z.string().trim().min(1).max(50),
  activityType: activityTypeSchema,
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  siteContext: z.string().trim().max(300).optional(),
  supplierContext: z.string().trim().max(300).optional(),
}).refine((value) => value.periodEnd >= value.periodStart, { message: "periodEnd must be on or after periodStart", path: ["periodEnd"] });

export const submitFactSchema = z.object({ action: z.literal("SUBMIT") });

export const reviewFactSchema = z.object({
  decision: z.enum(["VALIDATED", "REJECTED"]),
  rationale: z.string().trim().min(1).max(2000),
});
