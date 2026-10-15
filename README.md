# Verity Sustainability Reporting MVP

Verity is a local-first sustainability reporting workspace. The first implementation phase establishes the evidence-to-disclosure data model, a PostgreSQL development environment, and the responsive application shell.

## Prerequisites

- Node.js 20 or later
- Docker Desktop with Docker Compose

## Local setup

```bash
cp .env.example .env
npm install
docker compose up -d db
npm run db:migrate -- --name init
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The seeded workspace and emission factor are explicitly demonstrative data, not authoritative reporting content.

## Verification

```bash
npm run lint
npm run typecheck
npm run build
```

Database commands use `DATABASE_URL` from `.env`. Stop the local database with `docker compose down`; add `-v` only when intentionally removing local database data.

## AI evidence extraction demo

The integrated **AI Extraction** screen accepts electricity bills and fuel receipts as PNG, JPG, or PDF, uses an OpenRouter vision model by default, and supports human review plus JSON/CSV export.

```bash
npm run dev
```

Copy `.env.example` to `.env`, set `OPENROUTER_API_KEY`, and then open `http://localhost:3000/evidence/extract`. Use the included fictional documents in `public/demo-samples/`. The default `OPENROUTER_MODEL=google/gemma-3-27b-it:free` is a configurable free-tier model selection, but availability and rate limits are controlled by OpenRouter. OpenRouter documents its OpenAI-compatible chat-completions endpoint and model catalog at https://openrouter.ai/docs/quickstart.

GitHub Pages is configured as a static landing page in this repository, not as the application backend: Pages cannot safely keep `OPENROUTER_API_KEY` secret or host an AI model. Deploy the Next.js app to a server-capable platform and set the same environment variables there for a working public extraction demo.
this project will follow RPI styled approach of software development
we would be using Human Layer + genesis and Codex for the development
For an ESG/ESRS product a modular monolith + asynchronous architecture is adequate

| Area | Recommended choice | Purpose |
|---|---|---|
| Web application | React + TypeScript | Reporting workspace, review queues, supplier portal, audit drill-down |
| Core API | Python API service | Canonical ESG data model, business rules, calculation API, integrations |
| Background workflow | Durable workflow orchestrator + queue | Long-running OCR, extraction, retries, review tasks, recalculations |
| Transactional system of record | PostgreSQL | Companies, facilities, suppliers, business events, assertions, truth states, calculation runs |
| Evidence vault | Object storage | Original PDFs, spreadsheets, email attachments, OCR output, rendered pages |
| Search and retrieval | Search engine with keyword + vector search | Find documents, evidence passages, suppliers, prior declarations |
| Cache / short-lived state | Redis | Job coordination, rate limits, temporary workflow state |
| Data lake / analytics | Columnar files in object storage + analytics warehouse later | High-volume analytics, dashboards, ML training, exports |
| Document AI | Managed OCR/document-intelligence service | Layout, tables, invoices, purchase orders, bills, scanned documents |
| LLM / SLM layer | Model gateway with hosted LLM first; fine-tuned SLM later | Classification, extraction, semantic mapping, evidence grounding |
| Calculation engine | Your own deterministic Python service | Factors, conversions, GHG Protocol rules, Scope 1/2/3, ESRS mappings |
| Factor registry | PostgreSQL-backed, versioned service | Factors, sources, validity, geography, GWP, methodology and approvals |
| Identity and access | OIDC/SAML SSO + RBAC | Enterprise login, supplier access, auditor access, segregation of duties |
| Observability | OpenTelemetry-compatible tracing, metrics and logs | Trace an ingestion/calculation/report across all components |
| Delivery and infrastructure | Containers, infrastructure-as-code, CI/CD | Repeatable environments, deployments, security review |
