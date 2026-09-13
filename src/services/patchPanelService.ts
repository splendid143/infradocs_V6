import { db } from '@/lib/supabase'
import { fetchPaginated, fetchOne, fetchAll, createRecord, updateRecord, deleteRecord } from './baseService'

export interface PatchPanel {
  id: string
  rack_id: string
  panel_id: string
  name: string
  description: string | null
  panel_type: string | null
  port_count: number
  position_u: number | null
  height_u: number
  status: string
  created_by: string
  created_at: string
  updated_at: string
  updated_by: string | null
}

export interface PatchPanelInsert extends Omit<PatchPanel, 'id' | 'created_at' | 'updated_at' | 'updated_by'> { updated_by?: string | null }
export interface PatchPanelUpdate extends Partial<Omit<PatchPanel, 'id' | 'created_at' | 'updated_at'>> {}

export interface PatchPanelWithCounts extends PatchPanel {
  rack_name: string | null
  rack_id_str: string | null
  room_name: string | null
  room_id_str: string | null
  site_name: string | null
  site_id_str: string | null
  ports_count: number
  cables_count: number
}

async function getPatchPanelCounts(panelId: string) {
  const [ports, cables] = await Promise.all([
    db.from('patch_ports').select('id', { count: 'exact', head: true }).eq('patch_panel_id', panelId),
    db.from('cables').select('id', { count: 'exact', head: true }).eq('endpoints.patch_port.patch_panel_id', panelId),
  ])
  return {
    ports_count: ports.count || 0,
    cables_count: cables.count || 0,
  }
}

export async function getPatchPanels(options: {
  page?: number
  pageSize?: number
  siteId?: string
  roomId?: string
  rackId?: string
  search?: string
  status?: string
} = {}): Promise<{ data: PatchPanelWithCounts[]; count: number }> {
  const { page = 1, pageSize = 25, siteId, roomId, rackId, search, status } = options

  let query = db.from('patch_panels').select('*, rack:racks(rack_id, name, room:rooms(room_id, name, site:sites(site_id, name)))', { count: 'exact' })

  if (rackId) query = query.eq('rack_id', rackId)
  else if (roomId) query = query.eq('rack.room_id', roomId)
  else if (siteId) query = query.eq('rack.room.site_id', siteId)
  if (status) query = query.eq('status', status)

  if (search) {
    query = query.or(`panel_id.ilike.%${search}%,name.ilike.%${search}%,description.ilike.%${search}%`)
  }

  query = query.order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  const { data, error, count } = await query

  if (error) throw new Error(`Patch panels fetch failed: ${error.message}`)

  const panelsWithCounts = await Promise.all(
    (data || []).map(async (panel) => {
      const counts = await getPatchPanelCounts(panel.id)
      return {
        ...panel,
        rack_name: panel.rack?.name || null,
        rack_id_str: panel.rack?.id || null,
        room_name: panel.rack?.room?.name || null,
        room_id_str: panel.rack?.room?.id || null,
        site_name: panel.rack?.room?.site?.name || null,
        site_id_str: panel.rack?.room?.site?.site_id || null,
        ...counts,
      }
    })
  )

  return { data: panelsWithCounts, count: count || 0 }
}

export async function getPatchPanel(id: string): Promise<PatchPanelWithCounts | null> {
  const { data, error } = await db
    .from('patch_panels')
    .select('*, rack:racks(rack_id, name, room:rooms(room_id, name, site:sites(site_id, name)))')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Patch panel fetch failed: ${error.message}`)
  }

  const counts = await getPatchPanelCounts(data.id)
  return {
    ...data,
    rack_name: data.rack?.name || null,
    rack_id_str: data.rack?.id || null,
    room_name: data.rack?.room?.name || null,
    room_id_str: data.rack?.room?.id || null,
    site_name: data.rack?.room?.site?.name || null,
    site_id_str: data.rack?.room?.site?.site_id || null,
    ...counts,
  }
}

export async function getPatchPanelsByRack(rackId: string): Promise<PatchPanelWithCounts[]> {
  const { data, error } = await db
    .from('patch_panels')
    .select('*, rack:racks(rack_id, name, room:rooms(room_id, name, site:sites(site_id, name)))')
    .eq('rack_id', rackId)
    .order('position_u', { ascending: true })

  if (error) throw new Error(`Patch panels fetch failed: ${error.message}`)

  return Promise.all(
    (data || []).map(async (panel) => {
      const counts = await getPatchPanelCounts(panel.id)
      return {
        ...panel,
        rack_name: panel.rack?.name || null,
        rack_id_str: panel.rack?.id || null,
        room_name: panel.rack?.room?.name || null,
        room_id_str: panel.rack?.room?.id || null,
        site_name: panel.rack?.room?.site?.name || null,
        site_id_str: panel.rack?.room?.site?.site_id || null,
        ...counts,
      }
    })
  )
}

export async function createPatchPanel(panel: PatchPanelInsert): Promise<PatchPanel> {
  return createRecord<PatchPanel, PatchPanelInsert>('patch_panels', panel)
}

export async function updatePatchPanel(id: string, updates: PatchPanelUpdate): Promise<PatchPanel> {
  return updateRecord<PatchPanel, PatchPanelUpdate>('patch_panels', id, updates)
}

export async function deletePatchPanel(id: string): Promise<void> {
  return deleteRecord('patch_panels', id)
}