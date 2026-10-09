import { createEvidenceSchema } from "@/lib/api/schemas";
import { apiError } from "@/lib/api/responses";
import { createEvidence } from "@/lib/domain/evidence-service";

export async function POST(request: Request) {
  try {
    const evidence = await createEvidence(createEvidenceSchema.parse(await request.json()));
    return Response.json({ evidence }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
