import type { EditablePdfField, FieldType } from '../../types/pdf'

interface FieldSidebarProps {
  fields: EditablePdfField[]
  activeFieldId: string | null
  placementMode: FieldType | null
  onStartPlacement: (type: FieldType) => void
  onSelectField: (id: string) => void
  onRemoveField: (id: string) => void
}

export default function FieldSidebar({
  fields,
  activeFieldId,
  placementMode,
  onStartPlacement,
  onSelectField,
  onRemoveField,
}: FieldSidebarProps) {
  return (
    <aside className="editor-left">
      <p className="sidebar-map-title">Document map</p>
      <div className="docmap-stack" aria-hidden="true">
        <button type="button" className="docmap-thumb active">
          <span className="docmap-thumb-line short" />
          <span className="docmap-thumb-line" />
          <span className="docmap-thumb-box" />
          <span className="docmap-thumb-page">Page 1</span>
        </button>
        <button type="button" className="docmap-thumb">
          <span className="docmap-thumb-line short" />
          <span className="docmap-thumb-line" />
          <span className="docmap-thumb-line medium" />
          <span className="docmap-thumb-page">Page 2</span>
        </button>
      </div>

      <div className="sidebar-section">
        <p className="sidebar-section-title">Annotate tools</p>
        <div className="sidebar-tools">
          <button
            type="button"
            className={`sidebar-tool-btn${placementMode === 'TEXT' ? ' active' : ''}`}
            onClick={() => onStartPlacement('TEXT')}
            title="Text field — click on PDF to place"
          >
            <span className="sidebar-tool-icon">T</span>
            <span className="sidebar-tool-label">Text</span>
          </button>
          <button
            type="button"
            className={`sidebar-tool-btn${placementMode === 'CHECKBOX' ? ' active' : ''}`}
            onClick={() => onStartPlacement('CHECKBOX')}
            title="Checkbox — click on PDF to place"
          >
            <span className="sidebar-tool-icon">✦</span>
            <span className="sidebar-tool-label">Highlight</span>
          </button>
        </div>
      </div>

      {fields.length > 0 && (
        <div className="sidebar-section">
          <p className="sidebar-section-title">Placed fields ({fields.length})</p>
          <ul className="sidebar-field-list">
            {fields.map((field, index) => (
              <li
                key={field.id}
                className={`sidebar-field-item${field.id === activeFieldId ? ' active' : ''}`}
                onClick={() => onSelectField(field.id)}
              >
                <span className="sidebar-field-icon">{field.type === 'CHECKBOX' ? '☑' : 'T'}</span>
                <span className="sidebar-field-name">{field.name || `Field ${index + 1}`}</span>
                <button
                  type="button"
                  className="sidebar-field-remove"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveField(field.id)
                  }}
                  title="Remove"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  )
}
