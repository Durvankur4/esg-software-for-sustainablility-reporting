import test from "node:test";
import assert from "node:assert/strict";
import { extractDocument, normalizeExtraction, validateUpload } from "../server.mjs";

test("normalizes an electricity bill and preserves missing values", () => {
  const record = normalizeExtraction({ document_type: "electricity_bill", fields: { provider_name: { value: "North Power", evidence: "North Power", status: "extracted" }, currency: { value: null } } });
  assert.equal(record.fields.provider_name.value, "North Power");
  assert.equal(record.fields.currency.status, "missing");
  assert.equal(record.fields.electricity_consumption.value, "");
});

test("rejects unsupported and oversized uploads", () => {
  assert.throws(() => validateUpload({ mimeType: "text/plain", dataUrl: "data:text/plain;base64,eA==" }));
  assert.throws(() => validateUpload({ mimeType: "image/png", dataUrl: "data:image/png;base64," + Buffer.alloc(10 * 1024 * 1024 + 1).toString("base64") }));
});

test("normalizes unknown document types as unsupported", () => {
  assert.equal(normalizeExtraction({ document_type: "water_bill", reason: "water" }).document_type, "unsupported");
});

test("uses document data and parses the AI response without exposing a key", async () => {
  const originalKey = process.env.OPENAI_API_KEY;
  const originalProvider = process.env.EXTRACTOR_PROVIDER;
  process.env.EXTRACTOR_PROVIDER = "openai";
  process.env.OPENAI_API_KEY = "server-only-test-key";
  let request;
  const result = await extractDocument({ name: "renamed-upload.png", mimeType: "image/png", dataUrl: "data:image/png;base64,aGVsbG8=" }, async (_url, options) => {
    request = JSON.parse(options.body);
    return { ok: true, json: async () => ({ output_text: JSON.stringify({ document_type: "fuel_receipt", fields: { supplier_name: { value: "Harbor Fuel", evidence: "HARBOR FUEL", status: "extracted" }, fuel_quantity: { value: "54.20", evidence: "54.20 L", status: "extracted" }, quantity_unit: { value: "L", evidence: "54.20 L", status: "extracted" } } }) }) };
  });
  assert.equal(request.input[0].content[1].type, "input_image");
  assert.equal(result.document_type, "fuel_receipt");
  assert.equal(result.fields.fuel_quantity.value, "54.20");
  if (originalKey) process.env.OPENAI_API_KEY = originalKey; else delete process.env.OPENAI_API_KEY;
  if (originalProvider) process.env.EXTRACTOR_PROVIDER = originalProvider; else delete process.env.EXTRACTOR_PROVIDER;
});

test("explains provider rate-limit failures without returning a record", async () => {
  const originalKey = process.env.OPENAI_API_KEY;
  const originalProvider = process.env.EXTRACTOR_PROVIDER;
  process.env.EXTRACTOR_PROVIDER = "openai";
  process.env.OPENAI_API_KEY = "server-only-test-key";
  await assert.rejects(
    extractDocument({ name: "bill.png", mimeType: "image/png", dataUrl: "data:image/png;base64,aGVsbG8=" }, async () => ({ ok: false, status: 429, json: async () => ({ error: { message: "You exceeded your current quota." } }) })),
    /rate limit or exhausted API quota.*You exceeded your current quota/
  );
  if (originalKey) process.env.OPENAI_API_KEY = originalKey; else delete process.env.OPENAI_API_KEY;
  if (originalProvider) process.env.EXTRACTOR_PROVIDER = originalProvider; else delete process.env.EXTRACTOR_PROVIDER;
});

test("uses a local Ollama vision request by default", async () => {
  const originalProvider = process.env.EXTRACTOR_PROVIDER;
  delete process.env.EXTRACTOR_PROVIDER;
  let request;
  const result = await extractDocument({ name: "anything.png", mimeType: "image/png", dataUrl: "data:image/png;base64,aGVsbG8=" }, async (_url, options) => {
    request = JSON.parse(options.body);
    return { ok: true, json: async () => ({ message: { content: JSON.stringify({ document_type: "electricity_bill", fields: { provider_name: { value: "Nordenergie" } } }) } }) };
  });
  assert.equal(request.model, "gemma4:12b");
  assert.equal(request.messages[0].images[0], "aGVsbG8=");
  assert.equal(result.fields.provider_name.value, "Nordenergie");
  if (originalProvider) process.env.EXTRACTOR_PROVIDER = originalProvider;
});
