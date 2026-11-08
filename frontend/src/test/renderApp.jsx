import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App.jsx'

export const authenticatedUser = {
  id: 'user-1',
  name: 'Aung',
  email: 'aung@example.com',
  created_at: '2026-11-01T10:00:00.000000Z',
}

export function renderApp({ route = '/dashboard', authenticated = true, hydrateSession = false } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <App initialUser={hydrateSession ? undefined : (authenticated ? authenticatedUser : null)} />
    </MemoryRouter>,
  )
}
