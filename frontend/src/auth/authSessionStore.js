import { createContext, useContext } from 'react'

export const AUTH_SESSION_KEY = 'docmind.authenticated'
export const AUTH_SESSION_VALUE = 'true'
export const AuthContext = createContext(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
