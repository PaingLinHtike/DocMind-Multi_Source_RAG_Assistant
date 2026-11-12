import { apiRequest } from './client.js'

function formatUploadedAt(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function normalizeDocument(document) {
  return {
    ...document,
    status: document.status_label,
    chunks: document.chunks ?? '—',
    uploadedAt: formatUploadedAt(document.uploaded_at),
    ragStage: document.rag_stage || document.status,
    failureReason: document.failure_reason,
    indexedAt: document.indexed_at ? formatUploadedAt(document.indexed_at) : null,
    embeddingModel: document.embedding_model,
    vectorCollection: document.vector_collection,
  }
}

export async function listDocuments({ signal } = {}) {
  const response = await apiRequest('/api/v1/documents', { signal })
  return {
    documents: response.data.map(normalizeDocument),
    meta: response.meta,
  }
}

export async function getDocument(id, { signal } = {}) {
  const response = await apiRequest(`/api/v1/documents/${id}`, { signal })
  return normalizeDocument(response.data)
}

export async function renameDocument(id, name) {
  const response = await apiRequest(`/api/v1/documents/${id}`, {
    method: 'PATCH',
    body: { name },
  })
  return normalizeDocument(response.data)
}

export function deleteDocument(id) {
  return apiRequest(`/api/v1/documents/${id}`, { method: 'DELETE' })
}

export async function indexDocument(id) {
  const response = await apiRequest(`/api/v1/documents/${id}/index`, { method: 'POST' })
  return normalizeDocument(response.data)
}

export async function stopDocumentIndex(id) {
  const response = await apiRequest(`/api/v1/documents/${id}/index`, { method: 'DELETE' })
  return normalizeDocument(response.data)
}

export function getDocumentContent(id) {
  return apiRequest(`/api/v1/documents/${id}/content`, { responseType: 'blob' })
}

export function downloadDocument(id) {
  return apiRequest(`/api/v1/documents/${id}/download`, { responseType: 'blob' })
}

export async function uploadDocument(file) {
  const body = new FormData()
  body.append('document', file)
  const response = await apiRequest('/api/v1/documents', { method: 'POST', body })
  return normalizeDocument(response.data)
}

export async function listRecentUploads({ signal } = {}) {
  const response = await apiRequest('/api/v1/uploads/recent', { signal })
  return response.data.map(normalizeDocument)
}
