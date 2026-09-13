import { db } from '@/lib/supabase'
import { fetchPaginated, fetchOne, fetchAll, createRecord, updateRecord, deleteRecord } from './baseService'

export interface Cable {
  id: string
  cable_id: string
  cable_type: 'FIBER' | 'COPPER' | 'COAX' | 'POWER' | 'OTHER'
  specification: string | null
  length_m: number | null
  length_ft: number | null
  quantity: number
  status: string
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
  updated_by: string | null
}

export interface CableInsert extends Omit<Cable, 'id' | 'created_at' | 'updated_at' | 'updated_by'> { updated_by?: string | null }
export interface CableUpdate extends Partial<Omit<Cable, 'id' | 'created_at' | 'updated_at'>> {}

export interface CableWithEndpoints extends Cable {
  endpoint_a: CableEndpoint | null
  endpoint_b: CableEndpoint | null
}

export interface CableEndpoint {
  id: string
  cable_id: string
  endpoint_label: 'A' | 'B'
  endpoint_type: 'EQUIPMENT_PORT' | 'PATCH_PORT'
  equipment_port_id: string | null
  patch_port_id: string | null
  equipment_port?: EquipmentPortDetail | null
  patch_port?: PatchPortDetail | null
}

export interface EquipmentPortDetail {
  id: string
  port_number: string
  port_name: string | null
  equipment: EquipmentDetail | null
}

export interface EquipmentDetail {
  id: string
  equipment_id: string
  name: string
  rack: RackDetail | null
}

export interface RackDetail {
  id: string
  rack_id: string
  name: string
  room: RoomDetail | null
}

export interface RoomDetail {
  id: string
  room_id: string
  name: string
  site: SiteDetail | null
}

export interface SiteDetail {
  id: string
  site_id: string
  name: string
}

export interface PatchPortDetail {
  id: string
  port_number: string
  port_name: string | null
  patch_panel: PatchPanelDetail | null
}

export interface PatchPanelDetail {
  id: string
  panel_id: string
  name: string
  rack: RackDetail | null
}

async function enrichCableEndpoints(cables: Cable[]): Promise<CableWithEndpoints[]> {
  if (cables.length === 0) return []

  const cableIds = cables.map(c => c.id)
  
  const { data: endpoints, error } = await db
    .from('cable_endpoints')
    .select(`
      *,
      equipment_port:equipment_ports(
        id, port_number, port_name,
        equipment:equipment(id, equipment_id, name, rack:racks(id, rack_id, name, room:rooms(id, room_id, name, site:sites(id, site_id, name))))
      ),
      patch_port:patch_ports(
        id, port_number, port_name,
        patch_panel:patch_panels(id, panel_id, name, rack:racks(id, rack_id, name, room:rooms(id, room_id, name, site:sites(id, site_id, name))))
      )
    `)
    .in('cable_id', cableIds)

  if (error) throw new Error(`Cable endpoints fetch failed: ${error.message}`)

  const endpointsByCable = new Map<string, typeof endpoints>()
  endpoints?.forEach(ep => {
    if (!endpointsByCable.has(ep.cable_id)) {
      endpointsByCable.set(ep.cable_id, [])
    }
    endpointsByCable.get(ep.cable_id)!.push(ep)
  })

  return cables.map(cable => {
    const cableEndpoints = endpointsByCable.get(cable.id) || []
    const endpointA = cableEndpoints.find(e => e.endpoint_label === 'A') || null
    const endpointB = cableEndpoints.find(e => e.endpoint_label === 'B') || null
    return { ...cable, endpoint_a: endpointA, endpoint_b: endpointB }
  })
}

export async function getCables(options: {
  page?: number
  pageSize?: number
  siteId?: string
  roomId?: string
  rackId?: string
  patchPanelId?: string
  search?: string
  status?: string
  cableType?: string
} = {}): Promise<{ data: CableWithEndpoints[]; count: number }> {
  const { page = 1, pageSize = 25, siteId, roomId, rackId, patchPanelId, search, status, cableType } = options

  let query = db.from('cables').select('*', { count: 'exact' })

  if (rackId) {
    query = query.or(`endpoints.equipment_port.equipment.rack_id.eq.${rackId},endpoints.patch_port.patch_panel.rack_id.eq.${rackId}`)
  } else if (roomId) {
    query = query.or(`endpoints.equipment_port.equipment.rack.room_id.eq.${roomId},endpoints.patch_port.patch_panel.rack.room_id.eq.${roomId}`)
  } else if (siteId) {
    query = query.or(`endpoints.equipment_port.equipment.rack.room.site_id.eq.${siteId},endpoints.patch_port.patch_panel.rack.room.site_id.eq.${siteId}`)
  }

  if (patchPanelId) query = query.eq('endpoints.patch_port.patch_panel_id', patchPanelId)
  if (status) query = query.eq('status', status)
  if (cableType) query = query.eq('cable_type', cableType)

  if (search) {
    query = query.or(`cable_id.ilike.%${search}%,specification.ilike.%${search}%,notes.ilike.%${search}%`)
  }

  query = query.order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  const { data, error, count } = await query

  if (error) throw new Error(`Cables fetch failed: ${error.message}`)

  const cablesWithEndpoints = await enrichCableEndpoints(data || [])

  return { data: cablesWithEndpoints, count: count || 0 }
}

export async function getCable(id: string): Promise<CableWithEndpoints | null> {
  const { data, error } = await db
    .from('cables')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Cable fetch failed: ${error.message}`)
  }

  const enriched = await enrichCableEndpoints([data])
  return enriched[0] || null
}

export async function getCableByCableId(cableId: string): Promise<CableWithEndpoints | null> {
  const { data, error } = await db
    .from('cables')
    .select('*')
    .eq('cable_id', cableId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Cable fetch failed: ${error.message}`)
  }

  const enriched = await enrichCableEndpoints([data])
  return enriched[0] || null
}

