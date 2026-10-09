import { createExtractionSchema } from "@/lib/api/schemas";
import { apiError } from "@/lib/api/responses";
import { createDraftExtraction } from "@/lib/domain/evidence-service";

export async function POST(request: Request, { params }: { params: Promise<{ evidenceId: string }> }) {
  try {
    const { evidenceId } = await params;
    const extraction = await createDraftExtraction({ evidenceId, ...createExtractionSchema.parse(await request.json()) });
    return Response.json({ extraction }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
