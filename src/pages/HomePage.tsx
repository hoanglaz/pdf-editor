import { useEffect, useMemo, useRef, useState } from 'react'
import { getDocument } from 'pdfjs-dist'
import FieldProperties from '../components/FieldProperties/FieldProperties'
import FieldSidebar from '../components/FieldSidebar/FieldSidebar'
import PdfCanvasEditor from '../components/PdfCanvasEditor/PdfCanvasEditor'
import { convertPdf, exportTemplate, normalizeApiError } from '../services/pdfApi'
import type {
  ActionFeedback,
  EditablePdfField,
  FieldType,
  PdfFieldGeometry,
  TemplateFormState,
  TemplateValidationResult,
} from '../types/pdf'
import { downloadBlob } from '../utils/download'
import { hasValidationErrors, isPdfFile, mapFormToPayload, validateTemplate } from '../utils/validators'

const EMPTY_FORM: TemplateFormState = {
  templateName: '',
  version: 1,
  fields: [],
}

const EMPTY_VALIDATION: TemplateValidationResult = {
  fieldErrors: {},
}

const TEXT_FIELD_HEIGHT = 24
const MIN_TEXT_FIELD_WIDTH = 72
const MAX_TEXT_FIELD_WIDTH = 144
const APPROX_TEXT_CHAR_WIDTH = 8

function getDefaultTextFieldWidth(text: string) {
  const nextWidth = text.length * APPROX_TEXT_CHAR_WIDTH + 28
  return Math.min(Math.max(nextWidth, MIN_TEXT_FIELD_WIDTH), MAX_TEXT_FIELD_WIDTH)
}

function getTemplateNameFromFile(file: File) {
  return file.name.replace(/\.pdf$/i, '').trim()
}

function getNextFieldName(fields: EditablePdfField[], type: FieldType) {
  const prefix = type === 'CHECKBOX' ? 'checkboxField' : 'textField'
  const usedNames = new Set(fields.map((field) => field.name))
  let index = 1

  while (usedNames.has(`${prefix}${index}`)) {
    index += 1
  }

  return `${prefix}${index}`
}

function createField(
  fields: EditablePdfField[],
  type: FieldType,
  page = 0,
  x?: number,
  y?: number,
): EditablePdfField {
  const id = globalThis.crypto?.randomUUID?.() ?? `field-${Date.now()}-${Math.random().toString(16).slice(2)}`
  const name = getNextFieldName(fields, type)

  if (type === 'CHECKBOX') {
    return { id, name, type, page, x: x ?? 80, y: y ?? 600, width: 18, height: 18, required: false, defaultValue: 'false' }
  }

  return {
    id,
    name,
    type,
    page,
    x: x ?? 80,
    y: y ?? 650,
    width: MIN_TEXT_FIELD_WIDTH,
    height: TEXT_FIELD_HEIGHT,
    required: false,
    multiline: false,
    defaultValue: '',
  }
}

function collectValidationMessages(validation: TemplateValidationResult) {
  const messages = [validation.templateName, validation.version, validation.file, validation.fields].filter(Boolean) as string[]
  Object.values(validation.fieldErrors).forEach((fieldErrorSet) => {
    Object.values(fieldErrorSet).forEach((message) => { if (message) messages.push(message) })
  })
  return messages
}

