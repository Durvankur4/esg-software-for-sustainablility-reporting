import { DocumentExtractionDemo } from "@/components/document-extraction-demo";

export default function ExtractEvidencePage() {
  return <section className="page-stack"><div className="hero"><p className="eyebrow">AI evidence extraction</p><h1>Review the source before you trust the number.</h1><p>Use local AI to classify an electricity bill or fuel receipt from document contents, correct the structured result, and export a human-verified record.</p></div><DocumentExtractionDemo /></section>;
}
