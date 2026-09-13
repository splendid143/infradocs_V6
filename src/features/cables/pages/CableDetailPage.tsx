import { useState } from 'react'
import { Cable, Edit, MapPin, Cpu, Copy, Download, Plus, Clock, RotateCcw, Link as LinkIcon, Eye, Share2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { useCable, useConnectedCable } from '@/hooks/useCables'
import { useEntityAuditHistory } from '@/hooks/useAudit'
import { useAttachmentsByRecord, useUploadAttachment, useDeleteAttachment } from '@/hooks/useAttachments'
import { getAttachmentUrl } from '@/services/attachmentService'
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

const endpointTypeLabels: Record<string, string> = {
  EQUIPMENT_PORT: 'Equipment Port',
  PATCH_PORT: 'Patch Panel Port',
}

export function CableDetailPage() {
  const { id } = useParams()
  const { hasPermission } = useAuth()
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'attachments' | 'notes' | 'trace'>('details')
  const [uploading, setUploading] = useState(false)
  const [newNote, setNewNote] = useState('')

  const { data: cable, isLoading, error, refetch } = useCable(id || '')
  const { data: attachments } = useAttachmentsByRecord('cable', id || '')
  const { data: history } = useEntityAuditHistory('cable', id || '')
  const uploadAttachmentMutation = useUploadAttachment()
  const deleteAttachmentMutation = useDeleteAttachment()

  const canEdit = hasPermission('infrastructure.update')
  const canUpload = hasPermission('files.upload')
  const canDelete = hasPermission('files.delete')

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Loading..." description="Loading cable details" />
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
              <span className="ml-3 text-surface-500">Loading cable...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !cable) {
    return (
      <div>
        <PageHeader title="Cable Not Found" description="The requested cable could not be found" />
        <Card>
          <CardContent className="p-6 text-center text-red-600">
            {error ? `Error: ${error.message}` : 'Cable not found'}
            <Link to="/cables" className="btn-primary mt-4 inline-block">
              Back to Cables
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const endpointA = cable.endpoint_a
  const endpointB = cable.endpoint_b

  const renderEndpoint = (endpoint: typeof endpointA, label: 'A' | 'B') => {
    if (!endpoint) return <div className="text-surface-500">No endpoint</div>
    
    const isEquipment = endpoint.endpoint_type === 'EQUIPMENT_PORT'
    const port = isEquipment ? endpoint.equipment_port : endpoint.patch_port
    const device = isEquipment
      ? (port as any)?.equipment
      : (port as any)?.patch_panel
    const rack = device?.rack
    const room = rack?.room
    const site = room?.site

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{label}</Badge>
          <span className="font-mono text-sm">{port?.port_number || 'Unknown'}</span>
        </div>
        <div className="ml-6 space-y-1 text-sm">
          {site && <Link to={`/sites/${site.id}`} className="text-primary-600 hover:underline block">{site.name} ({site.site_id})</Link>}
          {room && <Link to={`/rooms/${room.id}`} className="text-primary-600 hover:underline block">{room.name} ({room.room_id})</Link>}
          {rack && <Link to={`/racks/${rack.id}`} className="text-primary-600 hover:underline block">{rack.name} ({rack.rack_id})</Link>}
          {device && <Link to={`/${isEquipment ? 'equipment' : 'patch-panels'}/${device.id}`} className="text-primary-600 hover:underline font-medium block">{device.name} ({isEquipment ? device.equipment_id : device.panel_id})</Link>}
          {port && <span className="text-surface-500">{port.port_name ? `${port.port_name} ` : ''}{endpointTypeLabels[endpoint.endpoint_type]}</span>}
        </div>
      </div>
    )
  }

  const handleFileUpload = async (files: FileList, attachmentType: 'PHOTO' | 'DOCUMENT') => {
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        await uploadAttachmentMutation.mutateAsync({
          file,
          recordType: 'cable',
          recordId: id || '',
          options: { attachmentType, description: file.name },
        })
      }
      refetch()
    } catch (err) {
      alert('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('Delete this attachment?')) return
    try {
      await deleteAttachmentMutation.mutateAsync(attachmentId)
      refetch()
    } catch (err) {
      alert('Delete failed')
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    // Note creation would go here
    setNewNote('')
  }

  return (
    <div>
      <PageHeader
        title={cable.cable_id}
        description={`${cable.cable_type} • ${cable.specification || 'No spec'} • ${cable.length_m ? `${cable.length_m}m` : ''}${cable.length_ft ? ` (${cable.length_ft}ft)` : ''}`}
        action={
          <div className="flex gap-2">
            {canEdit && (
              <Link to={`/cables/${cable.id}/edit`} className="btn-outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            )}
            <Button variant="outline" onClick={() => navigator.clipboard.writeText(cable.cable_id)}>
              <Copy className="h-4 w-4 mr-2" />
              Copy ID
            </Button>
            <Button variant="outline" onClick={() => window.open(`/qr/${cable.cable_id}`, '_blank')}>
              <Share2 className="h-4 w-4 mr-2" />
              QR Code
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-surface-200 mb-6">
        {[
          { id: 'details', label: 'Details', icon: Cable },
          { id: 'trace', label: "What's Connected Here?", icon: LinkIcon },
          { id: 'history', label: 'History', icon: Clock },
          { id: 'attachments', label: 'Attachments', icon: Download },
          { id: 'notes', label: 'Notes', icon: Eye },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === tab.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-surface-500 hover:text-surface-700'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Cable Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Connection</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1 text-right pr-4 md:pr-8 border-r md:border-r-0 md:border-b pb-4 md:pb-0">
                  {renderEndpoint(endpointA, 'A')}
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 text-primary-600">
                    <Cable className="h-6 w-6" />
                    <span className="font-mono text-sm">{cable.specification || 'No specification'}</span>
                  </div>
                  <div className="text-xs text-surface-500">
                    {cable.length_m ? `${cable.length_m}m` : ''}{cable.length_ft ? ` (${cable.length_ft}ft)` : ''}
                    {cable.quantity > 1 && ` × ${cable.quantity}`}
                  </div>
                </div>
                <div className="flex-1 text-left pl-4 md:pl-8 border-l md:border-l-0 md:border-t pt-4 md:pt-0">
                  {renderEndpoint(endpointB, 'B')}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details Tab */}
          {activeTab === 'details' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label">Cable ID</label>
                      <p className="font-mono text-sm text-surface-900">{cable.cable_id}</p>
                    </div>
                    <div>
                      <label className="label">Type</label>
                      <Badge variant={cableTypeColors[cable.cable_type] || 'outline'}>{cable.cable_type}</Badge>
                    </div>
                    <div>
                      <label className="label">Specification</label>
                      <p className="text-surface-900">{cable.specification || '—'}</p>
                    </div>
                    <div>
                      <label className="label">Length</label>
                      <p className="text-surface-900">{cable.length_m ? `${cable.length_m}m` : '—'}{cable.length_ft ? ` (${cable.length_ft}ft)` : ''}</p>
                    </div>
                    <div>
                      <label className="label">Quantity</label>
                      <p className="text-surface-900">{cable.quantity}</p>
                    </div>
                    <div>
                      <label className="label">Status</label>
                      <Badge variant={statusColors[cable.status] || 'outline'}>{cable.status}</Badge>
                    </div>
                    {cable.notes && (
                      <div className="sm:col-span-2">
                        <label className="label">Notes</label>
                        <p className="text-surface-900">{cable.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* What's Connected Here - Quick Access */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>"What's Connected Here?"</CardTitle>
                  <div className="flex gap-2">
                    {endpointA?.equipment_port && (
                      <Link to={`/equipment/${endpointA.equipment_port.equipment.id}`} className="btn-outline btn-sm">
                        <Cpu className="h-4 w-4 mr-2" />
                        View Endpoint A
                      </Link>
                    )}
                    {endpointB?.equipment_port && (
                      <Link to={`/equipment/${endpointB.equipment_port.equipment.id}`} className="btn-outline btn-sm">
                        <Cpu className="h-4 w-4 mr-2" />
                        View Endpoint B
                      </Link>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-surface-500">Click on an endpoint below to see all connections at that port</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {endpointA && (
                      <Link 
                        to={endpointA.equipment_port 
                          ? `/equipment/${endpointA.equipment_port.equipment.id}` 
                          : endpointA.patch_port 
                            ? `/patch-panels/${endpointA.patch_port.patch_panel.id}` 
                            : '#'}
                        className="btn-outline w-full justify-start gap-2 p-3"
                      >
                        <Cpu className="h-4 w-4" />
                        <div className="text-left">
                          <p className="font-medium text-sm">Endpoint A</p>
                          <p className="text-xs text-surface-500">
                            {endpointA.equipment_port?.equipment?.name || endpointA.patch_port?.patch_panel?.name}
                            - Port {endpointA.equipment_port?.port_number || endpointA.patch_port?.port_number}
                          </p>
                        </div>
                      </Link>
                    )}
                    {endpointB && (
                      <Link 
                        to={endpointB.equipment_port 
                          ? `/equipment/${endpointB.equipment_port.equipment.id}` 
                          : endpointB.patch_port 
                            ? `/patch-panels/${endpointB.patch_port.patch_panel.id}` 
                            : '#'}
                        className="btn-outline w-full justify-start gap-2 p-3"
                      >
                        <Cpu className="h-4 w-4" />
                        <div className="text-left">
                          <p className="font-medium text-sm">Endpoint B</p>
                          <p className="text-xs text-surface-500">
                            {endpointB.equipment_port?.equipment?.name || endpointB.patch_port?.patch_panel?.name}
                            - Port {endpointB.equipment_port?.port_number || endpointB.patch_port?.port_number}
                          </p>
                        </div>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Trace Tab - What's Connected Here */}
          {activeTab === 'trace' && (
            <>
              {endpointA?.equipment_port && (
                <Card>
                  <CardHeader>
                    <CardTitle>Endpoint A Connections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ConnectedCableTrace 
                      portType="EQUIPMENT_PORT" 
                      portId={endpointA.equipment_port.id} 
                      excludeCableId={cable.id}
                    />
                  </CardContent>
                </Card>
              )}
              {endpointA?.patch_port && (
                <Card>
                  <CardHeader>
                    <CardTitle>Endpoint A Connections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ConnectedCableTrace 
                      portType="PATCH_PORT" 
                      portId={endpointA.patch_port.id} 
                      excludeCableId={cable.id}
                    />
                  </CardContent>
                </Card>
              )}
              {endpointB?.equipment_port && (
                <Card>
                  <CardHeader>
                    <CardTitle>Endpoint B Connections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ConnectedCableTrace 
                      portType="EQUIPMENT_PORT" 
                      portId={endpointB.equipment_port.id} 
                      excludeCableId={cable.id}
                    />
                  </CardContent>
                </Card>
              )}
              {endpointB?.patch_port && (
                <Card>
                  <CardHeader>
                    <CardTitle>Endpoint B Connections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ConnectedCableTrace 
                      portType="PATCH_PORT" 
                      portId={endpointB.patch_port.id} 
                      excludeCableId={cable.id}
                    />
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <Card>
              <CardHeader>
                <CardTitle>Status History & Audit Log</CardTitle>
              </CardHeader>
              <CardContent>
                {history && history.length > 0 ? (
                  <div className="space-y-4">
                    {history.map(log => (
                      <div key={log.id} className="p-4 rounded-lg border border-surface-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-surface-900">{log.action.replace('_', ' ')}</span>
                          <span className="text-sm text-surface-500">{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-surface-500">
                          <span>By: {log.actor_name}</span>
                          <span>({log.actor_email})</span>
                        </div>
                        {log.details && <p className="mt-1 text-sm text-surface-600">{log.details}</p>}
                        {(log.old_values || log.new_values) && (
                          <details className="mt-2">
                            <summary className="text-xs text-surface-500 cursor-pointer">Show changes</summary>
                            <pre className="mt-2 text-xs bg-surface-100 p-2 rounded overflow-auto">
                              {JSON.stringify({ old: log.old_values, new: log.new_values }, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-surface-500">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-surface-300" />
                    <p>No history available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Attachments Tab */}
          {activeTab === 'attachments' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Photos & Documents</CardTitle>
                {canUpload && (
                  <div className="flex gap-2">
                    <label className="btn-outline btn-sm cursor-pointer">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Photo
                      <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files && handleFileUpload(e.target.files, 'PHOTO')} />
                    </label>
                    <label className="btn-outline btn-sm cursor-pointer">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Document
                      <input type="file" accept=".pdf,.xlsx,.docx,.txt" className="hidden" onChange={e => e.target.files && handleFileUpload(e.target.files, 'DOCUMENT')} />
                    </label>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {attachments && attachments.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {attachments.map(att => (
                      <div key={att.id} className="p-4 rounded-lg border border-surface-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-surface-900 truncate">{att.file_name}</p>
                            <p className="text-xs text-surface-500">
                              {(att.size_bytes / 1024).toFixed(1)} KB • {att.attachment_type} • {att.document_type || '—'}
                            </p>
                            <p className="text-xs text-surface-400">
                              Uploaded by {att.uploader_name} • {new Date(att.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={async () => {
                              const url = await getAttachmentUrl(att.attachment_type, att.storage_path)
                              if (url) window.open(url, '_blank')
                            }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canDelete && (
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteAttachment(att.id)} className="text-red-600 hover:text-red-700">
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-surface-500">
                    <Download className="h-12 w-12 mx-auto mb-4 text-surface-300" />
                    <p>No attachments yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Notes</CardTitle>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Add a note..." 
                    value={newNote} 
                    onChange={e => setNewNote(e.target.value)} 
                    className="w-64"
                    onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                  />
                  <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-surface-500">
                  <p>Notes feature coming soon</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-surface-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigator.clipboard.writeText(cable.cable_id)}>
                  <Copy className="h-4 w-4" />
                  Copy Cable ID
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <MapPin className="h-4 w-4" />
                  View on Map
                </Button>
                {canEdit && (
                  <Link to={`/cables/${cable.id}/edit`} className="btn-primary w-full justify-center gap-2">
                    <Edit className="h-4 w-4" />
                    Edit Cable
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-surface-900 mb-4">Endpoints</h3>
              <div className="space-y-3">
                {endpointA && (
                  <Link 
                    to={endpointA.equipment_port 
                      ? `/equipment/${endpointA.equipment_port.equipment.id}` 
                      : endpointA.patch_port 
                        ? `/patch-panels/${endpointA.patch_port.patch_panel.id}` 
                        : '#'}
                    className="btn-ghost w-full justify-start gap-2"
                  >
                    <Cpu className="h-4 w-4" />
                    <span>Endpoint A: {endpointA.equipment_port?.equipment?.name || endpointA.patch_port?.patch_panel?.name} - Port {endpointA.equipment_port?.port_number || endpointA.patch_port?.port_number}</span>
                  </Link>
                )}
                {endpointB && (
                  <Link 
                    to={endpointB.equipment_port 
                      ? `/equipment/${endpointB.equipment_port.equipment.id}` 
                      : endpointB.patch_port 
                        ? `/patch-panels/${endpointB.patch_port.patch_panel.id}` 
                        : '#'}
                    className="btn-ghost w-full justify-start gap-2"
                  >
                    <Cpu className="h-4 w-4" />
                    <span>Endpoint B: {endpointB.equipment_port?.equipment?.name || endpointB.patch_port?.patch_panel?.name} - Port {endpointB.equipment_port?.port_number || endpointB.patch_port?.port_number}</span>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Connected Cable Trace Component
function ConnectedCableTrace({ portType, portId, excludeCableId }: { portType: 'EQUIPMENT_PORT' | 'PATCH_PORT'; portId: string; excludeCableId?: string }) {
  const { data: connectedCable, isLoading } = useConnectedCable(portType, portId)

  if (isLoading) {
    return <div className="text-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto" /></div>
  }

  if (!connectedCable || connectedCable.id === excludeCableId) {
    return <div className="text-center py-4 text-surface-500">No other cables connected to this port</div>
  }

  const otherEndpoint = connectedCable.endpoint_a?.id === portId ? connectedCable.endpoint_b : connectedCable.endpoint_a
  const isEquipment = otherEndpoint?.endpoint_type === 'EQUIPMENT_PORT'
  const otherPort = isEquipment ? otherEndpoint?.equipment_port : otherEndpoint?.patch_port
  const otherDevice = (otherPort as any)?.equipment || (otherPort as any)?.patch_panel

  return (
    <Link to={`/cables/${connectedCable.id}`} className="btn-ghost w-full justify-start gap-3 p-3">
      <Cable className="h-5 w-5 text-primary-600" />
      <div className="flex-1 text-left">
        <p className="font-medium text-sm">{connectedCable.cable_id}</p>
        <p className="text-xs text-surface-500">
          {connectedCable.cable_type} • {connectedCable.specification || 'No spec'}
        </p>
        <p className="text-xs text-surface-400">
          → {otherDevice?.name || 'Unknown'} - Port {otherPort?.port_number || '?'}
        </p>
      </div>
      <RotateCcw className="h-4 w-4 text-surface-400" />
    </Link>
  )
}