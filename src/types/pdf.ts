export type FieldType = 'TEXT' | 'CHECKBOX'

export interface PdfField {
  name: string
  type: FieldType
  page: number
  x: number
  y: number
  width: number
  height: number
  required: boolean
  multiline?: boolean // always boolean for TEXT fields
  defaultValue?: string
  maxLength?: number // Số ký tự tối đa cho TEXT field
}

export interface EditablePdfField extends PdfField {
  id: string
}

export interface PdfTemplatePayload {
  templateName: string
  version: number
  fields: PdfField[]
}

export interface TemplateFormState {
  templateName: string
  version: number
  fields: EditablePdfField[]
}

export interface ApiErrorResponse {
  timestamp?: string
  status?: number
  error?: string
  message: string
  path?: string
  details?: string[] | null
}

export interface FieldValidationErrors {
  name?: string
  type?: string
  page?: string
  x?: string
  y?: string
  width?: string
  height?: string
  multiline?: string
  defaultValue?: string
}

export interface TemplateValidationResult {
  templateName?: string
  version?: string
  file?: string
  fields?: string
  fieldErrors: Record<string, FieldValidationErrors>
}

export interface ActionFeedback {
  kind: 'success' | 'error' | 'info'
  title: string
  message: string
  status?: number
  details?: string[]
  payload?: unknown
}

export interface PdfFieldGeometry {
  page: number
  x: number
  y: number
  width: number
  height: number
}