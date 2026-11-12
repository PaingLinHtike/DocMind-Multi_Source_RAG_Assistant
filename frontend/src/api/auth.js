import { apiRequest } from './client.js'

export async function getCurrentUser() {
  const response = await apiRequest('/api/v1/auth/user')
  return response.data
}

export async function login(credentials) {
  const response = await apiRequest('/api/v1/auth/login', { method: 'POST', body: credentials })
  return response.data
}

export async function register(fields) {
  const response = await apiRequest('/api/v1/auth/register', { method: 'POST', body: fields })
  return response.data
}

export function logout() {
  return apiRequest('/api/v1/auth/logout', { method: 'POST' })
}

export function requestPasswordReset(email) {
  return apiRequest('/api/v1/auth/forgot-password', { method: 'POST', body: { email } })
}
