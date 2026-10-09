import { reviewFactSchema } from "@/lib/api/schemas";
import { apiError } from "@/lib/api/responses";
import { reviewFact } from "@/lib/domain/review-service";

export async function POST(request: Request, { params }: { params: Promise<{ factId: string }> }) {
  try {
    const input = reviewFactSchema.parse(await request.json());
    const { factId } = await params;
    const result = await reviewFact(factId, input);
    return Response.json(result);
  } catch (error) {
    return apiError(error);
  }
}
