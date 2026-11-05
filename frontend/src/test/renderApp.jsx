import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App.jsx'
import { AUTH_SESSION_KEY } from '../auth/AuthSession.jsx'

export function renderApp({ route = '/dashboard', authenticated = true, preserveSession = false } = {}) {
  if (!preserveSession) {
    if (authenticated) window.sessionStorage.setItem(AUTH_SESSION_KEY, 'true')
    else window.sessionStorage.removeItem(AUTH_SESSION_KEY)
  }

  return render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>,
  )
}
