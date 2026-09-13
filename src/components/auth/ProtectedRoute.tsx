import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthProvider'
import { Loader } from '@/components/ui/Loader'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isApproved, isActive } = useAuth()
  const location = useLocation()

  if (loading) {
    return <Loader fullScreen />
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!isApproved) {
    return <Navigate to="/pending-approval" replace />
  }

  if (!isActive) {
    return <Navigate to="/account-disabled" replace />
  }

  return <>{children}</>
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin, isApproved, isActive } = useAuth()
  const location = useLocation()

  if (loading) {
    return <Loader fullScreen />
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!isApproved || !isActive) {
    return <Navigate to="/dashboard" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <Loader fullScreen />
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}