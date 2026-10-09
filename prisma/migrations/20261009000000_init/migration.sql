-- CreateEnum
CREATE TYPE "EvidenceSource" AS ENUM ('INVOICE', 'UTILITY_BILL', 'SUPPLIER_DECLARATION', 'ERP_EXPORT', 'SHIPPING_DOCUMENT', 'EMAIL', 'PURCHASE_ORDER', 'OTHER');

-- CreateEnum
CREATE TYPE "ExtractionStatus" AS ENUM ('DRAFT', 'REVIEWED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FactState" AS ENUM ('DRAFT', 'IN_REVIEW', 'VALIDATED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('ELECTRICITY', 'NATURAL_GAS', 'FUEL', 'FREIGHT', 'WASTE', 'OTHER');

-- CreateEnum
CREATE TYPE "ReviewDecisionType" AS ENUM ('VALIDATED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FactorStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'RETIRED');

-- CreateEnum
CREATE TYPE "CalculationRunStatus" AS ENUM ('COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "CalculationResultStatus" AS ENUM ('COMPLETED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "DisclosureFramework" AS ENUM ('GRI', 'ISSB', 'ESRS');

-- CreateEnum
CREATE TYPE "DisclosureStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED');

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "sourceType" "EvidenceSource" NOT NULL,
    "title" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "externalReference" TEXT,
    "sourceUri" TEXT,
    "checksum" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Extraction" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "structuredValue" JSONB NOT NULL,
    "confidence" DECIMAL(5,4),
    "sourceLocator" TEXT,
    "status" "ExtractionStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Extraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityFact" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "extractionId" TEXT,
    "state" "FactState" NOT NULL DEFAULT 'DRAFT',
    "quantity" DECIMAL(18,6) NOT NULL,
    "unit" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "siteContext" TEXT,
    "supplierContext" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ActivityFact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewDecision" (
    "id" TEXT NOT NULL,
    "extractionId" TEXT,
    "factId" TEXT,
    "reviewerId" TEXT NOT NULL,
    "decision" "ReviewDecisionType" NOT NULL,
    "rationale" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReviewDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmissionFactor" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "value" DECIMAL(18,8) NOT NULL,
    "numeratorUnit" TEXT NOT NULL,
    "denominatorUnit" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "methodology" TEXT NOT NULL,
    "geography" TEXT,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "status" "FactorStatus" NOT NULL DEFAULT 'DRAFT',
    "semanticVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EmissionFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalculationRun" (
    "id" TEXT NOT NULL,
    "calculationVersion" TEXT NOT NULL,
    "inputSnapshot" JSONB NOT NULL,
    "factorSnapshot" JSONB NOT NULL,
    "status" "CalculationRunStatus" NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CalculationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalculationResult" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "factId" TEXT NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL,
    "unit" TEXT NOT NULL,
    "status" "CalculationResultStatus" NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CalculationResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Disclosure" (
    "id" TEXT NOT NULL,
    "calculationResultId" TEXT NOT NULL,
    "framework" "DisclosureFramework" NOT NULL,
    "requirementReference" TEXT NOT NULL,
    "reportingPeriod" TEXT NOT NULL,
    "status" "DisclosureStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Disclosure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmissionFactor_workspaceId_semanticVersion_key" ON "EmissionFactor"("workspaceId", "semanticVersion");

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Extraction" ADD CONSTRAINT "Extraction_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActivityFact" ADD CONSTRAINT "ActivityFact_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ActivityFact" ADD CONSTRAINT "ActivityFact_extractionId_fkey" FOREIGN KEY ("extractionId") REFERENCES "Extraction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReviewDecision" ADD CONSTRAINT "ReviewDecision_extractionId_fkey" FOREIGN KEY ("extractionId") REFERENCES "Extraction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewDecision" ADD CONSTRAINT "ReviewDecision_factId_fkey" FOREIGN KEY ("factId") REFERENCES "ActivityFact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmissionFactor" ADD CONSTRAINT "EmissionFactor_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalculationResult" ADD CONSTRAINT "CalculationResult_runId_fkey" FOREIGN KEY ("runId") REFERENCES "CalculationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalculationResult" ADD CONSTRAINT "CalculationResult_factId_fkey" FOREIGN KEY ("factId") REFERENCES "ActivityFact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Disclosure" ADD CONSTRAINT "Disclosure_calculationResultId_fkey" FOREIGN KEY ("calculationResultId") REFERENCES "CalculationResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
