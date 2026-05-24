import { useEffect, useMemo, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import type { EditablePdfField, FieldType, PdfFieldGeometry } from '../../types/pdf'

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

interface PdfCanvasEditorProps {
  file: File | null
  fields: EditablePdfField[]
  activeFieldId: string | null
  placementMode: FieldType | null
  onSelectField: (fieldId: string) => void
  onFieldGeometryChange: (fieldId: string, geometry: PdfFieldGeometry) => void
  onPlaceField: (type: FieldType, page: number, x: number, y: number) => void
  onPageCountChange?: (count: number) => void
}

interface PageMetric {
  width: number
  height: number
}

interface PointerOperation {
  type: 'move' | 'resize'
  fieldId: string
  page: number
  pointerId: number
  startClientX: number
  startClientY: number
  startX: number
  startY: number
  startWidth: number
  startHeight: number
}

const MIN_FIELD_SIZE = 12
const MAX_VIEWER_WIDTH = 760

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export default function PdfCanvasEditor({
  file,
  fields,
  activeFieldId,
  placementMode,
  onSelectField,
  onFieldGeometryChange,
  onPlaceField,
  onPageCountChange,
}: PdfCanvasEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [pageMetrics, setPageMetrics] = useState<Record<number, PageMetric>>({})
  const [containerWidth, setContainerWidth] = useState(0)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [operation, setOperation] = useState<PointerOperation | null>(null)

  useEffect(() => {
    if (!containerRef.current) {
      return undefined
    }

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0
      setContainerWidth(width)
    })

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!operation) {
      return undefined
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerId !== operation.pointerId) {
        return
      }

      const field = fields.find((item) => item.id === operation.fieldId)
      const pageMetric = pageMetrics[operation.page]

      if (!field || !pageMetric) {
        return
      }

      const renderWidth = getRenderWidth(containerWidth)
      const scale = renderWidth / pageMetric.width
      const deltaX = (event.clientX - operation.startClientX) / scale
      const deltaY = (event.clientY - operation.startClientY) / scale

      if (operation.type === 'move') {
        const nextX = clamp(operation.startX + deltaX, 0, pageMetric.width - field.width)
        const nextY = clamp(operation.startY - deltaY, 0, pageMetric.height - field.height)

        onFieldGeometryChange(field.id, {
          page: field.page,
          x: roundValue(nextX),
          y: roundValue(nextY),
          width: field.width,
          height: field.height,
        })
        return
      }

      const topEdge = pageMetric.height - operation.startY - operation.startHeight
      const maxWidth = pageMetric.width - operation.startX
      const nextWidth = clamp(operation.startWidth + deltaX, MIN_FIELD_SIZE, maxWidth)
      const maxHeight = pageMetric.height - topEdge
      const nextHeight = clamp(operation.startHeight + deltaY, MIN_FIELD_SIZE, maxHeight)
      const nextY = clamp(pageMetric.height - topEdge - nextHeight, 0, pageMetric.height - nextHeight)

      onFieldGeometryChange(field.id, {
        page: field.page,
        x: field.x,
        y: roundValue(nextY),
        width: roundValue(nextWidth),
        height: roundValue(nextHeight),
      })
    }

    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerId === operation.pointerId) {
        setOperation(null)
      }
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [containerWidth, fields, onFieldGeometryChange, operation, pageMetrics])

  const activeField = useMemo(
    () => fields.find((field) => field.id === activeFieldId) ?? null,
    [activeFieldId, fields],
  )

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setPageCount(numPages)
    setPageMetrics({})
    setLoadError(null)
    onPageCountChange?.(numPages)
  }

  useEffect(() => {
    if (!file) {
      setPageCount(0)
      onPageCountChange?.(0)
    }
  }, [file, onPageCountChange])

  const handlePageLoadSuccess = (
    pageIndex: number,
    page: { width: number; height: number; originalWidth: number; originalHeight: number },
  ) => {
    setPageMetrics((current) => ({
      ...current,
      [pageIndex]: {
        width: page.originalWidth,
        height: page.originalHeight,
      },
    }))
  }

  const handleCanvasClick = (pageIndex: number, event: React.MouseEvent<HTMLDivElement>) => {
    const pageMetric = pageMetrics[pageIndex]
    const frame = event.currentTarget.getBoundingClientRect()

    if (!pageMetric || frame.width === 0) {
      return
    }

    const scale = frame.width / pageMetric.width
    const clickX = (event.clientX - frame.left) / scale
    const clickY = (event.clientY - frame.top) / scale

    if (placementMode) {
      const defW = placementMode === 'CHECKBOX' ? 18 : 200
      const defH = placementMode === 'CHECKBOX' ? 18 : 24
      const nextX = clamp(clickX - defW / 2, 0, pageMetric.width - defW)
      const topEdge = clamp(clickY - defH / 2, 0, pageMetric.height - defH)
      onPlaceField(placementMode, pageIndex, roundValue(nextX), roundValue(pageMetric.height - topEdge - defH))
      return
    }

    if (!activeField) {
      return
    }

    const nextX = clamp(clickX - activeField.width / 2, 0, pageMetric.width - activeField.width)
    const top = clamp(clickY - activeField.height / 2, 0, pageMetric.height - activeField.height)

    onFieldGeometryChange(activeField.id, {
      page: pageIndex,
      x: roundValue(nextX),
      y: roundValue(pageMetric.height - top - activeField.height),
      width: activeField.width,
      height: activeField.height,
    })
  }

  const renderWidth = getRenderWidth(containerWidth)

  return (
    <div className="pdf-canvas-root">
      {!file ? (
        <div className="pdf-canvas-empty">
          <span className="pdf-canvas-empty-icon">📄</span>
          <p>Upload a PDF to start placing fields.</p>
        </div>
      ) : (
        <div ref={containerRef} className="pdf-editor-shell">
          <Document
            file={file}
            loading={<div className="pdf-canvas-loading">Loading PDF...</div>}
            onLoadSuccess={handleDocumentLoadSuccess}
            onLoadError={(error) => setLoadError(error.message)}
          >
            <div className="pdf-page-list">
              {loadError ? <div className="pdf-canvas-error">Cannot render PDF: {loadError}</div> : null}
              {Array.from({ length: pageCount }, (_, pageIndex) => {
                const metric = pageMetrics[pageIndex]
                const pageHeight = metric ? metric.height * (renderWidth / metric.width) : undefined

                return (
                  <article key={pageIndex} className="pdf-page-card">
                    <div className="pdf-page-card-header">
                      <span className="pill">Page {pageIndex + 1}</span>
                    </div>

                    <div
                      className={`pdf-page-frame${placementMode ? ' placement-cursor' : ''}`}
                      style={{ width: renderWidth, height: pageHeight }}
                      onClick={(event) => handleCanvasClick(pageIndex, event)}
                    >
                      <Page
                        pageNumber={pageIndex + 1}
                        width={renderWidth}
                        renderAnnotationLayer={false}
                        renderTextLayer={false}
                        loading={<div className="empty-state">Đang render trang {pageIndex + 1}...</div>}
                        onLoadSuccess={(page) => handlePageLoadSuccess(pageIndex, page)}
                      />

                      {metric ? (
                        <div className="pdf-page-overlay">
                          {fields
                            .filter((field) => field.page === pageIndex)
                            .map((field) => {
                              const scale = renderWidth / metric.width
                              const left = field.x * scale
                              const top = (metric.height - field.y - field.height) * scale
                              const width = field.width * scale
                              const height = field.height * scale
                              const isActive = field.id === activeFieldId

                              return (
                                <button
                                  key={field.id}
                                  type="button"
                                  className={`pdf-field-overlay ${field.type === 'CHECKBOX' ? 'checkbox' : 'text'}${isActive ? ' active' : ''}`}
                                  style={{ left, top, width, height }}
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    onSelectField(field.id)
                                  }}
                                  onPointerDown={(event) => {
                                    event.stopPropagation()
                                    onSelectField(field.id)
                                    setOperation({
                                      type: 'move',
                                      fieldId: field.id,
                                      page: pageIndex,
                                      pointerId: event.pointerId,
                                      startClientX: event.clientX,
                                      startClientY: event.clientY,
                                      startX: field.x,
                                      startY: field.y,
                                      startWidth: field.width,
                                      startHeight: field.height,
                                    })
                                  }}
                                >
                                  <span className="pdf-field-label">{field.name || field.type}</span>
                                  <span
                                    role="presentation"
                                    className="pdf-field-resize-handle"
                                    onPointerDown={(event) => {
                                      event.stopPropagation()
                                      onSelectField(field.id)
                                      setOperation({
                                        type: 'resize',
                                        fieldId: field.id,
                                        page: pageIndex,
                                        pointerId: event.pointerId,
                                        startClientX: event.clientX,
                                        startClientY: event.clientY,
                                        startX: field.x,
                                        startY: field.y,
                                        startWidth: field.width,
                                        startHeight: field.height,
                                      })
                                    }}
                                  />
                                </button>
                              )
                            })}
                        </div>
                      ) : null}
                    </div>
                  </article>
                )
              })}
            </div>
          </Document>
        </div>
      )}
    </div>
  )
}

function getRenderWidth(containerWidth: number) {
  if (containerWidth <= 0) {
    return MAX_VIEWER_WIDTH
  }

  return clamp(containerWidth - 4, 280, MAX_VIEWER_WIDTH)
}

function roundValue(value: number) {
  return Math.round(value * 100) / 100
}