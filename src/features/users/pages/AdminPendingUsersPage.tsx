import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Check, X, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useUsers, useApproveUser, useRejectUser } from '@/hooks/useUsers'
import { useAuth } from '@/features/auth/AuthProvider'

export function AdminPendingUsersPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data, isLoading, error, refetch } = useUsers({
    page: 1,
    pageSize: 100,
    approvalStatus: 'PENDING',
  })
  const approveMutation = useApproveUser()
  const rejectMutation = useRejectUser()
  const [roleByUser, setRoleByUser] = useState<Record<string, 'ENGINEER' | 'VIEWER' | 'ADMIN'>>({})
  const [busyId, setBusyId] = useState<string | null>(null)

  const pending = data?.data || []

  const handleApprove = async (id: string) => {
    if (!user?.id) return
    setBusyId(id)
    try {
      await approveMutation.mutateAsync({
        id,
        role: roleByUser[id] || 'VIEWER',
        approvedBy: user.id,
      })
      await refetch()
      navigate('/admin/users')
    } finally {
      setBusyId(null)
    }
  }

  const handleReject = async (id: string) => {
    setBusyId(id)
    try {
      await rejectMutation.mutateAsync(id)
      await refetch()
      navigate('/admin/users')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Pending Approvals"
        description="Review and approve new user registrations"
      />

      {isLoading && (
        <div className="flex items-center justify-center py-16 text-surface-500">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading…
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="p-6 text-center text-red-600">
            Failed to load: {error.message}
            <Button variant="outline" className="mt-4" onClick={() => refetch()}>Retry</Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && pending.length === 0 && (
        <Card>
          <CardContent className="p-10 text-center text-surface-500">
            <User className="h-10 w-10 mx-auto mb-3 text-surface-300" />
            <p className="font-medium text-surface-700">No pending approvals</p>
            <p className="text-sm mt-1">New signups will appear here until approved.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {pending.map((u) => (
          <Card key={u.id} className="card-hover">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-surface-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-surface-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-surface-900">{u.name || '—'}</h3>
                    <p className="text-sm text-surface-500">{u.email}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {u.department && <Badge variant="outline">{u.department}</Badge>}
                      <Badge variant="warning">PENDING</Badge>
                      <span className="text-xs text-surface-400 font-mono">{u.user_code}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-surface-500">
                    Signed up: {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                  </span>
                  <select
                    className="input w-auto"
                    value={roleByUser[u.id] || 'VIEWER'}
                    onChange={(e) =>
                      setRoleByUser((prev) => ({
                        ...prev,
                        [u.id]: e.target.value as 'ENGINEER' | 'VIEWER' | 'ADMIN',
                      }))
                    }
                  >
                    <option value="VIEWER">VIEWER</option>
                    <option value="ENGINEER">ENGINEER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                  <Button
                    variant="outline"
                    className="gap-2"
                    disabled={busyId === u.id}
                    onClick={() => handleReject(u.id)}
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    className="gap-2"
                    disabled={busyId === u.id}
                    onClick={() => handleApprove(u.id)}
                  >
                    <Check className="h-4 w-4" />
                    {busyId === u.id ? 'Working…' : 'Approve'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
