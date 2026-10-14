import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const maxBytes = 10 * 1024 * 1024;
const fields = {
  electricity_bill: ["provider_name", "invoice_number", "invoice_date", "billing_period", "electricity_consumption", "consumption_unit", "total_amount", "currency"],
  fuel_receipt: ["supplier_name", "receipt_number", "transaction_date", "fuel_type", "fuel_quantity", "quantity_unit", "total_amount", "currency"]
} as const;

type DocumentType = keyof typeof fields;
export type Extraction = { document_type: DocumentType | "unsupported"; reason: string; fields: Record<string, { value: string; evidence: string; status: "extracted" | "missing" | "uncertain" }> };

function prompt() {
  return `Analyze the visible document. Do not use the filename or guess. Return JSON only, with no explanation. Classify document_type as electricity_bill, fuel_receipt, or unsupported. For every listed field, return an object with value, evidence, and status. status is extracted, missing, or uncertain. Use value "" and evidence "" when missing. Evidence is a short exact visible quote.

Electricity JSON shape: {"document_type":"electricity_bill","fields":{"provider_name":{"value":"","evidence":"","status":"extracted"},"invoice_number":{"value":"","evidence":"","status":"extracted"},"invoice_date":{"value":"","evidence":"","status":"extracted"},"billing_period":{"value":"","evidence":"","status":"extracted"},"electricity_consumption":{"value":"","evidence":"","status":"extracted"},"consumption_unit":{"value":"","evidence":"","status":"extracted"},"total_amount":{"value":"","evidence":"","status":"extracted"},"currency":{"value":"","evidence":"","status":"extracted"}}}

Fuel JSON shape: {"document_type":"fuel_receipt","fields":{"supplier_name":{"value":"","evidence":"","status":"extracted"},"receipt_number":{"value":"","evidence":"","status":"extracted"},"transaction_date":{"value":"","evidence":"","status":"extracted"},"fuel_type":{"value":"","evidence":"","status":"extracted"},"fuel_quantity":{"value":"","evidence":"","status":"extracted"},"quantity_unit":{"value":"","evidence":"","status":"extracted"},"total_amount":{"value":"","evidence":"","status":"extracted"},"currency":{"value":"","evidence":"","status":"extracted"}}}

Unsupported JSON shape: {"document_type":"unsupported","reason":"visible-content reason"}. Do not calculate emissions or claim compliance.`;
}

function normalize(payload: unknown): Extraction {
  const value = payload as { document_type?: string; reason?: string; fields?: Record<string, { value?: unknown; evidence?: unknown; status?: unknown }> };
  if (!value.document_type || !(value.document_type in fields)) return { document_type: "unsupported", reason: value.reason || "This document is not an electricity bill or fuel receipt.", fields: {} };
  const type = value.document_type as DocumentType;
  return {
    document_type: type,
    reason: "",
    fields: Object.fromEntries(fields[type].map((name) => {
      const field = value.fields?.[name];
      const extracted = typeof field?.value === "string" || typeof field?.value === "number" ? String(field.value) : "";
      return [name, { value: extracted, evidence: typeof field?.evidence === "string" ? field.evidence : "", status: extracted ? field?.status === "uncertain" ? "uncertain" : "extracted" : "missing" }];
    }))
  };
}

async function imageForLocalModel(mimeType: string, dataUrl: string) {
  const encoded = dataUrl.split(",")[1];
  if (mimeType !== "application/pdf") return encoded;
  const directory = await mkdtemp(join(tmpdir(), "verity-extract-"));
  const source = join(directory, "upload.pdf");
  const image = join(directory, "upload.png");
  try {
    await writeFile(source, Buffer.from(encoded, "base64"));
    await run("sips", ["-s", "format", "png", source, "--out", image]);
    return (await readFile(image)).toString("base64");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

export async function extractDocument(input: { mimeType: string; dataUrl: string }) {
  if (!["application/pdf", "image/jpeg", "image/png"].includes(input.mimeType)) throw new Error("Only PDF, JPG, and PNG documents are supported.");
  if (!input.dataUrl.startsWith(`data:${input.mimeType};base64,`)) throw new Error("The uploaded document could not be read.");
  if (Buffer.from(input.dataUrl.split(",")[1], "base64").length > maxBytes) throw new Error("Choose a document smaller than 10 MB.");
  const provider = process.env.EXTRACTOR_PROVIDER || "openrouter";
  if (provider === "ollama") {
    const response = await fetch(`${process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434"}/api/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.OLLAMA_MODEL || "gemma4:12b", format: "json", stream: false, messages: [{ role: "user", content: prompt(), images: [await imageForLocalModel(input.mimeType, input.dataUrl)] }] }) }).catch(() => { throw new Error("Local AI extraction is unavailable. Start Ollama with `ollama serve` and confirm the model is installed."); });
    if (!response.ok) throw new Error(`Local AI extraction returned ${response.status}. Confirm Ollama is running and the selected model is installed.`);
    const result = await response.json() as { message?: { content?: string } };
    try { return normalize(JSON.parse(result.message?.content || "")); } catch { throw new Error("Local AI extraction returned an unreadable result. No data was saved."); }
  }
  if (provider === "openrouter") {
    if (!process.env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured on the server.");
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
        "X-OpenRouter-Title": "Verity Evidence Extraction Demo"
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "google/gemma-3-27b-it:free",
        messages: [{ role: "user", content: [{ type: "text", text: prompt() }, { type: "image_url", image_url: { url: `data:image/png;base64,${await imageForLocalModel(input.mimeType, input.dataUrl)}` } }] }]
      })
    });
    if (!response.ok) throw new Error(`OpenRouter extraction returned ${response.status}. Check the selected model, key, or free-tier rate limit.`);
    const result = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    try { return normalize(JSON.parse(result.choices?.[0]?.message?.content || "")); } catch { throw new Error("OpenRouter returned an unreadable result. No data was saved."); }
  }
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured on the server.");
  const content = input.mimeType === "application/pdf" ? { type: "input_file", filename: "document.pdf", file_data: input.dataUrl, detail: "high" } : { type: "input_image", image_url: input.dataUrl, detail: "high" };
  const response = await fetch(`${process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"}/responses`, { method: "POST", headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-4.1-mini", input: [{ role: "user", content: [{ type: "input_text", text: prompt() }, content] }] }) });
  if (!response.ok) throw new Error(`Extraction service returned ${response.status}. Check provider quota and retry.`);
  const result = await response.json() as { output_text?: string };
  try { return normalize(JSON.parse(result.output_text || "")); } catch { throw new Error("The extraction service returned an unreadable result. No data was saved."); }
}
