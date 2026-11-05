import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './authSessionStore.js'

export function ProtectedRoute() {
  const { authenticated } = useAuth()
  return authenticated ? <Outlet /> : <Navigate replace to="/signin" />
}

export function PublicOnlyRoute() {
  const { authenticated } = useAuth()
  return authenticated ? <Navigate replace to="/dashboard" /> : <Outlet />
}
