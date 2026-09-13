import { useState } from 'react'
import { FileText, Download, BarChart2, Loader2, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { useSites } from '@/hooks/useSites'
import { useRooms } from '@/hooks/useRooms'
import { useRacks } from '@/hooks/useRacks'
import { useEquipment } from '@/hooks/useEquipment'
import { usePatchPanels } from '@/hooks/usePatchPanels'
import { useCables } from '@/hooks/useCables'
import { useAuth } from '@/features/auth/AuthProvider'

const reports = [
  { 
    id: 'infrastructure-inventory',
    name: 'Infrastructure Inventory', 
    description: 'Complete inventory of all sites, rooms, racks, equipment',
    icon: FileText,
  },
  { 
    id: 'cable-inventory',
    name: 'Cable Inventory', 
    description: 'All cables with endpoints and specifications',
    icon: FileText,
  },
  { 
    id: 'fiber-cable-report',
    name: 'Fiber Cable Report', 
    description: 'Fiber cables only with fiber specifications',
    icon: FileText,
  },
  { 
    id: 'copper-cable-report',
    name: 'Copper Cable Report', 
    description: 'Copper cables only with copper specifications',
    icon: FileText,
  },
  { 
    id: 'rack-report',
    name: 'Rack Report', 
    description: 'Rack elevations with equipment and patch panels',
    icon: FileText,
  },
  { 
    id: 'equipment-report',
    name: 'Equipment Report', 
    description: 'Equipment details with ports and connections',
    icon: FileText,
  },
  { 
    id: 'patch-panel-report',
    name: 'Patch Panel Report', 
    description: 'Patch panel port assignments and connections',
    icon: FileText,
  },
  { 
    id: 'issue-report',
    name: 'Issue Report', 
    description: 'All infrastructure with ISSUE status',
    icon: FileText,
  },
  { 
    id: 'status-report',
    name: 'Status Report', 
    description: 'Infrastructure grouped by status',
    icon: FileText,
  },
  { 
    id: 'documentation-completeness',
    name: 'Documentation Completeness', 
    description: 'Records missing photos, documents, or notes',
    icon: FileText,
  },
]

export function ReportsPage() {
  const { hasPermission } = useAuth()
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [siteFilter, setSiteFilter] = useState<string>('')
  const [generating, setGenerating] = useState<string | null>(null)

  const canViewReports = hasPermission('reports.view')

  const { data: sitesData } = useSites({ pageSize: 100 })
  const sites = sitesData?.data || []

  const handleGenerate = async (reportId: string) => {
    setGenerating(reportId)
    // Simulate report generation
    await new Promise(r => setTimeout(r, 2000))
    setGenerating(null)
    
    // In production, this would call a backend API or generate a CSV/PDF
    const report = reports.find(r => r.id === reportId)
    alert(`${report?.name} generated successfully! (In production, this would download a CSV/PDF file)`)
  }

  const getReportStats = (_reportId: string) => {
    // Stats are resolved at generate-time via services; avoid calling hooks outside render.
    return 'Ready to generate'
  }

  return (
    <div>
      <PageHeader title="Reports" description="Generate infrastructure documentation reports" />

      {/* Report List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.id} className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <report.icon className="h-5 w-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-surface-900">{report.name}</h3>
                  <p className="mt-1 text-sm text-surface-500">{report.description}</p>
                </div>
              </div>
              <div className="space-y-3">
                <Button
                  variant={selectedReport === report.id ? 'primary' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setSelectedReport(selectedReport === report.id ? null : report.id)}
                >
                  {selectedReport === report.id ? (
                    <>
                      <BarChart2 className="h-4 w-4 mr-2" />
                      Configure & Generate
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      View Options
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report Configuration Panel */}
      {selectedReport && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{reports.find(r => r.id === selectedReport)?.name}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedReport(null)}>
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="label">Date From</label>
                <Input type="date" value={dateRange.from} onChange={e => setDateRange({...dateRange, from: e.target.value})} />
              </div>
              <div>
                <label className="label">Date To</label>
                <Input type="date" value={dateRange.to} onChange={e => setDateRange({...dateRange, to: e.target.value})} />
              </div>
              <div>
                <label className="label">Site Filter</label>
                <select value={siteFilter} onChange={e => setSiteFilter(e.target.value)} className="input">
                  <option value="">All Sites</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name} ({s.site_id})</option>)}
                </select>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-surface-50 border border-surface-200">
              <h4 className="font-medium text-surface-900 mb-2">Report Preview</h4>
              <p className="text-sm text-surface-600">
                This report will include data filtered by the selected criteria.
                {dateRange.from && <span className="ml-2">From: {dateRange.from}</span>}
                {dateRange.to && <span className="ml-2">To: {dateRange.to}</span>}
                {siteFilter && <span className="ml-2">Site: {sites.find(s => s.id === siteFilter)?.name}</span>}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-surface-200">
              <Button variant="secondary" onClick={() => setSelectedReport(null)}>
                Cancel
              </Button>
              <Button 
                onClick={() => handleGenerate(selectedReport)} 
                loading={generating === selectedReport}
                disabled={!canViewReports}
              >
                <Download className="h-4 w-4 mr-2" />
                {generating === selectedReport ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Architecture Note */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Export Architecture</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-surface-600">
            Reports are designed with a backend-ready architecture. The frontend collects parameters and calls 
            an export API endpoint that can be implemented with FastAPI or similar for Excel/PDF generation.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="p-4 rounded-lg bg-surface-50">
              <h4 className="font-medium text-surface-900 mb-2">CSV Export</h4>
              <p className="text-sm text-surface-500">Tabular data export for spreadsheets</p>
            </div>
            <div className="p-4 rounded-lg bg-surface-50">
              <h4 className="font-medium text-surface-900 mb-2">PDF Export</h4>
              <p className="text-sm text-surface-500">Formatted documents for printing/sharing</p>
            </div>
            <div className="p-4 rounded-lg bg-surface-50">
              <h4 className="font-medium text-surface-900 mb-2">API Endpoint</h4>
              <p className="text-sm text-surface-500">GET /api/reports/{'{reportId}'}?format=csv|pdf</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}