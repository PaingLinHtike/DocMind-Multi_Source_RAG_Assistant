import { createContext, useContext, useMemo, useState } from 'react'

export const AUTH_SESSION_KEY = 'docmind.authenticated'
const authenticatedMarker = 'true'
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [authenticated, setAuthenticated] = useState(() => window.sessionStorage.getItem(AUTH_SESSION_KEY) === authenticatedMarker)

  const value = useMemo(() => ({
    authenticated,
    login() {
      window.sessionStorage.setItem(AUTH_SESSION_KEY, authenticatedMarker)
      setAuthenticated(true)
    },
    logout() {
      window.sessionStorage.removeItem(AUTH_SESSION_KEY)
      setAuthenticated(false)
    },
  }), [authenticated])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
