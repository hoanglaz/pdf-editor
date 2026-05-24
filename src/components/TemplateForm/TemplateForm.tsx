import FieldItem from './FieldItem'
import type {
  EditablePdfField,
  FieldType,
  TemplateFormState,
  TemplateValidationResult,
} from '../../types/pdf'

interface TemplateFormProps {
  form: TemplateFormState
  validation: TemplateValidationResult
  activeFieldId: string | null
  onTemplateChange: (key: 'templateName' | 'version', value: string | number) => void
  onFieldChange: <K extends keyof EditablePdfField>(
    fieldId: string,
    key: K,
    value: EditablePdfField[K],
  ) => void
  onAddField: (type: FieldType) => void
  onRemoveField: (fieldId: string) => void
  onSelectField: (fieldId: string) => void
}

export default function TemplateForm({
  form,
  validation,
  activeFieldId,
  onTemplateChange,
  onFieldChange,
  onAddField,
  onRemoveField,
  onSelectField,
}: TemplateFormProps) {
  return (
    <section className="section-card">
      <div className="section-head">
        <div>
          <h2 className="section-title">Template Builder</h2>
          <p className="section-copy">Khai báo template metadata và danh sách field theo đúng backend contract.</p>
        </div>
        <span className="badge">MVP</span>
      </div>

      <div className="form-grid two-columns">
        <div className="input-group">
          <label className="input-label" htmlFor="template-name">
            Template name
          </label>
          <input
            id="template-name"
            className="text-input"
            value={form.templateName}
            onChange={(event) => onTemplateChange('templateName', event.target.value)}
          />
          {validation.templateName ? <span className="error-text">{validation.templateName}</span> : null}
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="template-version">
            Version
          </label>
          <input
            id="template-version"
            className="text-input"
            type="number"
            min={1}
            value={form.version}
            onChange={(event) => onTemplateChange('version', Number(event.target.value))}
          />
          {validation.version ? <span className="error-text">{validation.version}</span> : null}
        </div>
      </div>

      <div className="section-head" style={{ marginTop: '24px' }}>
        <div>
          <h3 className="section-title">Dynamic fields</h3>
          <p className="section-copy">Thêm, sửa và xóa field `TEXT` hoặc `CHECKBOX`.</p>
        </div>
        <div className="field-actions">
          <button type="button" className="button secondary" onClick={() => onAddField('TEXT')}>
            + Add Text Field
          </button>
          <button type="button" className="button ghost" onClick={() => onAddField('CHECKBOX')}>
            + Add Checkbox Field
          </button>
        </div>
      </div>

      {validation.fields ? <span className="error-text">{validation.fields}</span> : null}

      <div className="field-list">
        {form.fields.map((field, index) => (
          <FieldItem
            key={field.id}
            field={field}
            index={index}
            errors={validation.fieldErrors[field.id]}
            isActive={field.id === activeFieldId}
            onChange={onFieldChange}
            onRemove={onRemoveField}
            onSelect={onSelectField}
          />
        ))}
      </div>
    </section>
  )
}