export default function HomePage() {
  // Clipboard tạm cho copy/paste field
  const clipboardRef = useRef<EditablePdfField | null>(null)
  const [form, setForm] = useState<TemplateFormState>(() => {
    try {
      const saved = localStorage.getItem('pdf-editor-form')
      if (saved) return JSON.parse(saved)
    } catch {}
    return EMPTY_FORM
  })
  const [validation, setValidation] = useState<TemplateValidationResult>(EMPTY_VALIDATION)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null)
  const [placementMode, setPlacementMode] = useState<FieldType | null>(null)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [result, setResult] = useState<ActionFeedback | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const payload = useMemo(() => mapFormToPayload(form), [form])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape: hủy chế độ placement
      if (e.key === 'Escape') setPlacementMode(null)

      // Copy (Ctrl/Cmd + C)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        if (activeFieldId) {
          const field = form.fields.find(f => f.id === activeFieldId)
          if (field) clipboardRef.current = field
        }
      }

      // Paste (Ctrl/Cmd + V)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        const copied = clipboardRef.current
        if (copied) {
          // Tạo field mới với id mới, vị trí lệch nhẹ
          const offset = 24
          const newField: EditablePdfField = {
            ...copied,
            id: globalThis.crypto?.randomUUID?.() ?? `field-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            x: copied.x + offset,
            y: copied.y + offset,
            name: getNextFieldName(form.fields, copied.type),
          }
          setForm(current => ({ ...current, fields: [...current.fields, newField] }))
          setActiveFieldId(newField.id)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeFieldId, form.fields])

  // Helper: convert File <-> base64
  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
  function base64ToFile(base64: string, fileName: string, fileType: string): File {
    const arr = base64.split(',')
    const mime = arr[0].match(/:(.*?);/)[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) u8arr[n] = bstr.charCodeAt(n)
    return new File([u8arr], fileName, { type: fileType || mime })
  }

  // Khôi phục file và form từ localStorage khi load lại trang
  useEffect(() => {
    const savedFile = localStorage.getItem('pdf-editor-file')
    const savedFileMeta = localStorage.getItem('pdf-editor-file-meta')
    if (savedFile && savedFileMeta) {
      try {
        const meta = JSON.parse(savedFileMeta)
        const file = base64ToFile(savedFile, meta.name, meta.type)
        setSelectedFile(file)
      } catch {}
    }
  }, [])

  // Lưu form và file vào localStorage mỗi khi thay đổi
  useEffect(() => {
    try {
      localStorage.setItem('pdf-editor-form', JSON.stringify(form))
    } catch {}
  }, [form])
  useEffect(() => {
    if (selectedFile) {
      fileToBase64(selectedFile).then((base64) => {
        localStorage.setItem('pdf-editor-file', base64)
        localStorage.setItem('pdf-editor-file-meta', JSON.stringify({ name: selectedFile.name, type: selectedFile.type }))
      })
    } else {
      localStorage.removeItem('pdf-editor-file')
      localStorage.removeItem('pdf-editor-file-meta')
    }
  }, [selectedFile])

  // Detect AcroForm fields from PDF and add to fields
  const handleFileChange = async (file: File | null) => {
    if (file && !isPdfFile(file)) {
      setValidation((current) => ({ ...current, file: 'Only PDF files are supported.' }))
      return
    }

    if (file) {
      const nextTemplateName = getTemplateNameFromFile(file)
      setForm((current) => (
        current.templateName.trim()
          ? current
          : { ...current, templateName: nextTemplateName }
      ))
      // Detect form fields
      try {
        const arrayBuffer = await file.arrayBuffer()
        // @ts-ignore
        const pdf = await getDocument({ data: arrayBuffer }).promise
        const fields: EditablePdfField[] = []
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum)
          const annotations = await page.getAnnotations()
          annotations.forEach((ann) => {
            if (ann.subtype === 'Widget' && ann.fieldType) {
              // Map PDF field type to our FieldType
              let type: FieldType | undefined
              if (ann.fieldType === 'Tx') type = 'TEXT'
              if (ann.fieldType === 'Btn' && ann.checkBox) type = 'CHECKBOX'
              if (!type) return
              // Calculate geometry
              const rect = ann.rect // [llx, lly, urx, ury]
              const x = rect[0]
              const y = rect[1]
              const width = rect[2] - rect[0]
              const height = rect[3] - rect[1]
              fields.push({
                id: globalThis.crypto?.randomUUID?.() ?? `field-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                name: ann.fieldName || `${type.toLowerCase()}Field${fields.length + 1}`,
                type,
                page: pageNum - 1,
                x,
                y,
                width,
                height,
                required: !!ann.required,
                multiline: ann.multiline,
                defaultValue: ann.fieldValue ?? (type === 'CHECKBOX' ? (ann.fieldValue ? 'true' : 'false') : ''),
              })
            }
          })
        }
        setForm((current) => ({ ...current, fields }))
      } catch (e) {
        // Nếu lỗi vẫn cho upload bình thường
        setForm((current) => ({ ...current, fields: [] }))
      }
    } else {
      setForm((current) => ({ ...current, fields: [] }))
    }
    setSelectedFile(file)
    setValidation((current) => ({ ...current, file: undefined, templateName: undefined }))
  }

  const handleFieldChange = <K extends keyof EditablePdfField>(fieldId: string, key: K, value: EditablePdfField[K]) => {
    setForm((current) => ({
      ...current,
      fields: current.fields.map((field) => {
        if (field.id !== fieldId) return field
        if (key === 'type') {
          const nextType = value as FieldType
          if (nextType === 'CHECKBOX') return { ...field, type: nextType, defaultValue: field.defaultValue || 'false', multiline: undefined }
          return {
            ...field,
            type: nextType,
            width: Math.max(field.width, MIN_TEXT_FIELD_WIDTH),
            multiline: typeof field.multiline === 'boolean' ? field.multiline : false,
          }
        }
        if (key === 'defaultValue' && field.type === 'TEXT') {
          const nextDefaultValue = String(value ?? '')
          return {
            ...field,
            defaultValue: nextDefaultValue,
            width: Math.max(field.width, getDefaultTextFieldWidth(nextDefaultValue)),
          }
        }
        return { ...field, [key]: value }
      }),
    }))
  }

  const handleRemoveField = (fieldId: string) => {
    setForm((current) => ({ ...current, fields: current.fields.filter((f) => f.id !== fieldId) }))
    setActiveFieldId((current) => (current === fieldId ? null : current))
  }

  const handleFieldGeometryChange = (fieldId: string, geometry: PdfFieldGeometry) => {
    setForm((current) => ({
      ...current,
      fields: current.fields.map((field) => (field.id === fieldId ? { ...field, ...geometry } : field)),
    }))
  }

  const handleStartPlacement = (type: FieldType) => {
    setPlacementMode((current) => (current === type ? null : type))
  }

  const handlePlaceField = (type: FieldType, page: number, x: number, y: number) => {
    setForm((current) => {
      const newField = createField(current.fields, type, page, x, y)
      setActiveFieldId(newField.id)
      setPlacementMode(null)
      return { ...current, fields: [...current.fields, newField] }
    })
  }

  const handleConvertRequest = async () => {
    const nextValidation = validateTemplate(form, selectedFile)
    setValidation(nextValidation)
    if (hasValidationErrors(nextValidation) || !selectedFile || !isPdfFile(selectedFile)) {
      setResult({ kind: 'error', title: 'Convert blocked', message: 'Fix validation errors and upload a PDF first.', details: collectValidationMessages(nextValidation) })
      return
    }
    setLoadingAction('pdf convert')
    try {
      const pdfBlob = await convertPdf(selectedFile, payload)
      downloadBlob(pdfBlob, 'fillable-output.pdf')
      setResult({ kind: 'success', title: 'PDF converted', message: 'Download started.', payload: { filename: 'fillable-output.pdf', size: `${(pdfBlob.size / 1024).toFixed(1)} KB` } })
    } catch (error) {
      const normalized = normalizeApiError(error)
      setResult({ kind: 'error', title: 'Convert failed', message: normalized.message, status: normalized.status, details: normalized.details ?? undefined, payload: normalized })
    } finally {
      setLoadingAction(null)
    }
  }

  const handleValidateRequest = async () => {
    const nextValidation = validateTemplate(form, null)
    setValidation(nextValidation)
    if (hasValidationErrors(nextValidation)) {
      setResult({ kind: 'error', title: 'Validation failed', message: 'Fix errors before submitting.', details: collectValidationMessages(nextValidation) })
      return
    }
    setLoadingAction('template export')
    try {
      const response = await exportTemplate(payload)
      setResult({ kind: 'success', title: 'Template valid', message: 'Backend accepted the template.', payload: response })
    } catch (error) {
      const normalized = normalizeApiError(error)
      setResult({ kind: 'error', title: 'Validation failed', message: normalized.message, status: normalized.status, details: normalized.details ?? undefined, payload: normalized })
    } finally {
      setLoadingAction(null)
    }
  }

  const activeField = form.fields.find((f) => f.id === activeFieldId) ?? null

  return (
    <div className="editor-shell">
      <header className="editor-brandbar">
        <div className="brand-left">
          <span className="editor-logo">PDF Tool</span>
          <nav className="brand-nav" aria-label="Primary">
            <button type="button" className="brand-link active">Dashboard</button>
            <button type="button" className="brand-link">Workflows</button>
            <button type="button" className="brand-link">History</button>
          </nav>
        </div>

        <label className="brand-search" htmlFor="doc-search">
          <span className="brand-search-icon">⌕</span>
          <input id="doc-search" type="search" placeholder="Search documents..." />
        </label>

        <div className="brand-actions" aria-label="Utilities">
          <button type="button" className="brand-icon-btn" title="Notifications">◔</button>
          <button type="button" className="brand-icon-btn" title="Settings">⚙</button>
          <button type="button" className="brand-avatar" title="Profile">YK</button>
        </div>
      </header>

      <header className="editor-topbar">
        <input
          ref={fileInputRef}
          id="pdf-file-input"
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          className={`topbar-tool-btn${placementMode === 'TEXT' ? ' active' : ''}`}
          onClick={() => handleStartPlacement('TEXT')}
          title="Add text field - click on PDF to place"
        >
          <span className="topbar-tool-icon">T</span>
          Add Text Field
        </button>
        <button
          type="button"
          className={`topbar-tool-btn${placementMode === 'CHECKBOX' ? ' active' : ''}`}
          onClick={() => handleStartPlacement('CHECKBOX')}
          title="Add checkbox - click on PDF to place"
        >
          <span className="topbar-tool-icon">☑</span>
          Add Checkbox
        </button>
        <button type="button" className="topbar-tool-btn muted" onClick={() => fileInputRef.current?.click()}>
          <span className="topbar-tool-icon">↥</span>
          {selectedFile ? 'Replace PDF' : 'Upload PDF'}
        </button>

        {placementMode && <span className="topbar-placement-hint">Click on page to place - Esc to cancel</span>}
        {validation.file && <span className="topbar-error">{validation.file}</span>}

        <div className="topbar-spacer" />

        <div className="topbar-page-badge">Page {Math.min(1, pageCount || 1)} of {Math.max(1, pageCount)}</div>
        <input
          className="topbar-template-input"
          value={form.templateName}
          onChange={(e) => setForm((c) => ({ ...c, templateName: e.target.value }))}
          placeholder="Template name"
        />
        <button
          type="button"
          className="topbar-btn secondary"
          onClick={handleValidateRequest}
          disabled={Boolean(loadingAction)}
        >
          Validate
        </button>
        <button
          type="button"
          className="topbar-apply-btn"
          onClick={handleConvertRequest}
          disabled={Boolean(loadingAction)}
        >
          {loadingAction === 'pdf convert' ? 'Exporting...' : 'Export PDF'}
        </button>
      </header>

      {result && (
        <div className={`editor-notification ${result.kind}`}>
          <span>
            <strong>{result.title}:</strong> {result.message}
            {result.details && result.details.length > 0 && <span> - {result.details.join('; ')}</span>}
          </span>
          <button type="button" className="notification-close" onClick={() => setResult(null)}>&times;</button>
        </div>
      )}

      <div className="editor-main">
        <FieldSidebar
          fields={form.fields}
          activeFieldId={activeFieldId}
          placementMode={placementMode}
          onStartPlacement={handleStartPlacement}
          onSelectField={setActiveFieldId}
          onRemoveField={handleRemoveField}
        />

        <div className="editor-canvas-area">
          <PdfCanvasEditor
            key={selectedFile ? `${selectedFile.name}-${selectedFile.lastModified}-${selectedFile.size}` : 'no-file'}
            file={selectedFile}
            fields={form.fields}
            activeFieldId={activeFieldId}
            placementMode={placementMode}
            onSelectField={setActiveFieldId}
            onFieldChange={handleFieldChange}
            onFieldGeometryChange={handleFieldGeometryChange}
            onPlaceField={handlePlaceField}
            onPageCountChange={setPageCount}
          />
        </div>

        <FieldProperties field={activeField} onChange={handleFieldChange} />
      </div>
    </div>
  )
}
