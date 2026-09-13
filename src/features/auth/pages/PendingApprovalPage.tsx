import { useNavigate } from 'react-router-dom'
import { Clock, Shield, Mail, UserCheck } from 'lucide-react'
import { useAuth } from '../AuthProvider'

export function PendingApprovalPage() {
  const { profile, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const handleRefresh = async () => {
    await refreshProfile()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="card p-8">
          <div className="mx-auto h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center mb-6">
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-surface-900">Awaiting Approval</h2>
          <p className="mt-2 text-surface-500">
            Your account has been created and is pending administrator approval.
          </p>

          <div className="mt-6 p-4 rounded-lg bg-surface-100 border border-surface-200 text-left">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="h-5 w-5 text-surface-500" />
              <h3 className="font-medium text-surface-900">What happens next?</h3>
            </div>
            <ul className="space-y-2 text-sm text-surface-600">
              <li className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary-600" />
                An administrator will review your request
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary-600" />
                You&apos;ll receive an email when approved
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary-600" />
                Approval typically takes 1-2 business days
              </li>
            </ul>
          </div>

          {profile && (
            <div className="mt-6 p-4 rounded-lg bg-surface-100 border border-surface-200 text-left">
              <h3 className="font-medium text-surface-900 mb-2">Your Account Details</h3>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-surface-500">Name:</dt>
                  <dd className="font-medium text-surface-900">{profile.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-surface-500">Email:</dt>
                  <dd className="font-medium text-surface-900">{profile.email}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-surface-500">Department:</dt>
                  <dd className="font-medium text-surface-900">{profile.department || 'Not specified'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-surface-500">Status:</dt>
                  <dd className="flex items-center gap-2">
                    <span className="badge badge-warning">Pending Approval</span>
                  </dd>
                </div>
              </dl>
            </div>
          )}

          <div className="mt-6 space-y-3">
            <button
              onClick={handleRefresh}
              className="btn-outline w-full"
            >
              Check Status Again
            </button>
            <button
              onClick={handleSignOut}
              className="btn-ghost w-full text-surface-500 hover:text-surface-700"
            >
              Sign Out
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-surface-400">
          Infrastructure Documentation Platform
        </p>
      </div>
    </div>
  )
}