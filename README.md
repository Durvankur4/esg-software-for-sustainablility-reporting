# Verity Evidence Extraction

Verity is a focused MVP for turning electricity bills and fuel receipts into reviewable structured records. A user uploads a document, the server sends the document image to a Mistral vision model, and the user verifies or corrects the returned values before exporting JSON or CSV.

The product is deliberately narrow. It does not calculate emissions, create ESRS reports, certify compliance, or make autonomous reporting decisions.

## What It Does

- Accepts one PDF, JPG, or PNG up to 10 MB.
- Classifies document content as an electricity bill, fuel receipt, or unsupported document.
- Extracts bounded fields with a value, source-evidence string, and extraction status.
- Keeps missing values empty and marks uncertain values for human review.
- Shows the original document beside editable results.
- Requires critical fields to have values before a user can verify and export the record.
- Exports the final reviewed values as JSON or CSV with source-document metadata.

## Supported Fields

| Electricity bill | Fuel receipt or invoice |
| --- | --- |
| Provider name | Supplier name |
| Invoice number and date | Receipt or invoice number |
| Billing period | Transaction date |
| Electricity consumption and unit | Fuel type, quantity, and unit |
| Total amount and currency | Total amount and currency |

## Architecture

```text
Browser
  -> upload and source preview
  -> POST /api/document-extraction
Next.js server
  -> validate type, data URL, and 10 MB limit
  -> Mistral Chat Completions vision request
  -> normalize a bounded extraction record
Browser
  -> review, edit, verify
  -> export JSON or CSV
```

`MISTRAL_API_KEY` is read only by the server-side route. It is never exposed in browser source, JSON responses, GitHub Pages, or committed environment files.

## Run Locally

Prerequisites:

- Node.js 20 or later
- A [Mistral API key](https://console.mistral.ai/)

```bash
git clone https://github.com/Durvankur4/esg-software-for-sustainablility-reporting.git
cd esg-software-for-sustainablility-reporting
cp .env.example .env
npm install
npm run dev
```

Set these values in `.env` before starting the app:

```bash
EXTRACTOR_PROVIDER=mistral
MISTRAL_API_KEY=your_key_here
MISTRAL_MODEL=mistral-small-latest
```

Open `http://localhost:3000/evidence/extract`.

Mistral documents image analysis through its Chat Completions API; this implementation sends images as base64 image URLs and requests a JSON response. See the [Mistral vision documentation](https://docs.mistral.ai/capabilities/vision/).

## Demo

Use the fictional documents in `public/demo-samples/`:

1. Open the AI Extraction screen.
2. Upload `synthetic-electricity-bill.png` or `synthetic-fuel-receipt.png`; the filename can be changed because classification is based on document content.
3. Select **Extract information**.
4. Review the returned fields and open each field's source evidence.
5. Correct values or complete missing critical values.
6. Select **Verify record**, then download JSON or CSV.

The bundled documents contain fictional companies, identifiers, and amounts. They are real image inputs to the configured model, not precomputed extraction responses.

## PDF Behavior

For the Mistral and Ollama vision paths, PDFs are rendered to a first-page PNG with macOS `sips` before analysis. This keeps the MVP small but means Linux-based deployments need an equivalent PDF renderer or should accept image inputs only until one is added. Multi-page document support is out of scope.

## Verification

```bash
npm run lint
npm run typecheck
npm run build
```

## Deploy To Vercel

1. Import the GitHub repository in Vercel.
2. Use the default Next.js build settings: `npm run build`.
3. Add the three Mistral variables above in **Settings → Environment Variables** for Production and Preview as appropriate.
4. Redeploy, then open `/evidence/extract`.
5. Test a synthetic sample before uploading any sensitive document.

Do not set `MISTRAL_API_KEY` as a `NEXT_PUBLIC_*` variable. It must remain server-only.

## GitHub Pages

The `pages/` directory is a static landing page only. GitHub Pages cannot host this API route or keep an API key secret, so it cannot run live document extraction. Use Vercel or another server-capable Next.js host for the working application.

## Known Limits

- This is a demonstration MVP, not a production document-processing platform.
- Extraction quality has not been measured against a permissioned held-out corpus.
- Document content is sent to the configured Mistral API when extraction starts; establish appropriate privacy, retention, and legal controls before using real client documents.
- There is no authentication, persistent storage, rate limiting, malware scanning, background jobs, or durable audit trail.
- Human verification is a browser-session action; exports are local downloads and are not persisted.
- Mistral account access, model availability, pricing, and limits are managed by Mistral and may change.
