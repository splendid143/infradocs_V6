import { useState } from 'react'
import { HardDrive, Plus, Search, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { useRacks, useCreateRack } from '@/hooks/useRacks'
import { useRooms } from '@/hooks/useRooms'
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

export function RacksPage() {
  const { hasPermission } = useAuth()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('')
  const [page, setPage] = useState(1)
  const [siteId, setSiteId] = useState<string>('')
  const [roomId, setRoomId] = useState<string>('')
  const pageSize = 12

  const { data, isLoading, error, refetch } = useRacks({ page, pageSize, search, status, siteId, roomId })
  const createRackMutation = useCreateRack()
  const { data: roomsData } = useRooms({ pageSize: 200 })
  const allRooms = roomsData?.data || []

  const canCreate = hasPermission('infrastructure.create')

  const handleCreateRack = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const rackData = {
      room_id: formData.get('roomId') as string,
      rack_id: formData.get('rackId') as string,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      rack_type: formData.get('rackType') as string,
      height_u: parseInt(formData.get('heightU') as string) || 42,
      position: formData.get('position') ? parseInt(formData.get('position') as string) : null,
      status: 'PLANNED' as const,
      created_by: (await (await import('@/lib/supabase')).supabase.auth.getUser()).data.user?.id || '',
    }
    await createRackMutation.mutateAsync(rackData)
    refetch()
    document.getElementById('create-rack-modal')?.classList.add('hidden')
    e.currentTarget.reset()
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Racks" description="Manage racks within rooms" />
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
        <PageHeader title="Racks" description="Manage racks within rooms" />
        <Card>
          <CardContent className="p-6 text-center text-red-600">
            Failed to load racks: {error.message}
            <button className="btn-outline mt-4" onClick={() => refetch()}>Retry</button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const racks = data?.data || []
  const totalCount = data?.count || 0
  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div>
      <PageHeader
        title="Racks"
        description="Manage racks within rooms"
        action={
          canCreate && (
            <button onClick={() => document.getElementById('create-rack-modal')?.classList.remove('hidden')} className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Rack
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
                placeholder="Search racks..."
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

          {racks.length === 0 ? (
            <div className="text-center py-12 text-surface-500">
              <HardDrive className="h-12 w-12 mx-auto mb-4 text-surface-300" />
              <p>No racks found. {canCreate ? 'Create your first rack to get started.' : ''}</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {racks.map((rack) => (
                  <Card key={rack.id} className="card-hover">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <HardDrive className="h-10 w-10 text-primary-600" />
                        <Badge variant={statusBadges[rack.status] || 'outline'}>{rack.status}</Badge>
                      </div>
                      <Link to={`/racks/${rack.id}`} className="block">
                        <h3 className="text-lg font-semibold text-surface-900 hover:text-primary-600 transition-colors">
                          {rack.name}
                        </h3>
                        <p className="mt-1 text-sm text-surface-500 font-mono">{rack.rack_id}</p>
                      </Link>
                      <div className="mt-2 space-y-1 text-sm text-surface-500">
                        <p>{rack.room_name}</p>
                        <p>{rack.site_name}</p>
                      </div>
                      <div className="mt-4 flex items-center gap-4 text-sm text-surface-500">
                        <span>Pos {rack.position || '—'}</span>
                        <span>{rack.height_u}U</span>
                        <span>{rack.equipment_count || 0} Equip</span>
                        <span>{rack.patch_panels_count || 0} Panels</span>
                        <span>{rack.cables_count || 0} Cables</span>
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

      {/* Create Rack Modal */}
      <div id="create-rack-modal" className="fixed inset-0 z-50 hidden overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => document.getElementById('create-rack-modal')?.classList.add('hidden')} />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-surface-200">
              <h2 className="text-lg font-semibold">Create New Rack</h2>
              <button onClick={() => document.getElementById('create-rack-modal')?.classList.add('hidden')} className="text-surface-500 hover:text-surface-700">✕</button>
            </div>
            <form onSubmit={handleCreateRack} className="p-4 space-y-4">
              <div>
                <label className="label">Room *</label>
                <select name="roomId" className="input" required defaultValue="">
                  <option value="">Select room...</option>
                  {allRooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.room_id} — {r.name}{r.site_name ? ` (${r.site_name})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Rack ID *</label>
                <Input name="rackId" placeholder="RACK-S01" required />
              </div>
              <div>
                <label className="label">Name *</label>
                <Input name="name" placeholder="Spine Switch Row" required />
              </div>
              <div>
                <label className="label">Rack Type</label>
                <Input name="rackType" placeholder="Server Rack" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Height (U)</label>
                  <Input name="heightU" type="number" defaultValue={42} min={1} max={58} />
                </div>
                <div>
                  <label className="label">Position</label>
                  <Input name="position" type="number" min={1} placeholder="1" />
                </div>
              </div>
              <div>
                <label className="label">Description</label>
                <textarea name="description" className="input min-h-[80px] resize-y" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-surface-200">
                <button type="button" className="btn-secondary" onClick={() => document.getElementById('create-rack-modal')?.classList.add('hidden')}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={createRackMutation.isPending}>
                  {createRackMutation.isPending ? 'Creating...' : 'Create Rack'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}