import { createFactSchema, submitFactSchema } from "@/lib/api/schemas";
import { apiError } from "@/lib/api/responses";
import { createActivityFact, submitFactForReview } from "@/lib/domain/fact-service";

export async function POST(request: Request) {
  try {
    const input = createFactSchema.parse(await request.json());
    const fact = await createActivityFact({ ...input, quantity: input.quantity.toString() });
    return Response.json({ fact }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { factId } = (await request.json()) as { factId?: string };
    if (!factId) return Response.json({ error: { code: "VALIDATION_ERROR" } }, { status: 400 });
    submitFactSchema.parse({ action: "SUBMIT" });
    const fact = await submitFactForReview(factId);
    return Response.json({ fact });
  } catch (error) {
    return apiError(error);
  }
}
