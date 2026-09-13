import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { User, ArrowLeft, Ban, RotateCcw, Loader2, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  useUser,
  useApproveUser,
  useRejectUser,
  useDisableUser,
  useReactivateUser,
  useChangeUserRole,
} from '@/hooks/useUsers'
import { useEntityAuditHistory } from '@/hooks/useAudit'
import { useAuth } from '@/features/auth/AuthProvider'

const roleBadges: Record<string, 'primary' | 'success' | 'warning' | 'destructive' | 'outline'> = {
  ADMIN: 'destructive', ENGINEER: 'primary', VIEWER: 'outline',
}
const statusBadges: Record<string, 'primary' | 'success' | 'warning' | 'destructive' | 'outline'> = {
  APPROVED: 'success', PENDING: 'warning', REJECTED: 'destructive', DISABLED: 'destructive',
}

export function AdminUserDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: me } = useAuth()
  const { data: u, isLoading, error, refetch } = useUser(id || '')
  const { data: audit } = useEntityAuditHistory('users', id || '')
  const approve = useApproveUser()
  const reject = useRejectUser()
  const disable = useDisableUser()
  const reactivate = useReactivateUser()
  const changeRole = useChangeUserRole()
  const [busy, setBusy] = useState(false)
  const [rolePick, setRolePick] = useState<'ENGINEER' | 'VIEWER' | 'ADMIN'>('VIEWER')
  const [msg, setMsg] = useState<string | null>(null)

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    setMsg(null)
    try {
      await fn()
      await refetch()
      setMsg('Updated')
    } catch (e: any) {
      setMsg(e?.message || 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }
  if (error || !u) {
    return (
      <div>
        <PageHeader title="User" description="Not found" />
        <Card><CardContent className="p-6 text-center text-red-600">{error?.message || 'User not found'}
          <div className="mt-4"><Link to="/admin/users" className="btn-outline"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link></div>
        </CardContent></Card>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={u.name || u.email}
        description={u.email}
        action={
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/users" className="btn-outline"><ArrowLeft className="h-4 w-4 mr-2" />Users</Link>
            {u.account_status === 'DISABLED' || !u.is_active ? (
              <Button disabled={busy} onClick={() => run(() => reactivate.mutateAsync(u.id))}>
                <RotateCcw className="h-4 w-4 mr-2" /> Reactivate
              </Button>
            ) : (
              <Button variant="outline" disabled={busy || u.role === 'ADMIN'} onClick={() => run(() => disable.mutateAsync({ id: u.id, disabledBy: me?.id || '' }))}>
                <Ban className="h-4 w-4 mr-2" /> Disable
              </Button>
            )}
          </div>
        }
      />

      {msg && <p className="mb-4 text-sm text-surface-600">{msg}</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div><label className="label">User code</label><p className="font-mono text-sm">{u.user_code}</p></div>
              <div><label className="label">Name</label><p>{u.name}</p></div>
              <div><label className="label">Email</label><p>{u.email}</p></div>
              <div><label className="label">Department</label><p>{u.department || '—'}</p></div>
              <div><label className="label">Role</label><Badge variant={roleBadges[u.role] || 'outline'}>{u.role}</Badge></div>
              <div><label className="label">Approval</label><Badge variant={statusBadges[u.approval_status] || 'outline'}>{u.approval_status}</Badge></div>
              <div><label className="label">Account</label><Badge variant={statusBadges[u.account_status] || 'outline'}>{u.account_status}</Badge></div>
              <div><label className="label">Active</label><p>{u.is_active ? 'Yes' : 'No'}</p></div>
              <div><label className="label">Created</label><p>{u.created_at ? new Date(u.created_at).toLocaleString() : '—'}</p></div>
              <div><label className="label">Approved</label><p>{u.approved_at ? new Date(u.approved_at).toLocaleString() : '—'}{u.approved_by_name ? ` by ${u.approved_by_name}` : ''}</p></div>
              <div><label className="label">Last login</label><p>{u.last_login_at ? new Date(u.last_login_at).toLocaleString() : 'Never'}</p></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Audit / activity</CardTitle></CardHeader>
            <CardContent>
              {(!audit || audit.length === 0) && <p className="text-sm text-surface-500">No audit entries for this user yet.</p>}
              <div className="space-y-3">
                {(audit || []).map((a) => (
                  <div key={a.id} className="flex justify-between gap-4 border-b border-surface-100 py-2 text-sm">
                    <div>
                      <p className="font-medium">{a.action}</p>
                      <p className="text-surface-500">{a.details || a.entity_display || a.entity_type}</p>
                    </div>
                    <div className="text-right text-surface-500 whitespace-nowrap">
                      {new Date(a.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {u.approval_status === 'PENDING' && (
            <Card>
              <CardHeader><CardTitle>Pending approval</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <select className="input" value={rolePick} onChange={(e) => setRolePick(e.target.value as any)}>
                  <option value="VIEWER">VIEWER</option>
                  <option value="ENGINEER">ENGINEER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
                <Button className="w-full" disabled={busy} onClick={() => run(async () => {
                  await approve.mutateAsync({ id: u.id, role: rolePick, approvedBy: me?.id || '' })
                  navigate('/admin/users')
                })}>Approve</Button>
                <Button variant="outline" className="w-full" disabled={busy} onClick={() => run(async () => {
                  await reject.mutateAsync(u.id)
                  navigate('/admin/users')
                })}>Reject</Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Change role</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <select className="input" defaultValue={u.role} id="role-change">
                <option value="VIEWER">VIEWER</option>
                <option value="ENGINEER">ENGINEER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              <Button className="w-full gap-2" disabled={busy} onClick={() => {
                const el = document.getElementById('role-change') as HTMLSelectElement
                run(() => changeRole.mutateAsync({ id: u.id, role: el.value as any }))
              }}>
                <Shield className="h-4 w-4" /> Update role
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
