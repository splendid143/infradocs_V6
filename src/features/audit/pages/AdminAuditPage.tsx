import { useState } from 'react'
import { User, Loader2, Filter } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuditLogs } from '@/hooks/useAudit'

export function AdminAuditPage() {
  const [page, setPage] = useState(1)
  const [action, setAction] = useState('')
  const [entityType, setEntityType] = useState('')
  const pageSize = 50

  const { data, isLoading, error, refetch } = useAuditLogs({
    page,
    pageSize,
    action: action || undefined,
    entityType: entityType || undefined,
  })

  const logs = data?.data || []
  const total = data?.count || 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div>
      <PageHeader
        title="Audit Log"
        description="System activity and changes"
        action={
          <Button variant="outline" onClick={() => refetch()}>
            <Filter className="h-4 w-4 mr-2" /> Refresh
          </Button>
        }
      />

      <Card className="mb-4">
        <CardContent className="p-4 flex flex-wrap gap-3">
          <input
            className="input w-48"
            placeholder="Filter action…"
            value={action}
            onChange={(e) => { setAction(e.target.value); setPage(1) }}
          />
          <select className="input w-auto" value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(1) }}>
            <option value="">All entities</option>
            <option value="users">users</option>
            <option value="sites">sites</option>
            <option value="rooms">rooms</option>
            <option value="racks">racks</option>
            <option value="equipment">equipment</option>
            <option value="cables">cables</option>
            <option value="patch_panels">patch_panels</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading && (
            <div className="flex justify-center py-16 text-surface-500">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading audit log…
            </div>
          )}
          {error && (
            <div className="p-6 text-center text-red-600">
              {error.message}
              <p className="text-sm text-surface-500 mt-2">If empty, ensure audit_logs table exists and RLS allows admin read.</p>
            </div>
          )}
          {!isLoading && !error && logs.length === 0 && (
            <div className="p-10 text-center text-surface-500">No audit entries yet.</div>
          )}
          {!isLoading && logs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-200 bg-surface-50">
                    <th className="table-head">Time</th>
                    <th className="table-head">Actor</th>
                    <th className="table-head">Action</th>
                    <th className="table-head">Entity</th>
                    <th className="table-head">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="table-row">
                      <td className="table-cell whitespace-nowrap text-sm text-surface-500">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-surface-400" />
                          <span>{log.actor_name || log.actor_email || log.actor_id?.slice(0, 8)}</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <Badge variant="outline">{log.action}</Badge>
                      </td>
                      <td className="table-cell font-mono text-sm">
                        {log.entity_type} {log.entity_display || log.entity_id?.slice(0, 8)}
                      </td>
                      <td className="table-cell text-surface-600">{log.details || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex justify-between p-4 border-t">
              <span className="text-sm text-surface-500">{total} entries</span>
              <div className="flex gap-2">
                <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <span className="text-sm self-center">Page {page}/{totalPages}</span>
                <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
