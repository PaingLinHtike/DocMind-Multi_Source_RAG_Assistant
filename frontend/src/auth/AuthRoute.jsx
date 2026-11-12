import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './authSessionStore.js'

export function ProtectedRoute() {
  const { authenticated, initializationError, initializing } = useAuth()
  if (initializing) return <p className="p-8 text-center text-muted" role="status">Checking your session…</p>
  if (initializationError) return <p className="p-8 text-center text-red-200" role="alert">{initializationError}</p>
  return authenticated ? <Outlet /> : <Navigate replace to="/signin" />
}

export function PublicOnlyRoute() {
  const { authenticated, initializationError, initializing } = useAuth()
  if (initializing) return <p className="p-8 text-center text-muted" role="status">Checking your session…</p>
  if (initializationError) return <p className="p-8 text-center text-red-200" role="alert">{initializationError}</p>
  return authenticated ? <Navigate replace to="/dashboard" /> : <Outlet />
}
