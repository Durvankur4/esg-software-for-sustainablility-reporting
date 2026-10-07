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