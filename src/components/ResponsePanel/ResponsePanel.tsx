import type { ActionFeedback } from '../../types/pdf'

interface ResponsePanelProps {
  result: ActionFeedback | null
  loadingAction: string | null
}

export default function ResponsePanel({ result, loadingAction }: ResponsePanelProps) {
  if (!result && !loadingAction) {
    return (
      <section className="response-card info">
        <div className="section-head">
          <div>
            <h2 className="section-title">Kết quả / lỗi</h2>
            <p className="section-copy">Response backend và lỗi chuẩn hóa sẽ hiển thị tại đây.</p>
          </div>
          <span className="badge">idle</span>
        </div>
        <div className="empty-state">Chưa có request nào được gửi.</div>
      </section>
    )
  }

  return (
    <section className={`response-card ${result?.kind ?? 'info'}`}>
      <div className="section-head">
        <div>
          <h2 className="section-title">Kết quả / lỗi</h2>
          <p className="section-copy">
            {loadingAction ? `Đang xử lý ${loadingAction}...` : 'Phản hồi gần nhất từ backend.'}
          </p>
        </div>
        <span
          className={`pill ${result?.kind === 'error' ? 'error' : result?.kind === 'success' ? 'success' : 'warning'}`}
        >
          {loadingAction ? 'loading' : result?.kind ?? 'info'}
        </span>
      </div>

      {result ? (
        <>
          <h3 className="response-title">{result.title}</h3>
          <p className="muted-copy">{result.message}</p>
          <div className="result-meta">
            {typeof result.status === 'number' ? <span className="pill">Status {result.status}</span> : null}
            {result.payload ? <span className="pill">Payload attached</span> : null}
          </div>

          {result.details?.length ? (
            <ul className="response-list">
              {result.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          ) : null}

          {result.payload ? (
            <pre className="code-block">{JSON.stringify(result.payload, null, 2)}</pre>
          ) : null}
        </>
      ) : null}
    </section>
  )
}