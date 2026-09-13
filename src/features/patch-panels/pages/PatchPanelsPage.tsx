import { useState } from 'react'
import { Cable, Plus, Search, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { usePatchPanels, useCreatePatchPanel } from '@/hooks/usePatchPanels'
import { useRacks } from '@/hooks/useRacks'
import { useAuth } from '@/features/auth/AuthProvider'

const statusBadges: Record<string, 'primary' | 'success' | 'warning' | 'destructive' | 'outline'> = {
  PLANNED: 'outline',
  INSTALLED: 'primary',
  TESTED: 'warning',
  VERIFIED: 'success',
  ISSUE: 'destructive',
  REMOVED: 'destructive',
  ARCHIVED: 'outline',
}

export function PatchPanelsPage() {
  const { hasPermission } = useAuth()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('')
  const [page, setPage] = useState(1)
  const [siteId, setSiteId] = useState<string>('')
  const [roomId, setRoomId] = useState<string>('')
  const [rackId, setRackId] = useState<string>('')
  const pageSize = 12

  const { data, isLoading, error, refetch } = usePatchPanels({ page, pageSize, search, status, siteId, roomId, rackId })
  const createPatchPanelMutation = useCreatePatchPanel()
  const { data: racksData } = useRacks({ pageSize: 200 })
  const allRacks = racksData?.data || []

  const canCreate = hasPermission('infrastructure.create')

  const handleCreatePatchPanel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const panelData = {
      rack_id: formData.get('rackId') as string,
      panel_id: formData.get('panelId') as string,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      panel_type: formData.get('panelType') as string,
      port_count: parseInt(formData.get('portCount') as string) || 48,
      position_u: formData.get('positionU') ? parseInt(formData.get('positionU') as string) : null,
      height_u: parseInt(formData.get('heightU') as string) || 1,
      status: 'PLANNED' as const,
      created_by: (await (await import('@/lib/supabase')).supabase.auth.getUser()).data.user?.id || '',
    }
    await createPatchPanelMutation.mutateAsync(panelData)
    refetch()
    document.getElementById('create-patch-panel-modal')?.classList.add('hidden')
    e.currentTarget.reset()
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Patch Panels" description="Manage fiber and copper patch panels" />
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
        <PageHeader title="Patch Panels" description="Manage fiber and copper patch panels" />
        <Card>
          <CardContent className="p-6 text-center text-red-600">
            Failed to load patch panels: {error.message}
            <button className="btn-outline mt-4" onClick={() => refetch()}>Retry</button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const panels = data?.data || []
  const totalCount = data?.count || 0
  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div>
      <PageHeader
        title="Patch Panels"
        description="Manage fiber and copper patch panels"
        action={
          canCreate && (
            <button onClick={() => document.getElementById('create-patch-panel-modal')?.classList.remove('hidden')} className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Patch Panel
            </button>
          )
        }
      />

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400" />
              <Input
                placeholder="Search patch panels..."
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
          </div>

          {panels.length === 0 ? (
            <div className="text-center py-12 text-surface-500">
              <Cable className="h-12 w-12 mx-auto mb-4 text-surface-300" />
              <p>No patch panels found. {canCreate ? 'Create your first patch panel to get started.' : ''}</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {panels.map((panel) => (
                  <Card key={panel.id} className="card-hover">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <Cable className="h-10 w-10 text-primary-600" />
                        <Badge variant={statusBadges[panel.status] || 'outline'}>{panel.status}</Badge>
                      </div>
                      <Link to={`/patch-panels/${panel.id}`} className="block">
                        <h3 className="text-lg font-semibold text-surface-900 hover:text-primary-600 transition-colors">
                          {panel.name}
                        </h3>
                        <p className="mt-1 text-sm text-surface-500 font-mono">{panel.panel_id}</p>
                      </Link>
                      <div className="mt-2 space-y-1 text-sm text-surface-500">
                        <p>Type: {panel.panel_type || '—'}</p>
                        <p>{panel.rack_name}</p>
                        <p>{panel.room_name} / {panel.site_name}</p>
                      </div>
                      <div className="mt-4 flex items-center gap-4 text-sm text-surface-500">
                        <span>Pos {panel.position_u || '—'}</span>
                        <span>{panel.height_u}U</span>
                        <span>{panel.port_count} Ports</span>
                        <span>{panel.ports_count || 0} Configured</span>
                        <span>{panel.cables_count || 0} Cables</span>
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

      {/* Create Patch Panel Modal */}
      <div id="create-patch-panel-modal" className="fixed inset-0 z-50 hidden overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => document.getElementById('create-patch-panel-modal')?.classList.add('hidden')} />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-surface-200">
              <h2 className="text-lg font-semibold">Create New Patch Panel</h2>
              <button onClick={() => document.getElementById('create-patch-panel-modal')?.classList.add('hidden')} className="text-surface-500 hover:text-surface-700">✕</button>
            </div>
            <form onSubmit={handleCreatePatchPanel} className="p-4 space-y-4">
              <div>
                <label className="label">Rack *</label>
                <select name="rackId" className="input" required defaultValue="">
                  <option value="">Select rack...</option>
                  {allRacks.map((r) => (
                    <option key={r.id} value={r.id}>{r.rack_id} — {r.name}{r.room_name ? ` (${r.room_name})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Panel ID *</label>
                <Input name="panelId" placeholder="FPP-L01-001" required />
              </div>
              <div>
                <label className="label">Name *</label>
                <Input name="name" placeholder="Fiber Patch Panel L01-001" required />
              </div>
              <div>
                <label className="label">Panel Type</label>
                <Input name="panelType" placeholder="Fiber Patch Panel" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Port Count</label>
                  <Input name="portCount" type="number" defaultValue={48} min={1} />
                </div>
                <div>
                  <label className="label">Height (U)</label>
                  <Input name="heightU" type="number" defaultValue={1} min={1} />
                </div>
              </div>
              <div>
                <label className="label">Position (U)</label>
                <Input name="positionU" type="number" min={1} placeholder="1" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea name="description" className="input min-h-[80px] resize-y" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-surface-200">
                <button type="button" className="btn-secondary" onClick={() => document.getElementById('create-patch-panel-modal')?.classList.add('hidden')}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={createPatchPanelMutation.isPending}>
                  {createPatchPanelMutation.isPending ? 'Creating...' : 'Create Patch Panel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}