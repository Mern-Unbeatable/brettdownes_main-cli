import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy">
      <div className="flex flex-col items-center gap-4">
        <span className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-cyan" />
        <p className="text-[11px] font-bold tracking-[0.22em] text-white/50 uppercase">Loading</p>
      </div>
    </div>
  )
}

export function RequireAuth() {
  const { ready, isAuthenticated } = useAuth()
  const location = useLocation()

  if (!ready) return <FullPageLoader />
  if (!isAuthenticated) return <Navigate to="/" replace state={{ from: location.pathname }} />
  return <Outlet />
}

export function RequireAdmin() {
  const { ready, isAuthenticated, isAdmin } = useAuth()

  if (!ready) return <FullPageLoader />
  if (!isAuthenticated) return <Navigate to="/" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

export { FullPageLoader }
