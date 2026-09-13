import { useState } from 'react'
import { Search, Filter, Loader2, Server, FolderGit2, HardDrive, Cpu, Cable, Link as LinkIcon, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { useGlobalSearch } from '@/hooks/useSearch'
import { useAuth } from '@/features/auth/AuthProvider'

const TypeIconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
  site: Server,
  room: FolderGit2,
  rack: HardDrive,
  equipment: Cpu,
  patch_panel: Cable,
  cable: Cable,
  port: LinkIcon,
}

function TypeIcon({ type, className }: { type: string; className?: string }) {
  const Component = TypeIconComponents[type] || Server
  return <Component className={className} />
}

const typeLabels: Record<string, string> = {
  site: 'Site',
  room: 'Room',
  rack: 'Rack',
  equipment: 'Equipment',
  patch_panel: 'Patch Panel',
  cable: 'Cable',
  port: 'Port',
}

export function SearchPage() {
  const { hasPermission } = useAuth()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  const { data: results, isLoading, error } = useGlobalSearch(debouncedQuery, debouncedQuery.length >= 2)

  // Debounce search query
  const handleSearchChange = (value: string) => {
    setQuery(value)
    const timer = setTimeout(() => setDebouncedQuery(value), 300)
    return () => clearTimeout(timer)
  }

  const canViewInfrastructure = hasPermission('infrastructure.read')

  return (
    <div>
      <PageHeader title="Global Search" description="Search across all infrastructure data" />
      
      <Card>
        <CardContent className="p-6">
          <div className="max-w-3xl mx-auto">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-surface-400" />
              <Input
                type="text"
                placeholder="Search sites, rooms, racks, equipment, cables, ports..."
                value={query}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="input pl-12 py-4 text-lg"
                autoFocus
              />
            </div>
            
            {debouncedQuery.length > 0 && debouncedQuery.length < 2 && (
              <p className="text-sm text-surface-500 text-center mb-4">Type at least 2 characters to search...</p>
            )}

            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                <span className="ml-3 text-surface-500">Searching...</span>
              </div>
            )}

            {error && (
              <div className="p-4 text-center text-red-600">
                Search failed: {error.message}
              </div>
            )}

            {!isLoading && !error && debouncedQuery.length >= 2 && results && results.length === 0 && (
              <div className="text-center py-8 text-surface-500">
                <p>No results found for "{debouncedQuery}"</p>
              </div>
            )}

            {!isLoading && !error && results && results.length > 0 && (
              <div className="space-y-2">
                {results.map((result) => (
                  <Link
                    key={result.id}
                    to={result.url}
                    className="card-hover flex items-center gap-4 p-4 group"
                  >
                    <div className="h-12 w-12 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <TypeIcon type={result.type} className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-surface-900 group-hover:text-primary-600 transition-colors">
                          {result.name}
                        </span>
                        <Badge variant="outline" className="text-xs">{typeLabels[result.type]}</Badge>
                      </div>
                      <p className="text-sm text-surface-500 truncate">{result.display_id}</p>
                      {result.parent && (
                        <p className="text-xs text-surface-400">
                          {result.parent.type} • {result.parent.display_id} • {result.parent.name}
                        </p>
                      )}
                    </div>
                    <LinkIcon className="h-5 w-5 text-surface-400 group-hover:text-primary-600" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-surface-900 mb-4">Searchable Fields</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm text-surface-500">
          <div className="p-4 rounded-lg bg-surface-50">
            <p className="font-medium text-surface-900 mb-2">Sites</p>
            <ul className="space-y-1">
              <li>Site ID</li>
              <li>Name</li>
              <li>Description</li>
            </ul>
          </div>
          <div className="p-4 rounded-lg bg-surface-50">
            <p className="font-medium text-surface-900 mb-2">Rooms</p>
            <ul className="space-y-1">
              <li>Room ID</li>
              <li>Name</li>
              <li>Description</li>
            </ul>
          </div>
          <div className="p-4 rounded-lg bg-surface-50">
            <p className="font-medium text-surface-900 mb-2">Racks</p>
            <ul className="space-y-1">
              <li>Rack ID</li>
              <li>Name</li>
              <li>Description</li>
            </ul>
          </div>
          <div className="p-4 rounded-lg bg-surface-50">
            <p className="font-medium text-surface-900 mb-2">Equipment</p>
            <ul className="space-y-1">
              <li>Equipment ID</li>
              <li>Name</li>
              <li>Serial Number</li>
              <li>Asset Tag</li>
              <li>Manufacturer/Model</li>
            </ul>
          </div>
          <div className="p-4 rounded-lg bg-surface-50">
            <p className="font-medium text-surface-900 mb-2">Patch Panels</p>
            <ul className="space-y-1">
              <li>Panel ID</li>
              <li>Name</li>
              <li>Description</li>
            </ul>
          </div>
          <div className="p-4 rounded-lg bg-surface-50">
            <p className="font-medium text-surface-900 mb-2">Cables</p>
            <ul className="space-y-1">
              <li>Cable ID</li>
              <li>Specification</li>
            </ul>
          </div>
          <div className="p-4 rounded-lg bg-surface-50">
            <p className="font-medium text-surface-900 mb-2">Ports</p>
            <ul className="space-y-1">
              <li>Port Number</li>
              <li>Port Name</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}