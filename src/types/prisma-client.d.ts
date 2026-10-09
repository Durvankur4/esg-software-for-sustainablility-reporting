declare module "@prisma/client" {
  export const ActivityType: { ELECTRICITY: "ELECTRICITY" };
  export const FactorStatus: { PUBLISHED: "PUBLISHED" };

  export class PrismaClient {
    workspace: {
      upsert(args: unknown): Promise<{ id: string }>;
    };
    emissionFactor: {
      upsert(args: unknown): Promise<unknown>;
    };
    $disconnect(): Promise<void>;
  }
}
