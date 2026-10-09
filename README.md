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
