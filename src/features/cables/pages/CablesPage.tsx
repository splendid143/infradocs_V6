import { useState } from 'react'
import { Cable, Plus, Search, Loader2, Filter } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { useCables, useCreateCable } from '@/hooks/useCables'
import { useAuth } from '@/features/auth/AuthProvider'

const cableTypeColors: Record<string, 'primary' | 'success' | 'warning' | 'destructive' | 'outline'> = {
  FIBER: 'primary',
  COPPER: 'warning',
  COAX: 'outline',
  POWER: 'destructive',
  OTHER: 'outline',
}

const statusColors: Record<string, 'primary' | 'success' | 'warning' | 'destructive' | 'outline'> = {
  PLANNED: 'outline',
  INSTALLED: 'primary',
  TESTED: 'warning',
  VERIFIED: 'success',
  ISSUE: 'destructive',
  REMOVED: 'destructive',
  ARCHIVED: 'outline',
}

export function CablesPage() {
  const { hasPermission } = useAuth()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('')
  const [cableType, setCableType] = useState<string>('')
  const [page, setPage] = useState(1)
  const [siteId, setSiteId] = useState<string>('')
  const [roomId, setRoomId] = useState<string>('')
  const [rackId, setRackId] = useState<string>('')
  const [patchPanelId, setPatchPanelId] = useState<string>('')
  const pageSize = 12

  const { data, isLoading, error, refetch } = useCables({ page, pageSize, search, status, cableType, siteId, roomId, rackId, patchPanelId })
  const createCableMutation = useCreateCable()

  const canCreate = hasPermission('infrastructure.create')

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Cables" description="Manage fiber and copper cable connections" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 space-y-4">
                <div className="h-10 w-10 bg-surface-200 rounded-lg" />
                <div className="h-6 w-3/4 bg-surface-200 rounded" />
                <div className="h-4 w-1/2 bg-surface-200 rounded" />
                <div className="h-4 w-full bg-surface-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Cables" description="Manage fiber and copper cable connections" />
        <Card>
          <CardContent className="p-6 text-center text-red-600">
            Failed to load cables: {error.message}
            <button className="btn-outline mt-4" onClick={() => refetch()}>Retry</button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const cables = data?.data || []
  const totalCount = data?.count || 0
  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div>
      <PageHeader
        title="Cables"
        description="Manage fiber and copper cable connections"
        action={
          <div className="flex gap-2">
            {canCreate && (
              <Link to="/cables/new" className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Cable
              </Link>
            )}
            <Link to="/search" className="btn-outline">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Link>
          </div>
        }
      />

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400" />
              <Input
                placeholder="Search cables..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="input w-auto"
            >
              <option value="">All Statuses</option>
              <option value="PLANNED">Planned</option>
              <option value="INSTALLED">Installed</option>
              <option value="TESTED">Tested</option>
              <option value="VERIFIED">Verified</option>
              <option value="ISSUE">Issue</option>
              <option value="REMOVED">Removed</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <select
              value={cableType}
              onChange={(e) => { setCableType(e.target.value); setPage(1); }}
              className="input w-auto"
            >
              <option value="">All Types</option>
              <option value="FIBER">Fiber</option>
              <option value="COPPER">Copper</option>
              <option value="COAX">Coax</option>
              <option value="POWER">Power</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {cables.length === 0 ? (
            <div className="text-center py-12 text-surface-500">
              <Cable className="h-12 w-12 mx-auto mb-4 text-surface-300" />
              <p>No cables found. {canCreate ? 'Create your first cable to get started.' : ''}</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {cables.map((cable) => (
                  <Card key={cable.id} className="card-hover">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <Cable className="h-10 w-10 text-primary-600" />
                        <Badge variant={statusColors[cable.status] || 'outline'}>{cable.status}</Badge>
                      </div>
                      <Link to={`/cables/${cable.id}`} className="block">
                        <h3 className="text-lg font-semibold text-surface-900 hover:text-primary-600 transition-colors font-mono">
                          {cable.cable_id}
                        </h3>
                      </Link>
                      <div className="mt-2 space-y-1 text-sm text-surface-500">
                        <p>
                          <Badge variant={cableTypeColors[cable.cable_type] || 'outline'} className="mr-2">{cable.cable_type}</Badge>
                          {cable.specification}
                        </p>
                        <p>{cable.length_m ? `${cable.length_m}m` : ''}{cable.length_ft ? ` (${cable.length_ft}ft)` : ''}</p>
                        <p>
                          {cable.endpoint_a?.equipment_port?.equipment?.name || cable.endpoint_a?.patch_port?.patch_panel?.name}
                          {' → '}
                          {cable.endpoint_b?.equipment_port?.equipment?.name || cable.endpoint_b?.patch_port?.patch_panel?.name}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm text-surface-500">
                    Page {page} of {totalPages} ({totalCount} total)
                  </p>
                  <div className="flex gap-2">
                    <button
                      className="btn-outline btn-sm"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </button>
                    <button
                      className="btn-outline btn-sm"
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}