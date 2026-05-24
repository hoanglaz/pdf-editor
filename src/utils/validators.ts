import type {
  EditablePdfField,
  FieldValidationErrors,
  PdfField,
  PdfTemplatePayload,
  TemplateFormState,
  TemplateValidationResult,
} from '../types/pdf'

const allowedFieldTypes = new Set(['TEXT', 'CHECKBOX'])

export function isPdfFile(file: File | null | undefined) {
  if (!file) {
    return false
  }

  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

function validateField(field: EditablePdfField): FieldValidationErrors {
  const errors: FieldValidationErrors = {}

  if (!field.name.trim()) {
    errors.name = 'Field name is required.'
  }

  if (!allowedFieldTypes.has(field.type)) {
    errors.type = 'Field type must be TEXT or CHECKBOX.'
  }

  if (field.page < 0) {
    errors.page = 'Page index must be greater than or equal to 0.'
  }

  if (!Number.isFinite(field.x)) {
    errors.x = 'X must be a valid number.'
  }

  if (!Number.isFinite(field.y)) {
    errors.y = 'Y must be a valid number.'
  }

  if (field.width <= 0) {
    errors.width = 'Width must be greater than 0.'
  }

  if (field.height <= 0) {
    errors.height = 'Height must be greater than 0.'
  }

  if (field.type === 'TEXT' && typeof field.multiline !== 'boolean') {
    errors.multiline = 'TEXT fields must declare multiline.'
  }

  if (
    field.type === 'CHECKBOX' &&
    field.defaultValue &&
    !['true', 'false'].includes(field.defaultValue)
  ) {
    errors.defaultValue = 'Checkbox defaultValue should be "true" or "false".'
  }

  return errors
}

export function validateTemplate(
  form: TemplateFormState,
  file?: File | null,
): TemplateValidationResult {
  const fieldErrors = form.fields.reduce<Record<string, FieldValidationErrors>>(
    (accumulator, field) => {
      const errors = validateField(field)

      if (Object.keys(errors).length > 0) {
        accumulator[field.id] = errors
      }

      return accumulator
    },
    {},
  )

  return {
    templateName: form.templateName.trim() ? undefined : 'Template name is required.',
    version: form.version >= 1 ? undefined : 'Version must be greater than or equal to 1.',
    file: file ? (isPdfFile(file) ? undefined : 'Only PDF files are supported.') : undefined,
    fields: form.fields.length > 0 ? undefined : 'At least one field is required.',
    fieldErrors,
  }
}

export function hasValidationErrors(result: TemplateValidationResult) {
  return Boolean(
    result.templateName ||
      result.version ||
      result.file ||
      result.fields ||
      Object.keys(result.fieldErrors).length,
  )
}

export function mapFormToPayload(form: TemplateFormState): PdfTemplatePayload {
  return {
    templateName: form.templateName.trim(),
    version: form.version,
    fields: form.fields.map<PdfField>((field) => {
      const baseField: PdfField = {
        name: field.name,
        type: field.type,
        page: field.page,
        x: field.x,
        y: field.y,
        width: field.width,
        height: field.height,
        required: field.required,
        defaultValue: field.defaultValue,
      }

      if (field.type === 'CHECKBOX') {
        return baseField
      }

      return {
        ...baseField,
        multiline: typeof field.multiline === 'boolean' ? field.multiline : false,
      }
    }),
  }
}