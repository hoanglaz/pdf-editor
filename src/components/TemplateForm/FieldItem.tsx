import type { EditablePdfField, FieldType, FieldValidationErrors } from '../../types/pdf'

interface FieldItemProps {
  field: EditablePdfField
  index: number
  errors?: FieldValidationErrors
  isActive: boolean
  onChange: <K extends keyof EditablePdfField>(
    fieldId: string,
    key: K,
    value: EditablePdfField[K],
  ) => void
  onRemove: (fieldId: string) => void
  onSelect: (fieldId: string) => void
}

const fieldTypeOptions: FieldType[] = ['TEXT', 'CHECKBOX']

function getNumericValue(value: string) {
  const numericValue = Number(value)
  return Number.isNaN(numericValue) ? 0 : numericValue
}

export default function FieldItem({ field, index, errors, isActive, onChange, onRemove, onSelect }: FieldItemProps) {
  return (
    <article className={`field-card${isActive ? ' active' : ''}`} onClick={() => onSelect(field.id)}>
      <div className="field-card-header">
        <div>
          <h3 className="field-card-title">Field #{index + 1}</h3>
          <p className="field-card-subtitle">
            {field.type === 'TEXT'
              ? 'Text input placed on the PDF canvas.'
              : 'Checkbox marker stored as true/false string.'}
          </p>
        </div>
        <button
          type="button"
          className="button danger"
          onClick={(event) => {
            event.stopPropagation()
            onRemove(field.id)
          }}
        >
          Remove field
        </button>
      </div>

      <div className="form-grid two-columns">
        <div className="input-group">
          <label className="input-label" htmlFor={`field-name-${field.id}`}>
            Name
          </label>
          <input
            id={`field-name-${field.id}`}
            className="text-input"
            value={field.name}
            onChange={(event) => onChange(field.id, 'name', event.target.value)}
          />
          {errors?.name ? <span className="error-text">{errors.name}</span> : null}
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor={`field-type-${field.id}`}>
            Type
          </label>
          <select
            id={`field-type-${field.id}`}
            className="select-input"
            value={field.type}
            onChange={(event) => onChange(field.id, 'type', event.target.value as FieldType)}
          >
            {fieldTypeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors?.type ? <span className="error-text">{errors.type}</span> : null}
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor={`field-page-${field.id}`}>
            Page
          </label>
          <input
            id={`field-page-${field.id}`}
            className="text-input"
            type="number"
            min={0}
            value={field.page}
            onChange={(event) => onChange(field.id, 'page', getNumericValue(event.target.value))}
          />
          {errors?.page ? <span className="error-text">{errors.page}</span> : null}
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor={`field-default-${field.id}`}>
            Default value
          </label>
          <input
            id={`field-default-${field.id}`}
            className="text-input"
            value={field.defaultValue ?? ''}
            onChange={(event) => onChange(field.id, 'defaultValue', event.target.value)}
            placeholder={field.type === 'CHECKBOX' ? 'true | false' : 'Optional text'}
          />
          {errors?.defaultValue ? <span className="error-text">{errors.defaultValue}</span> : null}
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor={`field-x-${field.id}`}>
            X
          </label>
          <input
            id={`field-x-${field.id}`}
            className="text-input"
            type="number"
            value={field.x}
            onChange={(event) => onChange(field.id, 'x', getNumericValue(event.target.value))}
          />
          {errors?.x ? <span className="error-text">{errors.x}</span> : null}
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor={`field-y-${field.id}`}>
            Y
          </label>
          <input
            id={`field-y-${field.id}`}
            className="text-input"
            type="number"
            value={field.y}
            onChange={(event) => onChange(field.id, 'y', getNumericValue(event.target.value))}
          />
          {errors?.y ? <span className="error-text">{errors.y}</span> : null}
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor={`field-width-${field.id}`}>
            Width
          </label>
          <input
            id={`field-width-${field.id}`}
            className="text-input"
            type="number"
            min={1}
            value={field.width}
            onChange={(event) => onChange(field.id, 'width', getNumericValue(event.target.value))}
          />
          {errors?.width ? <span className="error-text">{errors.width}</span> : null}
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor={`field-height-${field.id}`}>
            Height
          </label>
          <input
            id={`field-height-${field.id}`}
            className="text-input"
            type="number"
            min={1}
            value={field.height}
            onChange={(event) => onChange(field.id, 'height', getNumericValue(event.target.value))}
          />
          {errors?.height ? <span className="error-text">{errors.height}</span> : null}
        </div>

        <label className="checkbox-row">
          <input
            className="checkbox-input"
            type="checkbox"
            checked={field.required}
            onChange={(event) => onChange(field.id, 'required', event.target.checked)}
          />
          <span>Required field</span>
        </label>

        {field.type === 'TEXT' ? (
          <div className="input-group">
            <label className="checkbox-row">
              <input
                className="checkbox-input"
                type="checkbox"
                checked={Boolean(field.multiline)}
                onChange={(event) => onChange(field.id, 'multiline', event.target.checked)}
              />
              <span>Enable multiline</span>
            </label>
            {errors?.multiline ? <span className="error-text">{errors.multiline}</span> : null}
          </div>
        ) : (
          <div className="input-group">
            <span className="helper-text">Checkbox fields omit `multiline` from the mapped payload.</span>
          </div>
        )}
      </div>
    </article>
  )
}