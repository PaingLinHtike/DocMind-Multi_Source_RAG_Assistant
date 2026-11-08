import { apiRequest } from './client.js'

export async function listConversations({ signal } = {}) {
  const response = await apiRequest('/api/v1/conversations', { signal })
  return { conversations: response.data, meta: response.meta }
}

export async function getConversation(id, { signal } = {}) {
  const response = await apiRequest(`/api/v1/conversations/${id}`, { signal })
  return response.data
}

export async function createConversation(title) {
  const body = title ? { title } : {}
  const response = await apiRequest('/api/v1/conversations', { method: 'POST', body })
  return response.data
}

export async function renameConversation(id, title) {
  const response = await apiRequest(`/api/v1/conversations/${id}`, {
    method: 'PATCH',
    body: { title },
  })
  return response.data
}

export function deleteConversation(id) {
  return apiRequest(`/api/v1/conversations/${id}`, { method: 'DELETE' })
}

export async function sendMessage(id, content) {
  const response = await apiRequest(`/api/v1/conversations/${id}/messages`, {
    method: 'POST',
    body: { content },
  })
  return response.data
}
