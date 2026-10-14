import { createExtractionSchema } from "@/lib/api/schemas";
import { apiError } from "@/lib/api/responses";
import { createDraftExtraction } from "@/lib/domain/evidence-service";
import type { Prisma } from "@prisma/client/index";

export async function POST(request: Request, { params }: { params: Promise<{ evidenceId: string }> }) {
  try {
    const { evidenceId } = await params;
    const input = createExtractionSchema.parse(await request.json());
    const extraction = await createDraftExtraction({ ...input, evidenceId, structuredValue: input.structuredValue as Prisma.InputJsonValue });
    return Response.json({ extraction }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
