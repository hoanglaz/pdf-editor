import type { EditablePdfField, FieldType } from '../../types/pdf'

interface FieldPropertiesProps {
  field: EditablePdfField | null
  onChange: <K extends keyof EditablePdfField>(fieldId: string, key: K, value: EditablePdfField[K]) => void
}

export default function FieldProperties({ field, onChange }: FieldPropertiesProps) {
  if (!field) {
    return (
      <aside className="editor-right">
        <div className="props-tabs">
          <button type="button" className="props-tab active">Properties</button>
          <button type="button" className="props-tab">History</button>
        </div>
        <p className="sidebar-section-title">Annotate tool</p>
        <p className="props-empty">Select a field on the canvas to view its properties.</p>
        <div className="secure-card">
          <p className="secure-title">Secure mode</p>
          <p className="secure-copy">This document is AES-256 encrypted. All edits are tracked for audit logs.</p>
        </div>
      </aside>
    )
  }

  return (
    <aside className="editor-right">
      <div className="props-tabs">
        <button type="button" className="props-tab active">Properties</button>
        <button type="button" className="props-tab">History</button>
      </div>

      <p className="sidebar-section-title">Annotate tool</p>

      <div className="prop-row">
        <label className="prop-label" htmlFor="prop-name">
          Field name
        </label>
        <input
          id="prop-name"
          className="prop-input"
          value={field.name}
          onChange={(e) => onChange(field.id, 'name', e.target.value)}
          placeholder="e.g. customerName"
        />
      </div>

      <div className="prop-row">
        <label className="prop-label" htmlFor="prop-type">
          Type
        </label>
        <select
          id="prop-type"
          className="prop-input"
          value={field.type}
          onChange={(e) => onChange(field.id, 'type', e.target.value as FieldType)}
        >
          <option value="TEXT">Text</option>
          <option value="CHECKBOX">Checkbox</option>
        </select>
      </div>

      <div className="prop-row">
        <label className="prop-label prop-label--inline">
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => onChange(field.id, 'required', e.target.checked)}
          />
          Required
        </label>
      </div>

      {field.type === 'TEXT' && (
        <div className="prop-row">
          <label className="prop-label prop-label--inline">
            <input
              type="checkbox"
              checked={Boolean(field.multiline)}
              onChange={(e) => onChange(field.id, 'multiline', e.target.checked)}
            />
            Multiline
          </label>
        </div>
      )}

      <div className="prop-row">
        <label className="prop-label" htmlFor="prop-default">
          Default value
        </label>
        <input
          id="prop-default"
          className="prop-input"
          value={field.defaultValue ?? ''}
          onChange={(e) => onChange(field.id, 'defaultValue', e.target.value)}
          placeholder={field.type === 'CHECKBOX' ? 'true or false' : 'Optional'}
        />
      </div>

      <hr className="prop-divider" />

      <p className="prop-meta">Page {field.page + 1}</p>
      <p className="prop-meta">
        x: {field.x} · y: {field.y}
      </p>
      <p className="prop-meta">
        {field.width} × {field.height} px
      </p>

      <div className="props-comments">
        <p className="comments-heading">Comments</p>
        <article className="comment-item">
          <div className="comment-avatar">JD</div>
          <div>
            <p className="comment-name">John Doe</p>
            <p className="comment-copy">Can we double-check these Q3 figures?</p>
          </div>
        </article>
      </div>

      <div className="secure-card">
        <p className="secure-title">Secure mode</p>
        <p className="secure-copy">This document is AES-256 encrypted. All edits are tracked for audit logs.</p>
      </div>
    </aside>
  )
}
