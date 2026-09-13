import { Link } from 'react-router-dom'
import {
  Server,
  FolderGit2,
  HardDrive,
  Cpu,
  Cable,
  AlertTriangle,
  TrendingUp,
  Loader2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { useSites } from '@/hooks/useSites'
import { useRooms } from '@/hooks/useRooms'
import { useRacks } from '@/hooks/useRacks'
import { useEquipment } from '@/hooks/useEquipment'
import { useCables } from '@/hooks/useCables'
import { useAuditLogs } from '@/hooks/useAudit'

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const sec = Math.max(0, Math.floor((now - then) / 1000))
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} min ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day} day${day === 1 ? '' : 's'} ago`
  return new Date(iso).toLocaleDateString()
}

function formatAction(action: string): string {
  return action
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function DashboardPage() {
  const sites = useSites({ page: 1, pageSize: 1 })
  const rooms = useRooms({ page: 1, pageSize: 1 })
  const racks = useRacks({ page: 1, pageSize: 1 })
  const equipment = useEquipment({ page: 1, pageSize: 1 })
  const cables = useCables({ page: 1, pageSize: 1 })
  const issues = useCables({ page: 1, pageSize: 1, status: 'ISSUE' })
  const activity = useAuditLogs({ page: 1, pageSize: 10 })

  const loading =
    sites.isLoading ||
    rooms.isLoading ||
    racks.isLoading ||
    equipment.isLoading ||
    cables.isLoading ||
    issues.isLoading

  const stats = [
    {
      name: 'Sites',
      value: sites.data?.count ?? 0,
      icon: Server,
      color: 'text-blue-600 bg-blue-100',
      href: '/sites',
    },
    {
      name: 'Rooms',
      value: rooms.data?.count ?? 0,
      icon: FolderGit2,
      color: 'text-green-600 bg-green-100',
      href: '/rooms',
    },
    {
      name: 'Racks',
      value: racks.data?.count ?? 0,
      icon: HardDrive,
      color: 'text-purple-600 bg-purple-100',
      href: '/racks',
    },
    {
      name: 'Equipment',
      value: equipment.data?.count ?? 0,
      icon: Cpu,
      color: 'text-orange-600 bg-orange-100',
      href: '/equipment',
    },
    {
      name: 'Cables',
      value: cables.data?.count ?? 0,
      icon: Cable,
      color: 'text-cyan-600 bg-cyan-100',
      href: '/cables',
    },
    {
      name: 'Issues',
      value: issues.data?.count ?? 0,
      icon: AlertTriangle,
      color: 'text-red-600 bg-red-100',
      href: '/cables',
    },
  ]

  const recent = activity.data?.data ?? []

  return (
    <div>
      <PageHeader title="Dashboard" description="Infrastructure overview" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
        {stats.map((stat) => (
          <Link key={stat.name} to={stat.href} className="block">
            <Card className="card-hover h-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-surface-500">{stat.name}</p>
                    <p className="mt-1 text-3xl font-bold text-surface-900">
                      {loading ? (
                        <Loader2 className="h-7 w-7 animate-spin text-surface-400" />
                      ) : (
                        stat.value
                      )}
                    </p>
                  </div>
                  <div
                    className={`h-12 w-12 rounded-xl flex items-center justify-center ${stat.color}`}
                  >
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-surface-900 mb-4">Recent Activity</h3>

          {activity.isLoading && (
            <div className="flex items-center justify-center py-12 text-surface-500">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading activity…
            </div>
          )}

          {!activity.isLoading && recent.length === 0 && (
            <div className="text-center py-12 text-surface-500">
              <TrendingUp className="h-10 w-10 mx-auto mb-3 text-surface-300" />
              <p className="font-medium text-surface-700">No activity yet</p>
              <p className="text-sm mt-1">
                Create sites, racks, equipment, or cables to see updates here.
              </p>
            </div>
          )}

          {!activity.isLoading && recent.length > 0 && (
            <div className="space-y-4">
              {recent.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-4 p-4 rounded-lg hover:bg-surface-50"
                >
                  <div className="h-10 w-10 rounded-lg bg-surface-100 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-5 w-5 text-surface-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-surface-900">{formatAction(entry.action)}</p>
                    <p className="text-sm text-surface-600 truncate">
                      {entry.entity_display || entry.details || `${entry.entity_type} ${entry.entity_id}`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm text-surface-500">{formatRelativeTime(entry.created_at)}</p>
                    <p className="text-xs text-surface-400">
                      by {entry.actor_name || entry.actor_email || 'System'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
