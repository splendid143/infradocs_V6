import { db } from '@/lib/supabase'
import { fetchPaginated, fetchOne, fetchAll, createRecord, updateRecord, deleteRecord } from './baseService'

export interface Rack {
  id: string
  room_id: string
  rack_id: string
  name: string
  description: string | null
  rack_type: string | null
  height_u: number
  position: number | null
  status: string
  created_by: string
  created_at: string
  updated_at: string
  updated_by: string | null
}

export interface RackInsert extends Omit<Rack, 'id' | 'created_at' | 'updated_at' | 'updated_by'> { updated_by?: string | null }
export interface RackUpdate extends Partial<Omit<Rack, 'id' | 'created_at' | 'updated_at'>> {}

export interface RackWithCounts extends Rack {
  room_name: string | null
  room_id_str: string | null
  site_name: string | null
  site_id_str: string | null
  equipment_count: number
  patch_panels_count: number
  cables_count: number
}

async function getRackCounts(rackId: string) {
  const [equipment, patchPanels, cables] = await Promise.all([
    db.from('equipment').select('id', { count: 'exact', head: true }).eq('rack_id', rackId),
    db.from('patch_panels').select('id', { count: 'exact', head: true }).eq('rack_id', rackId),
    db.from('cables').select('id', { count: 'exact', head: true }).or(`endpoints.equipment_port.equipment.rack_id.eq.${rackId},endpoints.patch_port.patch_panel.rack_id.eq.${rackId}`),
  ])
  return {
    equipment_count: equipment.count || 0,
    patch_panels_count: patchPanels.count || 0,
    cables_count: cables.count || 0,
  }
}

export async function getRacks(options: {
  page?: number
  pageSize?: number
  siteId?: string
  roomId?: string
  search?: string
  status?: string
} = {}): Promise<{ data: RackWithCounts[]; count: number }> {
  const { page = 1, pageSize = 25, siteId, roomId, search, status } = options

  let query = db.from('racks').select('*, room:rooms(room_id, name, site:sites(site_id, name))', { count: 'exact' })

  if (roomId) query = query.eq('room_id', roomId)
  else if (siteId) query = query.eq('room.site_id', siteId)
  if (status) query = query.eq('status', status)

  if (search) {
    query = query.or(`rack_id.ilike.%${search}%,name.ilike.%${search}%,description.ilike.%${search}%`)
  }

  query = query.order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  const { data, error, count } = await query

  if (error) throw new Error(`Racks fetch failed: ${error.message}`)

  const racksWithCounts = await Promise.all(
    (data || []).map(async (rack) => {
      const counts = await getRackCounts(rack.id)
      return {
        ...rack,
        room_name: rack.room?.name || null,
        room_id_str: rack.room?.id || null,
        site_name: rack.room?.site?.name || null,
        site_id_str: rack.room?.site?.site_id || null,
        ...counts,
      }
    })
  )

  return { data: racksWithCounts, count: count || 0 }
}

export async function getRack(id: string): Promise<RackWithCounts | null> {
  const { data, error } = await db
    .from('racks')
    .select('*, room:rooms(room_id, name, site:sites(site_id, name))')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Rack fetch failed: ${error.message}`)
  }

  const counts = await getRackCounts(data.id)
  return {
    ...data,
    room_name: data.room?.name || null,
    room_id_str: data.room?.id || null,
    site_name: data.room?.site?.name || null,
    site_id_str: data.room?.site?.site_id || null,
    ...counts,
  }
}

export async function getRacksByRoom(roomId: string): Promise<RackWithCounts[]> {
  const { data, error } = await db
    .from('racks')
    .select('*, room:rooms(room_id, name, site:sites(site_id, name))')
    .eq('room_id', roomId)
    .order('rack_id', { ascending: true })

  if (error) throw new Error(`Racks fetch failed: ${error.message}`)

  return Promise.all(
    (data || []).map(async (rack) => {
      const counts = await getRackCounts(rack.id)
      return {
        ...rack,
        room_name: rack.room?.name || null,
        room_id_str: rack.room?.id || null,
        site_name: rack.room?.site?.name || null,
        site_id_str: rack.room?.site?.site_id || null,
        ...counts,
      }
    })
  )
}

export async function createRack(rack: RackInsert): Promise<Rack> {
  return createRecord<Rack, RackInsert>('racks', rack)
}

export async function updateRack(id: string, updates: RackUpdate): Promise<Rack> {
  return updateRecord<Rack, RackUpdate>('racks', id, updates)
}

export async function deleteRack(id: string): Promise<void> {
  return deleteRecord('racks', id)
}