export async function getCablesByRack(rackId: string): Promise<CableWithEndpoints[]> {
  const { data, error } = await db
    .from('cables')
    .select('*')
    .or(`endpoints.equipment_port.equipment.rack_id.eq.${rackId},endpoints.patch_port.patch_panel.rack_id.eq.${rackId}`)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Cables fetch failed: ${error.message}`)

  return enrichCableEndpoints(data || [])
}

export async function createCableWithEndpoints(
  cable: CableInsert,
  endpointA?: { endpoint_type: 'EQUIPMENT_PORT' | 'PATCH_PORT'; equipment_port_id?: string; patch_port_id?: string } | null,
  endpointB?: { endpoint_type: 'EQUIPMENT_PORT' | 'PATCH_PORT'; equipment_port_id?: string; patch_port_id?: string } | null
): Promise<Cable> {
  const { data: cableData, error: cableError } = await db
    .from('cables')
    .insert(cable)
    .select()
    .single()

  if (cableError) throw new Error(`Cable create failed: ${cableError.message}`)

  const endpoints: any[] = []
  if (endpointA && (endpointA.equipment_port_id || endpointA.patch_port_id)) {
    endpoints.push({ ...endpointA, cable_id: cableData.id, endpoint_label: 'A' as const })
  }
  if (endpointB && (endpointB.equipment_port_id || endpointB.patch_port_id)) {
    endpoints.push({ ...endpointB, cable_id: cableData.id, endpoint_label: 'B' as const })
  }

  if (endpoints.length > 0) {
    const { error: endpointsError } = await db
      .from('cable_endpoints')
      .insert(endpoints)

    if (endpointsError) {
      await db.from('cables').delete().eq('id', cableData.id)
      throw new Error(`Cable endpoints create failed: ${endpointsError.message}`)
    }
  }

  return cableData
}

export async function updateCableWithEndpoints(
  id: string,
  updates: CableUpdate,
  endpointA?: { endpoint_type: 'EQUIPMENT_PORT' | 'PATCH_PORT'; equipment_port_id?: string; patch_port_id?: string },
  endpointB?: { endpoint_type: 'EQUIPMENT_PORT' | 'PATCH_PORT'; equipment_port_id?: string; patch_port_id?: string }
): Promise<Cable> {
  const { data: cableData, error: cableError } = await db
    .from('cables')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (cableError) throw new Error(`Cable update failed: ${cableError.message}`)

  if (endpointA || endpointB) {
    await db.from('cable_endpoints').delete().eq('cable_id', id)

    const endpoints = []
    if (endpointA) endpoints.push({ ...endpointA, cable_id: id, endpoint_label: 'A' as const })
    if (endpointB) endpoints.push({ ...endpointB, cable_id: id, endpoint_label: 'B' as const })

    const { error: endpointsError } = await db
      .from('cable_endpoints')
      .insert(endpoints)

    if (endpointsError) throw new Error(`Cable endpoints update failed: ${endpointsError.message}`)
  }

  return cableData
}

export async function deleteCable(id: string): Promise<void> {
  return deleteRecord('cables', id)
}

export async function getConnectedCable(portType: 'EQUIPMENT_PORT' | 'PATCH_PORT', portId: string): Promise<CableWithEndpoints | null> {
  const { data, error } = await db
    .from('cable_endpoints')
    .select(`
      cable:cables(*),
      equipment_port:equipment_ports(
        id, port_number, port_name,
        equipment:equipment(id, equipment_id, name, rack:racks(id, rack_id, name, room:rooms(id, room_id, name, site:sites(id, site_id, name))))
      ),
      patch_port:patch_ports(
        id, port_number, port_name,
        patch_panel:patch_panels(id, panel_id, name, rack:racks(id, rack_id, name, room:rooms(id, room_id, name, site:sites(id, site_id, name))))
      )
    `)
    .eq(`${portType === 'EQUIPMENT_PORT' ? 'equipment_port_id' : 'patch_port_id'}`, portId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Connected cable fetch failed: ${error.message}`)
  }

  const cable = data.cable
  if (!cable) return null

  const enriched = await enrichCableEndpoints([cable])
  return enriched[0] || null
}
export async function listEquipmentPorts(): Promise<{ id: string; label: string }[]> {
  const { data, error } = await db
    .from('equipment_ports')
    .select('id, port_number, port_name, equipment:equipment(equipment_id, name)')
    .order('port_number', { ascending: true })
    .limit(500)

  if (error) throw new Error(`Equipment ports fetch failed: ${error.message}`)

  return (data || []).map((p: any) => ({
    id: p.id,
    label: `${p.equipment?.equipment_id || 'EQ'} ${p.equipment?.name || ''} — Port ${p.port_name || p.port_number}`,
  }))
}

export async function listPatchPorts(): Promise<{ id: string; label: string }[]> {
  const { data, error } = await db
    .from('patch_ports')
    .select('id, port_number, port_name, patch_panel:patch_panels(panel_id, name)')
    .order('port_number', { ascending: true })
    .limit(500)

  if (error) throw new Error(`Patch ports fetch failed: ${error.message}`)

  return (data || []).map((p: any) => ({
    id: p.id,
    label: `${p.patch_panel?.panel_id || 'PP'} ${p.patch_panel?.name || ''} — Port ${p.port_name || p.port_number}`,
  }))
}
