import { useMemo, useState } from 'react'
import { AlertTriangle, Loader2, Upload } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'
import { useSites } from '@/hooks/useSites'
import { useRooms } from '@/hooks/useRooms'
import { useRacks } from '@/hooks/useRacks'
import { useEquipment } from '@/hooks/useEquipment'
import { usePatchPanels } from '@/hooks/usePatchPanels'
import { useCables } from '@/hooks/useCables'
import { db, supabase } from '@/lib/supabase'
import { uploadAttachment } from '@/services/attachmentService'

type EntityType = 'sites' | 'rooms' | 'racks' | 'equipment' | 'patch_panels' | 'cables'

const ENTITY_OPTIONS: { value: EntityType; label: string }[] = [
  { value: 'sites', label: 'Site' },
  { value: 'rooms', label: 'Room' },
  { value: 'racks', label: 'Rack' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'patch_panels', label: 'Patch panel' },
  { value: 'cables', label: 'Cable' },
]

export function IssuesPage() {
  const [entityType, setEntityType] = useState<EntityType>('equipment')
  const [entityId, setEntityId] = useState('')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<FileList | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sites = useSites({ pageSize: 200 })
  const rooms = useRooms({ pageSize: 200 })
  const racks = useRacks({ pageSize: 200 })
  const equipment = useEquipment({ pageSize: 200 })
  const panels = usePatchPanels({ pageSize: 200 })
  const cables = useCables({ pageSize: 200 })
  const issueCables = useCables({ pageSize: 50, status: 'ISSUE' })

  const options = useMemo(() => {
    const map: Record<EntityType, { id: string; label: string }[]> = {
      sites: (sites.data?.data || []).map((s) => ({ id: s.id, label: `${s.site_id} — ${s.name}` })),
      rooms: (rooms.data?.data || []).map((r) => ({ id: r.id, label: `${r.room_id} — ${r.name}` })),
      racks: (racks.data?.data || []).map((r) => ({ id: r.id, label: `${r.rack_id} — ${r.name}` })),
      equipment: (equipment.data?.data || []).map((e) => ({ id: e.id, label: `${e.equipment_id} — ${e.name}` })),
      patch_panels: (panels.data?.data || []).map((p) => ({ id: p.id, label: `${p.panel_id} — ${p.name}` })),
      cables: (cables.data?.data || []).map((c) => ({ id: c.id, label: `${c.cable_id} — ${c.cable_type}` })),
    }
    return map[entityType] || []
  }, [entityType, sites.data, rooms.data, racks.data, equipment.data, panels.data, cables.data])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (!entityId) {
      setError('Select an item to report against')
      return
    }
    if (!description.trim()) {
      setError('Describe the problem')
      return
    }
    setSubmitting(true)
    try {
      const { data: auth } = await supabase.auth.getUser()
      const userId = auth.user?.id || null

      // Mark record as ISSUE when the table has status
      const { error: updErr } = await db
        .from(entityType)
        .update({ status: 'ISSUE', updated_by: userId, updated_at: new Date().toISOString() })
        .eq('id', entityId)
      if (updErr) throw new Error(updErr.message)

      // Note
      await db.from('notes').insert({
        record_type: entityType,
        record_id: entityId,
        content: description.trim(),
        created_by: userId,
      })

      // Photos
      if (files && files.length > 0) {
        for (const file of Array.from(files)) {
          await uploadAttachment(file, entityType.replace(/s$/, ''), entityId, {
            attachmentType: 'PHOTO',
            description: description.slice(0, 120),
            documentType: 'INSPECTION',
          })
        }
      }

      setMessage('Issue reported. Status set to ISSUE.')
      setDescription('')
      setEntityId('')
      setFiles(null)
      issueCables.refetch()
    } catch (err: any) {
      setError(err?.message || 'Failed to report issue')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Issues"
        description="Report problems against infrastructure records"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" /> Report an issue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Record type</Label>
                <select
                  className="input"
                  value={entityType}
                  onChange={(e) => {
                    setEntityType(e.target.value as EntityType)
                    setEntityId('')
                  }}
                >
                  {ENTITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Select item</Label>
                <select
                  className="input"
                  value={entityId}
                  onChange={(e) => setEntityId(e.target.value)}
                  required
                >
                  <option value="">Select…</option>
                  {options.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
                {options.length === 0 && (
                  <p className="text-xs text-surface-500 mt-1">No items of this type yet. Create some first.</p>
                )}
              </div>
              <div>
                <Label>Problem description</Label>
                <textarea
                  className="input min-h-[120px] resize-y"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue…"
                  required
                />
              </div>
              <div>
                <Label>Photos (optional)</Label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="input"
                  onChange={(e) => setFiles(e.target.files)}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              {message && <p className="text-sm text-green-600">{message}</p>}
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {submitting ? 'Submitting…' : 'Submit issue'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cables marked ISSUE</CardTitle>
          </CardHeader>
          <CardContent>
            {issueCables.isLoading && <p className="text-surface-500 text-sm">Loading…</p>}
            {!issueCables.isLoading && (issueCables.data?.data || []).length === 0 && (
              <p className="text-surface-500 text-sm">No cables currently in ISSUE status.</p>
            )}
            <ul className="space-y-2">
              {(issueCables.data?.data || []).map((c) => (
                <li key={c.id} className="text-sm border border-surface-200 rounded-lg p-3">
                  <span className="font-mono font-medium">{c.cable_id}</span>
                  <span className="text-surface-500"> · {c.cable_type}</span>
                  {c.notes && <p className="text-surface-600 mt-1">{c.notes}</p>}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
