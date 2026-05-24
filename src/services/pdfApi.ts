import axios from 'axios'
import type { ApiErrorResponse, PdfTemplatePayload } from '../types/pdf'
import { http } from './http'

const PDF_API_BASE_PATH = '/api/pdf'

export function normalizeApiError(error: unknown): ApiErrorResponse {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const data = error.response?.data

    if (data?.message) {
      return {
        timestamp: data.timestamp,
        status: data.status ?? error.response?.status,
        error: data.error,
        message: data.message,
        path: data.path,
        details: data.details ?? null,
      }
    }

    return {
      status: error.response?.status,
      message: error.message || 'Request failed.',
      details: null,
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      details: null,
    }
  }

  return {
    message: 'Unexpected error.',
    details: null,
  }
}

export async function exportTemplate(template: PdfTemplatePayload) {
  const response = await http.post(`${PDF_API_BASE_PATH}/template/export`, template)
  return response.data
}

export async function convertPdf(file: File, template: PdfTemplatePayload) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('template', JSON.stringify(template))

  const response = await http.post(`${PDF_API_BASE_PATH}/convert`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Accept: 'application/pdf',
    },
    responseType: 'blob',
  })

  return response.data
}

export async function generatePdfMessage() {
  const response = await http.get<string>(`${PDF_API_BASE_PATH}/generate`, {
    responseType: 'text',
    transformResponse: [(value) => value],
  })

  return response.data
}