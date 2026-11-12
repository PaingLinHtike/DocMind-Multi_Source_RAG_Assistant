import { apiRequest } from './client.js'

export async function getDashboard({ signal } = {}) {
  const response = await apiRequest('/api/v1/dashboard', { signal })
  return response.data
}
