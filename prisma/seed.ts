import { ActivityType, FactorStatus, PrismaClient } from "@prisma/client/index";

const prisma = new PrismaClient();

async function main() {
  const workspace = await prisma.workspace.upsert({
    where: { id: "00000000-0000-4000-8000-000000000001" },
    update: {},
    create: { id: "00000000-0000-4000-8000-000000000001", name: "Sample Sustainability Workspace" },
  });

  await prisma.emissionFactor.upsert({
    where: { workspaceId_semanticVersion: { workspaceId: workspace.id, semanticVersion: "sample-1.0.0" } },
    update: {},
    create: {
      workspaceId: workspace.id,
      activityType: ActivityType.ELECTRICITY,
      value: "0.40000000",
      numeratorUnit: "kgCO2e",
      denominatorUnit: "kWh",
      source: "Sample data only - not an authoritative emission factor.",
      methodology: "Demonstration factor for local development.",
      geography: "Sample region",
      validFrom: new Date("2025-01-01T00:00:00.000Z"),
      status: FactorStatus.PUBLISHED,
      semanticVersion: "sample-1.0.0",
    },
  });
}

main().then(() => prisma.$disconnect()).catch(async (error: unknown) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
