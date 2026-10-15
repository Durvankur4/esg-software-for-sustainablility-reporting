# Verity Evidence Extraction

Verity is a focused document-extraction MVP for electricity bills and fuel receipts. It classifies document contents, proposes structured values with source evidence, requires human verification, and exports JSON or CSV.

## Prerequisites

- Node.js 20 or later

## Local setup

```bash
cp .env.example .env
npm install
npm run dev
```

Open [http://localhost:3000/evidence/extract](http://localhost:3000/evidence/extract). The documents in `public/demo-samples/` are fictional demonstration inputs, not authoritative reporting content.

## Verification

```bash
npm run lint
npm run typecheck
npm run build
```

## AI evidence extraction demo

The integrated **AI Extraction** screen accepts electricity bills and fuel receipts as PNG, JPG, or PDF, uses an OpenRouter vision model by default, and supports human review plus JSON/CSV export.

```bash
npm run dev
```

Copy `.env.example` to `.env`, set `OPENROUTER_API_KEY`, and then open `http://localhost:3000/evidence/extract`. Use the included fictional documents in `public/demo-samples/`. The default `OPENROUTER_MODEL=google/gemma-3-27b-it:free` is a configurable free-tier model selection, but availability and rate limits are controlled by OpenRouter. OpenRouter documents its OpenAI-compatible chat-completions endpoint and model catalog at https://openrouter.ai/docs/quickstart.

GitHub Pages is configured as a static landing page in this repository, not as the application backend: Pages cannot safely keep `OPENROUTER_API_KEY` secret or host an AI model. Deploy the Next.js app to a server-capable platform and set the same environment variables there for a working public extraction demo.
this project will follow RPI styled approach of software development
we would be using Human Layer + genesis and Codex for the development
