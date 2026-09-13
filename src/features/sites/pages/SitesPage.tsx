import { useState } from 'react'
import { Server, Plus, Search, Loader2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { useSites, useCreateSite } from '@/hooks/useSites'
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

export function SitesPage() {
  const navigate = useNavigate()
  const { hasPermission, isAdmin } = useAuth()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('')
  const [page, setPage] = useState(1)
  const pageSize = 12

  const { data, isLoading, error, refetch } = useSites({ page, pageSize, search, status })
  const createSiteMutation = useCreateSite()

  const canCreate = hasPermission('infrastructure.create')

  const handleCreateSite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const siteData = {
      site_id: formData.get('siteId') as string,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      country: formData.get('country') as string,
      postal_code: formData.get('postalCode') as string,
      latitude: formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : null,
      longitude: formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : null,
      status: 'PLANNED' as const,
      created_by: (await (await import('@/lib/supabase')).supabase.auth.getUser()).data.user?.id || '',
    }
    await createSiteMutation.mutateAsync(siteData)
    refetch()
    document.getElementById('create-site-modal')?.classList.add('hidden')
    e.currentTarget.reset()
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Sites" description="Manage data center sites and facilities" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="p-6 space-y-4">
                <div className="h-10 w-10 bg-surface-200 rounded-lg" />
                <div className="h-6 w-3/4 bg-surface-200 rounded" />
                <div className="h-4 w-1/2 bg-surface-200 rounded" />
                <div className="h-4 w-full bg-surface-200 rounded" />
                <div className="h-4 w-2/3 bg-surface-200 rounded" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Sites" description="Manage data center sites and facilities" />
        <Card>
          <CardContent className="p-6 text-center text-red-600">
            Failed to load sites: {error.message}
            <Button variant="outline" className="mt-4" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const sites = data?.data || []
  const totalCount = data?.count || 0
  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div>
      <PageHeader
        title="Sites"
        description="Manage data center sites and facilities"
        action={
          canCreate && (
            <Button onClick={() => document.getElementById('create-site-modal')?.classList.remove('hidden')} className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Site
            </Button>
          )
        }
      />

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400" />
              <Input
                placeholder="Search sites..."
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

          {sites.length === 0 ? (
            <div className="text-center py-12 text-surface-500">
              <Server className="h-12 w-12 mx-auto mb-4 text-surface-300" />
              <p>No sites found. {canCreate ? 'Create your first site to get started.' : ''}</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sites.map((site) => (
                  <Card key={site.id} className="card-hover">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <Server className="h-10 w-10 text-primary-600" />
                        <Badge variant={statusBadges[site.status] || 'outline'}>{site.status}</Badge>
                      </div>
                      <Link to={`/sites/${site.id}`} className="block">
                        <h3 className="text-lg font-semibold text-surface-900 hover:text-primary-600 transition-colors">
                          {site.name}
                        </h3>
                        <p className="mt-1 text-sm text-surface-500 font-mono">{site.site_id}</p>
                      </Link>
                      {site.description && <p className="mt-1 text-sm text-surface-500 line-clamp-2">{site.description}</p>}
                      {site.address && <p className="mt-2 text-sm text-surface-500">{site.address}{site.city ? `, ${site.city}` : ''}{site.state ? `, ${site.state}` : ''}</p>}
                      <div className="mt-4 flex items-center gap-4 text-sm text-surface-500">
                        <span>{site.rooms_count || 0} Rooms</span>
                        <span>{site.racks_count || 0} Racks</span>
                        <span>{site.equipment_count || 0} Equipment</span>
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
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Site Modal */}
      <div id="create-site-modal" className="fixed inset-0 z-50 hidden overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => document.getElementById('create-site-modal')?.classList.add('hidden')} />
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-surface-200">
              <h2 className="text-lg font-semibold">Create New Site</h2>
              <button onClick={() => document.getElementById('create-site-modal')?.classList.add('hidden')} className="text-surface-500 hover:text-surface-700">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateSite} className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="label">Site ID *</label>
                  <Input name="siteId" placeholder="SITE-DC-01" required />
                </div>
                <div>
                  <label className="label">Name *</label>
                  <Input name="name" placeholder="Primary Data Center" required />
                </div>
                <div>
                  <label className="label">City</label>
                  <Input name="city" placeholder="San Francisco" />
                </div>
                <div>
                  <label className="label">State/Province</label>
                  <Input name="state" placeholder="CA" />
                </div>
                <div>
                  <label className="label">Country</label>
                  <Input name="country" placeholder="USA" />
                </div>
                <div>
                  <label className="label">Postal Code</label>
                  <Input name="postalCode" placeholder="94105" />
                </div>
                <div>
                  <label className="label">Latitude</label>
                  <Input name="latitude" type="number" step="any" placeholder="37.7749" />
                </div>
                <div>
                  <label className="label">Longitude</label>
                  <Input name="longitude" type="number" step="any" placeholder="-122.4194" />
                </div>
              </div>
              <div>
                <label className="label">Address</label>
                <textarea name="address" className="input min-h-[80px] resize-y" placeholder="123 Main St" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea name="description" className="input min-h-[80px] resize-y" placeholder="Primary data center facility..." />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-surface-200">
                <Button type="button" variant="secondary" onClick={() => document.getElementById('create-site-modal')?.classList.add('hidden')}>
                  Cancel
                </Button>
                <Button type="submit" loading={createSiteMutation.isPending}>
                  Create Site
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}