const critical = new Set(["invoice_date", "billing_period", "electricity_consumption", "consumption_unit", "transaction_date", "fuel_quantity", "quantity_unit"]);
const labels = { provider_name: "Provider", invoice_number: "Invoice number", invoice_date: "Invoice date", billing_period: "Billing period", electricity_consumption: "Electricity consumption", consumption_unit: "Consumption unit", supplier_name: "Supplier", receipt_number: "Receipt number", transaction_date: "Transaction date", fuel_type: "Fuel type", fuel_quantity: "Fuel quantity", quantity_unit: "Quantity unit", total_amount: "Total amount", currency: "Currency" };
const $ = (selector) => document.querySelector(selector);
let upload, record, verified = false;

function message(text, tone = "info") { $("#notice-text").innerHTML = text; $("#notice").dataset.tone = tone; }
function setStatus(text, state) { $("#record-status").textContent = text; $("#record-status").dataset.state = state; }
function updateSteps(active) { document.querySelectorAll(".step").forEach((step, index) => step.className = `step ${index < active ? "complete" : index === active ? "active" : ""}`); }

function preview(file) {
  const url = URL.createObjectURL(file); const image = $("#image-preview"); const pdf = $("#pdf-preview");
  image.hidden = file.type === "application/pdf"; pdf.hidden = file.type !== "application/pdf";
  if (file.type === "application/pdf") { pdf.data = url; pdf.type = "application/pdf"; } else image.src = url;
}

