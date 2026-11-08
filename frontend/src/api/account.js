import { apiRequest } from './client.js'

export async function updateProfile({ name, email }) {
  const response = await apiRequest('/api/v1/account/profile', {
    method: 'PATCH',
    body: { name, email },
  })
  return response.data
}

export function updatePassword({ currentPassword, password, passwordConfirmation }) {
  return apiRequest('/api/v1/account/password', {
    method: 'PUT',
    body: {
      current_password: currentPassword,
      password,
      password_confirmation: passwordConfirmation,
    },
  })
}
