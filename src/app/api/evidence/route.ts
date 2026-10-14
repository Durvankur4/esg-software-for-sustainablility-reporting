import { createEvidenceSchema } from "@/lib/api/schemas";
import { apiError } from "@/lib/api/responses";
import { createEvidence } from "@/lib/domain/evidence-service";
import type { Prisma } from "@prisma/client/index";

export async function POST(request: Request) {
  try {
    const input = createEvidenceSchema.parse(await request.json());
    const evidence = await createEvidence({ ...input, metadata: input.metadata as Prisma.InputJsonValue | undefined });
    return Response.json({ evidence }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
