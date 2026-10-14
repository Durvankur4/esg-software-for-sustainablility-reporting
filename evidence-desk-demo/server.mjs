import { createServer } from "node:http";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { tmpdir } from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const root = process.cwd();
const port = Number(process.env.PORT || 3000);
const maxBytes = 10 * 1024 * 1024;
const allowed = new Map([
  ["application/pdf", "pdf"],
  ["image/jpeg", "jpg"],
  ["image/png", "png"]
]);
const schemas = {
  electricity_bill: ["provider_name", "invoice_number", "invoice_date", "billing_period", "electricity_consumption", "consumption_unit", "total_amount", "currency"],
  fuel_receipt: ["supplier_name", "receipt_number", "transaction_date", "fuel_type", "fuel_quantity", "quantity_unit", "total_amount", "currency"]
};
const run = promisify(execFile);

export function validateUpload({ mimeType, dataUrl }) {
  if (!allowed.has(mimeType)) throw new Error("Only PDF, JPG, and PNG documents are supported.");
  if (typeof dataUrl !== "string" || !dataUrl.startsWith(`data:${mimeType};base64,`)) throw new Error("The uploaded document could not be read.");
  const bytes = Buffer.from(dataUrl.split(",")[1], "base64");
  if (!bytes.length || bytes.length > maxBytes) throw new Error("Choose a non-empty document smaller than 10 MB.");
  return bytes;
}

export function normalizeExtraction(payload) {
  const type = payload?.document_type;
  if (!schemas[type]) return { document_type: "unsupported", fields: {}, reason: payload?.reason || "This document is not an electricity bill or fuel receipt." };
  const fields = Object.fromEntries(schemas[type].map((name) => {
    const field = payload.fields?.[name] || {};
    const value = typeof field.value === "string" || typeof field.value === "number" ? String(field.value) : "";
    const status = value ? (field.status === "uncertain" ? "uncertain" : "extracted") : "missing";
    return [name, { value, evidence: typeof field.evidence === "string" ? field.evidence : "", status, original_value: value }];
  }));
  return { document_type: type, fields, reason: "" };
}

