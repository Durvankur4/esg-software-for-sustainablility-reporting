import { extractDocument } from "@/lib/document-extraction";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { mimeType: string; dataUrl: string };
    return Response.json(await extractDocument(body));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Processing failed. No result was created." }, { status: 400 });
  }
}