function chooseFile(file) {
  if (!file) return;
  if (!["application/pdf", "image/jpeg", "image/png"].includes(file.type)) return fail("Only PDF, JPG, and PNG documents are supported.");
  if (file.size > 10 * 1024 * 1024) return fail("Choose a document smaller than 10 MB.");
  upload = file; record = null; verified = false;
  $("#file-name").textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB`; $("#file-status").textContent = "READY TO EXTRACT";
  $("#dropzone").hidden = true; $("#document-preview").hidden = false; $("#replace-file").hidden = false; $("#extract-button").disabled = false; $("#export-card").hidden = true;
  $("#review-title").textContent = "Ready to analyze"; $("#document-type").textContent = "Document not yet classified"; $("#processing-state").textContent = "Awaiting server-side extraction"; $("#fields").className = "fields empty"; $("#fields").innerHTML = "<p>Select <b>Extract information</b> to send this document to the configured AI service.</p>";
  setStatus("Ready", "ready"); message("<b>Ready to extract.</b> The document will be sent to the configured AI service only after you select Extract information."); updateSteps(0); preview(file);
}

function fail(text) { setStatus("Extraction failed", "error"); $("#review-title").textContent = "No result created"; $("#processing-state").textContent = "Review the error and retry"; message(`<b>Processing failed.</b> ${text}`, "error"); $("#extract-button").disabled = !upload; }

async function extract() {
  if (!upload) return; $("#extract-button").disabled = true; setStatus("Processing", "processing"); $("#review-title").textContent = "Reading document contents"; $("#processing-state").textContent = "Sending document to AI extraction"; message("<b>Extraction in progress.</b> This can take a few moments for PDFs and photographs.");
  try {
    const dataUrl = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(upload); });
    const response = await fetch("/api/extract", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: upload.name, mimeType: upload.type, dataUrl }) });
    const result = await response.json(); if (!response.ok) throw new Error(result.error || "The server could not process this document.");
    if (result.document_type === "unsupported") return unsupported(result.reason);
    record = result; render();
  } catch (error) { fail(error.message); }
}

function unsupported(reason) { record = null; $("#review-title").textContent = "Unsupported document"; $("#document-type").textContent = "Not an electricity bill or fuel receipt"; $("#processing-state").textContent = "No extraction record was created"; $("#fields").className = "fields empty"; $("#fields").innerHTML = "<p>This document was rejected from its contents, not its filename.</p>"; setStatus("Unsupported", "error"); message(`<b>No result created.</b> ${reason || "The document is outside the two supported categories."}`, "error"); }

function render() {
  const type = record.document_type === "fuel_receipt" ? "Fuel receipt" : "Electricity bill"; $("#review-title").textContent = "Review the proposed record"; $("#document-type").textContent = type; $("#processing-state").textContent = "AI extraction completed; review before verification"; setStatus("Needs review", "review"); message("<b>Review required.</b> Missing values remain blank; uncertain values are marked before verification."); $("#fields").className = "fields"; $("#fields").replaceChildren();
  Object.entries(record.fields).forEach(([key, field]) => { const node = $("#field-template").content.cloneNode(true); const input = node.querySelector("input"); const state = node.querySelector(".field-state"); node.querySelector("label").textContent = labels[key]; input.value = field.value; input.placeholder = field.status === "missing" ? "Unknown / not found" : ""; input.setAttribute("aria-label", labels[key]); state.textContent = field.status === "missing" ? "Missing" : field.status === "uncertain" ? "Uncertain" : "AI extracted"; state.dataset.state = field.status; input.addEventListener("input", () => { field.value = input.value; field.corrected = input.value !== field.original_value; checkReady(); }); const evidence = node.querySelector(".evidence-text"); evidence.textContent = field.evidence || "No source evidence returned."; node.querySelector(".evidence-button").addEventListener("click", () => evidence.classList.toggle("open")); $("#fields").append(node); });
  checkReady(); updateSteps(1);
}

function checkReady() { if (!record) return; const required = Object.entries(record.fields).filter(([key, field]) => critical.has(key) && !field.value); $("#review-count").textContent = required.length ? `${required.length} critical field${required.length === 1 ? "" : "s"} still need a value` : "All available critical fields reviewed"; $("#verify-button").disabled = required.length > 0; }

function verify() { verified = true; setStatus("Verified", "verified"); $("#verify-button").disabled = true; $("#verify-button").textContent = "Record verified"; $("#export-card").hidden = false; $("#review-count").textContent = "Human verification recorded for this session"; updateSteps(2); $("#export-card").scrollIntoView({ behavior: "smooth", block: "nearest" }); }

function exportRecord(format) { if (!verified || !record) return; const fields = Object.fromEntries(Object.entries(record.fields).map(([key, field]) => [key, { value: field.value || null, source_evidence: field.evidence || null, extraction_status: field.status, verification_status: field.corrected ? "human_corrected" : "human_verified" }])); const data = { source_document: { name: upload.name, mime_type: upload.type, size_bytes: upload.size }, document_type: record.document_type, verification_status: "verified", fields }; const text = format === "json" ? JSON.stringify(data, null, 2) : `field,value,source_evidence,extraction_status,verification_status\n${Object.entries(fields).map(([name, value]) => [name, value.value, value.source_evidence, value.extraction_status, value.verification_status].map((item) => `"${String(item || "").replaceAll('"', '""')}"`).join(",")).join("\n")}`; const link = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([text], { type: format === "json" ? "application/json" : "text/csv" })), download: `verified-energy-record.${format}` }); link.click(); URL.revokeObjectURL(link.href); }

$("#file-input").addEventListener("change", (event) => chooseFile(event.target.files[0])); $("#replace-file").addEventListener("click", () => $("#file-input").click()); ["dragenter", "dragover"].forEach((event) => $("#dropzone").addEventListener(event, (e) => { e.preventDefault(); $("#dropzone").classList.add("dragging"); })); ["dragleave", "drop"].forEach((event) => $("#dropzone").addEventListener(event, (e) => { e.preventDefault(); $("#dropzone").classList.remove("dragging"); })); $("#dropzone").addEventListener("drop", (event) => chooseFile(event.dataTransfer.files[0])); $("#extract-button").addEventListener("click", extract); $("#verify-button").addEventListener("click", verify); document.querySelectorAll(".export-button").forEach((button) => button.addEventListener("click", () => exportRecord(button.dataset.format)));