async function ollamaImage(upload) {
  const encoded = upload.dataUrl.split(",")[1];
  if (upload.mimeType !== "application/pdf") return encoded;
  const directory = await mkdtemp(join(tmpdir(), "evidence-desk-"));
  const source = join(directory, "upload.pdf");
  const image = join(directory, "upload.png");
  try {
    await writeFile(source, Buffer.from(encoded, "base64"));
    await run("sips", ["-s", "format", "png", source, "--out", image]);
    return (await readFile(image)).toString("base64");
  } catch {
    throw new Error("Local PDF conversion failed. For free local extraction, upload a PNG/JPG or run this MVP on macOS with the built-in sips converter.");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

function prompt() {
  return `Analyze this document. It may be an electricity bill or a fuel receipt/invoice. Return JSON only, with no markdown and no explanation. Read the visible document content; do not use its filename and do not guess. Classify document_type as electricity_bill, fuel_receipt, or unsupported. For every listed field, return an object with value, evidence, and status. status is extracted, missing, or uncertain. Use value "" and evidence "" when missing. Evidence must be a short exact visible quote.

Electricity JSON shape: {"document_type":"electricity_bill","fields":{"provider_name":{"value":"","evidence":"","status":"extracted"},"invoice_number":{"value":"","evidence":"","status":"extracted"},"invoice_date":{"value":"","evidence":"","status":"extracted"},"billing_period":{"value":"","evidence":"","status":"extracted"},"electricity_consumption":{"value":"","evidence":"","status":"extracted"},"consumption_unit":{"value":"","evidence":"","status":"extracted"},"total_amount":{"value":"","evidence":"","status":"extracted"},"currency":{"value":"","evidence":"","status":"extracted"}}}

Fuel JSON shape: {"document_type":"fuel_receipt","fields":{"supplier_name":{"value":"","evidence":"","status":"extracted"},"receipt_number":{"value":"","evidence":"","status":"extracted"},"transaction_date":{"value":"","evidence":"","status":"extracted"},"fuel_type":{"value":"","evidence":"","status":"extracted"},"fuel_quantity":{"value":"","evidence":"","status":"extracted"},"quantity_unit":{"value":"","evidence":"","status":"extracted"},"total_amount":{"value":"","evidence":"","status":"extracted"},"currency":{"value":"","evidence":"","status":"extracted"}}}

Unsupported JSON shape: {"document_type":"unsupported","reason":"short visible-content reason"}. Never calculate emissions or make compliance claims.`;
}

export async function extractDocument(upload, fetchImpl = fetch) {
  validateUpload(upload);
  if ((process.env.EXTRACTOR_PROVIDER || "ollama") === "ollama") {
    const response = await fetchImpl(`${process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434"}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: process.env.OLLAMA_MODEL || "gemma4:12b", format: "json", stream: false, messages: [{ role: "user", content: prompt(), images: [await ollamaImage(upload)] }] })
    }).catch(() => { throw new Error("Local AI extraction is unavailable. Start Ollama with `ollama serve`, then confirm the selected model is installed with `ollama list`."); });
    if (!response.ok) {
      const details = await response.json().catch(() => ({}));
      throw new Error(`Local AI extraction returned ${response.status}.${details?.error ? ` Detail: ${details.error}` : " Confirm Ollama is running and the selected model is installed."}`);
    }
    const result = await response.json();
    try { return normalizeExtraction(JSON.parse(result.message?.content || "")); } catch { throw new Error("Local AI extraction returned an unreadable result. No data was saved."); }
  }
  if (!process.env.OPENAI_API_KEY) throw new Error("Real extraction is unavailable because OPENAI_API_KEY is not configured on the server.");
  const content = upload.mimeType === "application/pdf"
    ? { type: "input_file", filename: upload.name || "document.pdf", file_data: upload.dataUrl, detail: "high" }
    : { type: "input_image", image_url: upload.dataUrl, detail: "high" };
  const response = await fetchImpl(`${process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"}/responses`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-4.1-mini", input: [{ role: "user", content: [{ type: "input_text", text: prompt() }, content] }] })
  });
  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    const providerMessage = typeof details?.error?.message === "string" ? details.error.message : "";
    if (response.status === 429) throw new Error(`The AI service rejected this request because of a rate limit or exhausted API quota.${providerMessage ? ` Provider detail: ${providerMessage}` : " Check the API project's billing, limits, and selected model, then retry."}`);
    throw new Error(`Extraction service returned ${response.status}.${providerMessage ? ` Provider detail: ${providerMessage}` : " Please try again."}`);
  }
  const result = await response.json();
  const text = result.output_text || result.output?.flatMap((item) => item.content || []).find((item) => item.type === "output_text")?.text;
  if (!text) throw new Error("The extraction service returned no structured result.");
  try { return normalizeExtraction(JSON.parse(text)); } catch { throw new Error("The extraction service returned an unreadable result. No data was saved."); }
}

async function body(request) {
  const chunks = [];
  for await (const chunk of request) { chunks.push(chunk); if (Buffer.concat(chunks).length > maxBytes * 1.5) throw new Error("Upload request is too large."); }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function send(response, status, data, type = "application/json") {
  response.writeHead(status, { "Content-Type": `${type}; charset=utf-8`, "Cache-Control": "no-store" });
  response.end(type === "application/json" ? JSON.stringify(data) : data);
}

const mimeFor = (path) => ({ ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".pdf": "application/pdf" }[extname(path)] || "application/octet-stream");

export const server = createServer(async (request, response) => {
  try {
    if (request.method === "POST" && request.url === "/api/extract") return send(response, 200, await extractDocument(await body(request)));
    if (request.method !== "GET") return send(response, 405, { error: "Method not allowed." });
    const path = normalize(request.url === "/" ? "/index.html" : request.url.split("?")[0]).replace(/^\/+/, "");
    const file = join(root, path);
    if (!file.startsWith(root) || !(await stat(file)).isFile()) return send(response, 404, "Not found", "text/plain");
    return send(response, 200, await readFile(file), mimeFor(file));
  } catch (error) {
    return send(response, 400, { error: error.message || "Processing failed. No result was created." });
  }
});

if (process.argv[1]?.endsWith("server.mjs")) server.listen(port, () => console.log(`Evidence Desk running at http://localhost:${port}`));
