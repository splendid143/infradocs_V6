import { useState } from 'react'
import { Cpu, Plus, Search, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { useEquipment, useCreateEquipment } from '@/hooks/useEquipment'
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

export function EquipmentPage() {
  const { hasPermission } = useAuth()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('')
  const [page, setPage] = useState(1)
  const [siteId, setSiteId] = useState<string>('')
  const [roomId, setRoomId] = useState<string>('')
  const [rackId, setRackId] = useState<string>('')
  const pageSize = 12

  const { data, isLoading, error, refetch } = useEquipment({ page, pageSize, search, status, siteId, roomId, rackId })
  const createEquipmentMutation = useCreateEquipment()
  const { data: racksData } = useRacks({ pageSize: 200 })
  const allRacks = racksData?.data || []

  const canCreate = hasPermission('infrastructure.create')

  const handleCreateEquipment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const equipmentData = {
      rack_id: formData.get('rackId') as string,
      equipment_id: formData.get('equipmentId') as string,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      equipment_type: formData.get('equipmentType') as string,
      manufacturer: formData.get('manufacturer') as string,
      model: formData.get('model') as string,
      serial_number: formData.get('serialNumber') as string,
      asset_tag: formData.get('assetTag') as string,
      position_u: formData.get('positionU') ? parseInt(formData.get('positionU') as string) : null,
      height_u: parseInt(formData.get('heightU') as string) || 1,
      status: 'PLANNED' as const,
      created_by: (await (await import('@/lib/supabase')).supabase.auth.getUser()).data.user?.id || '',
    }
    await createEquipmentMutation.mutateAsync(equipmentData)
    refetch()
    document.getElementById('create-equipment-modal')?.classList.add('hidden')
    e.currentTarget.reset()
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Equipment" description="Manage network and infrastructure equipment" />
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
        <PageHeader title="Equipment" description="Manage network and infrastructure equipment" />
        <Card>
          <CardContent className="p-6 text-center text-red-600">
            Failed to load equipment: {error.message}
            <button className="btn-outline mt-4" onClick={() => refetch()}>Retry</button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const equipment = data?.data || []
  const totalCount = data?.count || 0
  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div>
      <PageHeader
        title="Equipment"
        description="Manage network and infrastructure equipment"
        action={
          canCreate && (
            <button onClick={() => document.getElementById('create-equipment-modal')?.classList.remove('hidden')} className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Equipment
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
                placeholder="Search equipment..."
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

          {equipment.length === 0 ? (
            <div className="text-center py-12 text-surface-500">
              <Cpu className="h-12 w-12 mx-auto mb-4 text-surface-300" />
              <p>No equipment found. {canCreate ? 'Create your first equipment to get started.' : ''}</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {equipment.map((eq) => (
                  <Card key={eq.id} className="card-hover">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <Cpu className="h-10 w-10 text-primary-600" />
                        <Badge variant={statusBadges[eq.status] || 'outline'}>{eq.status}</Badge>
                      </div>
                      <Link to={`/equipment/${eq.id}`} className="block">
                        <h3 className="text-lg font-semibold text-surface-900 hover:text-primary-600 transition-colors">
                          {eq.name}
                        </h3>
                        <p className="mt-1 text-sm text-surface-500 font-mono">{eq.equipment_id}</p>
                      </Link>
                      <div className="mt-2 space-y-1 text-sm text-surface-500">
                        {eq.manufacturer && <p>{eq.manufacturer} {eq.model || ''}</p>}
                        <p>{eq.rack_name}</p>
                        <p>{eq.room_name} / {eq.site_name}</p>
                      </div>
                      <div className="mt-4 flex items-center gap-4 text-sm text-surface-500">
                        <span>Pos {eq.position_u || '—'}</span>
                        <span>{eq.height_u}U</span>
                        <span>{eq.ports_count || 0} Ports</span>
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

      {/* Create Equipment Modal */}
      <div id="create-equipment-modal" className="fixed inset-0 z-50 hidden overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => document.getElementById('create-equipment-modal')?.classList.add('hidden')} />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-surface-200">
              <h2 className="text-lg font-semibold">Create New Equipment</h2>
              <button onClick={() => document.getElementById('create-equipment-modal')?.classList.add('hidden')} className="text-surface-500 hover:text-surface-700">✕</button>
            </div>
            <form onSubmit={handleCreateEquipment} className="p-4 space-y-4">
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
                <label className="label">Equipment ID *</label>
                <Input name="equipmentId" placeholder="SPINE-SW-01" required />
              </div>
              <div>
                <label className="label">Name *</label>
                <Input name="name" placeholder="Spine Switch 01" required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Manufacturer</label>
                  <Input name="manufacturer" placeholder="Cisco" />
                </div>
                <div>
                  <label className="label">Model</label>
                  <Input name="model" placeholder="N9K-C9508" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Serial Number</label>
                  <Input name="serialNumber" placeholder="FOC12345678" />
                </div>
                <div>
                  <label className="label">Asset Tag</label>
                  <Input name="assetTag" placeholder="AST-00123" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Equipment Type</label>
                  <Input name="equipmentType" placeholder="Switch" />
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
                <button type="button" className="btn-secondary" onClick={() => document.getElementById('create-equipment-modal')?.classList.add('hidden')}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={createEquipmentMutation.isPending}>
                  {createEquipmentMutation.isPending ? 'Creating...' : 'Create Equipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}