import type { ChangeEvent } from 'react'

interface PdfUploadProps {
  file: File | null
  error?: string
  onFileChange: (file: File | null) => void
}

export default function PdfUpload({ file, error, onFileChange }: PdfUploadProps) {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null
    onFileChange(selectedFile)
  }

  return (
    <section className="section-card">
      <div className="section-head">
        <div>
          <h2 className="section-title">Upload PDF</h2>
          <p className="section-copy">
            Chọn file PDF nguồn để gửi cùng template lên endpoint convert.
          </p>
        </div>
        <span className="badge">PDF only</span>
      </div>

      <div className="input-group">
        <label className="input-label" htmlFor="pdf-file">
          Source file
        </label>
        <input
          id="pdf-file"
          className="file-input"
          type="file"
          accept="application/pdf,.pdf"
          onChange={handleFileChange}
        />
        <p className="helper-text">Request convert sẽ gửi `file` dưới dạng multipart part.</p>
        {error ? <span className="error-text">{error}</span> : null}
      </div>

      {file ? (
        <div className="upload-meta">
          <span className="pill success">{file.name}</span>
          <span className="pill">{(file.size / 1024).toFixed(1)} KB</span>
          <span className="pill">{file.type || 'application/pdf'}</span>
        </div>
      ) : (
        <div className="empty-state">Chưa có file PDF nào được chọn.</div>
      )}
    </section>
  )
}