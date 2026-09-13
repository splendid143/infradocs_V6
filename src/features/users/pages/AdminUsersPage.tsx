import { useState } from 'react'
import { User, Search, Filter, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useUsers } from '@/hooks/useUsers'

const roleBadges: Record<string, 'primary' | 'success' | 'warning' | 'destructive' | 'outline'> = {
  ADMIN: 'destructive',
  ENGINEER: 'primary',
  VIEWER: 'outline',
}

const statusBadges: Record<string, 'primary' | 'success' | 'warning' | 'destructive' | 'outline'> = {
  APPROVED: 'success',
  PENDING: 'warning',
  REJECTED: 'destructive',
  DISABLED: 'destructive',
}

function formatLastLogin(iso: string | null | undefined) {
  if (!iso) return 'Never'
  const d = new Date(iso)
  const sec = Math.floor((Date.now() - d.getTime()) / 1000)
  if (sec < 60) return 'Just now'
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`
  if (sec < 86400) return `${Math.floor(sec / 3600)} hours ago`
  if (sec < 86400 * 7) return `${Math.floor(sec / 86400)} days ago`
  return d.toLocaleDateString()
}

export function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [approvalStatus, setApprovalStatus] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 25

  const { data, isLoading, error, refetch } = useUsers({
    page,
    pageSize,
    search: search || undefined,
    role: role || undefined,
    approvalStatus: approvalStatus || undefined,
  })

  const users = data?.data || []
  const total = data?.count || 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Manage user accounts and permissions"
        action={
          <Link to="/admin/users/pending" className="btn-primary">
            Pending approvals
          </Link>
        }
      />

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400" />
              <input
                type="text"
                placeholder="Search users..."
                className="input pl-10"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              />
            </div>
            <select
              className="input w-auto"
              value={role}
              onChange={(e) => { setRole(e.target.value); setPage(1) }}
            >
              <option value="">All roles</option>
              <option value="ADMIN">ADMIN</option>
              <option value="ENGINEER">ENGINEER</option>
              <option value="VIEWER">VIEWER</option>
            </select>
            <select
              className="input w-auto"
              value={approvalStatus}
              onChange={(e) => { setApprovalStatus(e.target.value); setPage(1) }}
            >
              <option value="">All approval</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
            <Button variant="outline" onClick={() => refetch()}>
              <Filter className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {isLoading && (
            <div className="flex justify-center py-12 text-surface-500">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading users…
            </div>
          )}

          {error && (
            <div className="text-center text-red-600 py-8">
              {error.message}
              <Button variant="outline" className="mt-4" onClick={() => refetch()}>Retry</Button>
            </div>
          )}

          {!isLoading && !error && users.length === 0 && (
            <div className="text-center py-12 text-surface-500">
              <User className="h-10 w-10 mx-auto mb-3 text-surface-300" />
              No users match your filters.
            </div>
          )}

          {!isLoading && users.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-200 text-left text-surface-500">
                    <th className="py-3 pr-4 font-medium">User</th>
                    <th className="py-3 pr-4 font-medium">Role</th>
                    <th className="py-3 pr-4 font-medium">Approval</th>
                    <th className="py-3 pr-4 font-medium">Account</th>
                    <th className="py-3 pr-4 font-medium">Last login</th>
                    <th className="py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-surface-100 hover:bg-surface-50">
                      <td className="py-3 pr-4">
                        <div className="font-medium text-surface-900">{u.name}</div>
                        <div className="text-surface-500">{u.email}</div>
                        <div className="text-xs font-mono text-surface-400">{u.user_code}</div>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={roleBadges[u.role] || 'outline'}>{u.role}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={statusBadges[u.approval_status] || 'outline'}>{u.approval_status}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={statusBadges[u.account_status] || 'outline'}>{u.account_status}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-surface-500">{formatLastLogin(u.last_login_at)}</td>
                      <td className="py-3 text-right">
                        <Link to={`/admin/users/${u.id}`} className="text-primary-600 hover:underline">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-surface-500">{total} users</p>
              <div className="flex gap-2">
                <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <span className="text-sm self-center">Page {page} / {totalPages}</span>
                <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
