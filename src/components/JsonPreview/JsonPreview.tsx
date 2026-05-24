import type { PdfTemplatePayload } from '../../types/pdf'

interface JsonPreviewProps {
  payload: PdfTemplatePayload
}

export default function JsonPreview({ payload }: JsonPreviewProps) {
  return (
    <section className="preview-card">
      <div className="section-head">
        <div>
          <h2 className="section-title">JSON Preview</h2>
          <p className="section-copy">Payload được map đúng với backend contract.</p>
        </div>
        <span className="badge">live</span>
      </div>

      <pre className="code-block">{JSON.stringify(payload, null, 2)}</pre>
    </section>
  )
}