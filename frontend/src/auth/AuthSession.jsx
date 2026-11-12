import { useCallback, useEffect, useMemo, useState } from 'react'
import { getCurrentUser, login as loginRequest, logout as logoutRequest, register as registerRequest } from '../api/auth.js'
import { ApiError } from '../api/client.js'
import { AuthContext } from './authSessionStore.js'

export function AuthProvider({ children, initialUser }) {
  const shouldHydrate = initialUser === undefined
  const [user, setUser] = useState(initialUser ?? null)
  const [initializing, setInitializing] = useState(shouldHydrate)
  const [initializationError, setInitializationError] = useState('')

  const handleUnauthorized = useCallback((error) => {
    if (!(error instanceof ApiError) || error.status !== 401) return false
    setUser(null)
    return true
  }, [])

  const refreshUser = useCallback(async () => {
    const currentUser = await getCurrentUser()
    setUser(currentUser)
    setInitializationError('')
    return currentUser
  }, [])

  useEffect(() => {
    if (!shouldHydrate) return undefined
    let active = true

    getCurrentUser()
      .then((currentUser) => {
        if (active) setUser(currentUser)
      })
      .catch((error) => {
        if (!active) return
        if (!(error instanceof ApiError) || error.status !== 401) {
          setInitializationError(error.message)
        }
        setUser(null)
      })
      .finally(() => {
        if (active) setInitializing(false)
      })

    return () => { active = false }
  }, [shouldHydrate])

  const value = useMemo(() => ({
    user,
    authenticated: Boolean(user),
    initializing,
    initializationError,
    async login(credentials) {
      const authenticatedUser = await loginRequest(credentials)
      setUser(authenticatedUser)
      return authenticatedUser
    },
    async register(fields) {
      const registeredUser = await registerRequest(fields)
      setUser(registeredUser)
      return registeredUser
    },
    async logout() {
      await logoutRequest()
      setUser(null)
    },
    refreshUser,
    handleUnauthorized,
  }), [handleUnauthorized, initializationError, initializing, refreshUser, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
