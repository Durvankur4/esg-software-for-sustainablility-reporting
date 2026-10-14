# Evidence Desk MVP
Evidence Desk is a focused demonstration app for extracting reviewable data from electricity bills and fuel receipts. It supports PDF, JPG, and PNG uploads, sends document content to a local Ollama vision model by default, requires human verification, and exports verified JSON or CSV.
It does not calculate emissions, generate ESRS reports, or claim compliance.
## Run locally
1. Use Node.js 18 or later.
2. For free local AI extraction, start the already-installed Ollama service and use the local vision model:

   ```bash
   ollama serve
   # In another terminal, only if the model is absent:
   ollama pull gemma4:12b
   npm start
   ```

3. Open `http://localhost:3000`.

The default `EXTRACTOR_PROVIDER=ollama` uses the free, local `gemma4:12b` model with no API key. On macOS, local PDF uploads are rendered to a first-page PNG with `sips`; JPG/PNG documents are sent directly. See `.env.example` for the complete environment-variable list.

To use OpenAI instead, set `EXTRACTOR_PROVIDER=openai` plus `OPENAI_API_KEY`. Do not put `OPENAI_API_KEY` in browser code or commit it to the repository.
## Extraction approach
The default server sends JPEG and PNG document content to local Ollama vision via its loopback API and receives one bounded JSON schema. Local PDFs are converted to an image for the free demonstration path. The optional OpenAI path sends JPEG and PNG documents as vision inputs and PDF documents as Responses API file inputs. The model is instructed to preserve missing values as empty, cite visible text where possible, and classify only electricity bills, fuel receipts, or unsupported documents.
This follows the official OpenAI file-input guidance: the Responses API accepts base64 `input_file` data and models with vision support process PDF text and page images. [Official OpenAI documentation](https://platform.openai.com/docs/guides/file-inputs)
## Demo flow
1. Download a clearly labeled synthetic document from the upload panel:
   - `samples/synthetic-electricity-bill.png` or `.pdf`
   - `samples/synthetic-fuel-receipt.png` or `.pdf`
2. Upload it under any filename and select **Extract information**.
3. Inspect evidence, correct values, and fill any missing critical values.
4. Select **Verify record**, then export JSON or CSV.
5. For rejection behavior, upload a non-energy document. The model classifies from content; filename is not sent as a classification signal.
The synthetic documents contain entirely fictional entities, amounts, and identifiers. They are inputs for real AI extraction, not pre-computed extraction responses.
## Tests
```bash
npm test
node --check app.js
```

The automated tests cover upload validation, normalized missing fields, unsupported classifications, local Ollama request construction, and server-side response parsing. A live extraction is not run by the test suite.

## Limits before public deployment

- This is a single-process demo app with no authentication, database, user isolation, durable storage, rate limiting, malware scanning, or deletion workflow.
- Model output is not evaluated against a permissioned corpus. `EVALUATION.md` defines the release gate required before accuracy, provenance, privacy, or compliance claims.
- Establish a data-processing agreement, retention/deletion behavior, rate limits, secure hosting, logging policy, and a permissioned held-out corpus before accepting real client documents in public deployment.
