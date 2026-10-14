# Evaluation Protocol

## Purpose

This protocol decides whether an extraction pipeline can make production accuracy, evidence, and rejection claims. It does not treat the browser prototype as an evaluated extractor.

## Corpus

- Use permissioned electricity bills and fuel receipts with a manifest recording source permission, country, language, provider, document type, capture type, and quality condition.
- Label each item as digital PDF, scan, or phone photo. Include supported documents and hard-negative unsupported documents.
- Keep duplicate and superseded variants linked in the manifest but split them into the same dataset partition.
- Split by supplier and source document family before model selection: development for prompts and validation rules, then a frozen held-out set for one final measurement.

## Ground truth

- Annotate supplier or merchant, document identifier, dates, consumption or quantity, units, fuel type, amounts, currency, meter or supply-point identifiers, and a page plus text span or region for each supported value.
- Store raw observed text separately from normalized values.
- Double-annotate at least 20% of documents and resolve disagreements before freezing the held-out set.
- An unsupported or unreadable label is correct only when it is supported by the document and review guideline.

## Measures

| Requirement | Measure | Release condition |
| --- | --- | --- |
| NFR-2 | Critical-field exact match, stratified by capture type | At least 95% on digital PDFs and 90% on photos |
| NFR-3 | Wrong, unflagged critical fields and values lacking supporting evidence | At most 1% silent errors and 0.5% unsupported values |
| NFR-4 | Human or programmatic check that cited evidence supports the field | At least 95% correct evidence references |
| NFR-5 | Hard-negative documents accepted as a supported type | At most 2% false acceptance |
| AC-11 | Versioned run report and corpus manifest | Present before any production release claim |

Report counts, denominators, 95% confidence intervals, model and prompt versions, validation rules, cost, p50/p95 latency, and every exclusion. Never infer a field-level independent sample size from correlated fields on the same document.

## Run Procedure

1. Freeze the held-out manifest and hashes before inspecting its results.
2. Select the pipeline and all thresholds using development data only.
3. Run the selected pipeline once on the held-out set and retain request configuration, response, raw extraction, normalized value, flags, and evidence output for every document.
4. Score fields and documents against ground truth; sample evidence citations for independent manual confirmation.
5. Publish a versioned report with failures classified as extraction, normalization, validation, rejection, or provenance failures.

## Release Block

No production accuracy, privacy, evidence-grounding, or ESRS-compliance claim is allowed until the corpus, annotation, held-out run, and independent review above exist. If any release condition fails, narrow the supported document, language, or capture scope, or retain mandatory field-by-field review.
