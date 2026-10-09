export type EvidenceSource = "INVOICE" | "UTILITY_BILL" | "SUPPLIER_DECLARATION" | "ERP_EXPORT" | "SHIPPING_DOCUMENT" | "EMAIL" | "PURCHASE_ORDER" | "OTHER";
export type FactState = "DRAFT" | "IN_REVIEW" | "VALIDATED" | "REJECTED";
export type ActivityType = "ELECTRICITY" | "NATURAL_GAS" | "FUEL" | "FREIGHT" | "WASTE" | "OTHER";
export type DisclosureFramework = "GRI" | "ISSB" | "ESRS";

export interface TraceableEvidence {
  id: string;
  sourceType: EvidenceSource;
  title: string;
  receivedAt: Date;
  externalReference: string | null;
  sourceUri: string | null;
  checksum: string | null;
}
