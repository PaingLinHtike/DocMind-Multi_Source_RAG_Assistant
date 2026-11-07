import { useMemo, useState } from 'react'
import { AUTH_SESSION_KEY, AUTH_SESSION_VALUE, AuthContext } from './authSessionStore.js'

export function AuthProvider({ children }) {
  const [authenticated, setAuthenticated] = useState(() => window.sessionStorage.getItem(AUTH_SESSION_KEY) === AUTH_SESSION_VALUE)

  const value = useMemo(() => ({
    authenticated,
    login() {
      window.sessionStorage.setItem(AUTH_SESSION_KEY, AUTH_SESSION_VALUE)
      setAuthenticated(true)
    },
    logout() {
      window.sessionStorage.removeItem(AUTH_SESSION_KEY)
      setAuthenticated(false)
    },
  }), [authenticated])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
