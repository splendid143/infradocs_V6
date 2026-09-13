import { db } from '@/lib/supabase'

export interface SearchResult {
  id: string
  type: 'site' | 'room' | 'rack' | 'equipment' | 'patch_panel' | 'cable' | 'port'
  display_id: string
  name: string
  description: string | null
  url: string
  parent?: {
    type: string
    display_id: string
    name: string
    url: string
  }
  metadata?: Record<string, unknown>
}

export async function globalSearch(query: string, limit = 50): Promise<SearchResult[]> {
  if (!query.trim()) return []

  const searchTerm = `%${query.trim()}%`
  const results: SearchResult[] = []

  const searches = await Promise.allSettled([
    searchSites(searchTerm, limit),
    searchRooms(searchTerm, limit),
    searchRacks(searchTerm, limit),
    searchEquipment(searchTerm, limit),
    searchPatchPanels(searchTerm, limit),
    searchCables(searchTerm, limit),
    searchPorts(searchTerm, limit),
  ])

  searches.forEach((result) => {
    if (result.status === 'fulfilled') {
      results.push(...result.value)
    }
  })

  return results.slice(0, limit)
}

async function searchSites(term: string, limit: number): Promise<SearchResult[]> {
  const { data, error } = await db
    .from('sites')
    .select('id, site_id, name, description, status')
    .or(`site_id.ilike.${term},name.ilike.${term},description.ilike.${term}`)
    .limit(limit)

  if (error) throw error

  return (data || []).map(site => ({
    id: site.id,
    type: 'site' as const,
    display_id: site.site_id,
    name: site.name,
    description: site.description,
    url: `/sites/${site.id}`,
    metadata: { status: site.status },
  }))
}

async function searchRooms(term: string, limit: number): Promise<SearchResult[]> {
  const { data, error } = await db
    .from('rooms')
    .select(`
      id, room_id, name, description, status,
      site:sites(id, site_id, name)
    `)
    .or(`room_id.ilike.${term},name.ilike.${term},description.ilike.${term}`)
    .limit(limit)

  if (error) throw error

  return (data || []).map(room => ({
    id: room.id,
    type: 'room' as const,
    display_id: room.room_id,
    name: room.name,
    description: room.description,
    url: `/rooms/${room.id}`,
    parent: room.site ? {
      type: 'site',
      display_id: room.site.site_id,
      name: room.site.name,
      url: `/sites/${room.site.id}`,
    } : undefined,
    metadata: { status: room.status },
  }))
}

async function searchRacks(term: string, limit: number): Promise<SearchResult[]> {
  const { data, error } = await db
    .from('racks')
    .select(`
      id, rack_id, name, description, status,
      room:rooms(id, room_id, name, site:sites(id, site_id, name))
    `)
    .or(`rack_id.ilike.${term},name.ilike.${term},description.ilike.${term}`)
    .limit(limit)

  if (error) throw error

  return (data || []).map(rack => ({
    id: rack.id,
    type: 'rack' as const,
    display_id: rack.rack_id,
    name: rack.name,
    description: rack.description,
    url: `/racks/${rack.id}`,
    parent: rack.room ? {
      type: 'room',
      display_id: rack.room.room_id,
      name: rack.room.name,
      url: `/rooms/${rack.room.id}`,
    } : undefined,
    metadata: { status: rack.status },
  }))
}

async function searchEquipment(term: string, limit: number): Promise<SearchResult[]> {
  const { data, error } = await db
    .from('equipment')
    .select(`
      id, equipment_id, name, description, status, manufacturer, model, serial_number, asset_tag,
      rack:racks(id, rack_id, name, room:rooms(id, room_id, name, site:sites(id, site_id, name)))
    `)
    .or(`equipment_id.ilike.${term},name.ilike.${term},description.ilike.${term},serial_number.ilike.${term},asset_tag.ilike.${term},manufacturer.ilike.${term},model.ilike.${term}`)
    .limit(limit)

  if (error) throw error

  return (data || []).map(eq => ({
    id: eq.id,
    type: 'equipment' as const,
    display_id: eq.equipment_id,
    name: eq.name,
    description: eq.description,
    url: `/equipment/${eq.id}`,
    parent: eq.rack ? {
      type: 'rack',
      display_id: eq.rack.rack_id,
      name: eq.rack.name,
      url: `/racks/${eq.rack.id}`,
    } : undefined,
    metadata: { status: eq.status, manufacturer: eq.manufacturer, model: eq.model },
  }))
}

async function searchPatchPanels(term: string, limit: number): Promise<SearchResult[]> {
  const { data, error } = await db
    .from('patch_panels')
    .select(`
      id, panel_id, name, description, status,
      rack:racks(id, rack_id, name, room:rooms(id, room_id, name, site:sites(id, site_id, name)))
    `)
    .or(`panel_id.ilike.${term},name.ilike.${term},description.ilike.${term}`)
    .limit(limit)

  if (error) throw error

  return (data || []).map(panel => ({
    id: panel.id,
    type: 'patch_panel' as const,
    display_id: panel.panel_id,
    name: panel.name,
    description: panel.description,
    url: `/patch-panels/${panel.id}`,
    parent: panel.rack ? {
      type: 'rack',
      display_id: panel.rack.rack_id,
      name: panel.rack.name,
      url: `/racks/${panel.rack.id}`,
    } : undefined,
    metadata: { status: panel.status },
  }))
}

async function searchCables(term: string, limit: number): Promise<SearchResult[]> {
  const { data, error } = await db
    .from('cables')
    .select(`
      id, cable_id, cable_type, specification, status, length_m, length_ft
    `)
    .or(`cable_id.ilike.${term},specification.ilike.${term}`)
    .limit(limit)

  if (error) throw error

  return (data || []).map(cable => ({
    id: cable.id,
    type: 'cable' as const,
    display_id: cable.cable_id,
    name: `${cable.cable_type} ${cable.specification || ''}`.trim(),
    description: `${cable.length_m ? `${cable.length_m}m` : ''}${cable.length_ft ? ` (${cable.length_ft}ft)` : ''}`,
    url: `/cables/${cable.id}`,
    metadata: { cable_type: cable.cable_type, specification: cable.specification, status: cable.status },
  }))
}

async function searchPorts(term: string, limit: number): Promise<SearchResult[]> {
  const [equipmentPorts, patchPorts] = await Promise.all([
    db
      .from('equipment_ports')
      .select(`
        id, port_number, port_name, status,
        equipment:equipment(id, equipment_id, name, rack:racks(id, rack_id, name))
      `)
      .or(`port_number.ilike.${term},port_name.ilike.${term}`)
      .limit(limit),
    db
      .from('patch_ports')
      .select(`
        id, port_number, port_name, status,
        patch_panel:patch_panels(id, panel_id, name, rack:racks(id, rack_id, name))
      `)
      .or(`port_number.ilike.${term},port_name.ilike.${term}`)
      .limit(limit),
  ])

  const results: SearchResult[] = []

  if (!equipmentPorts.error && equipmentPorts.data) {
    results.push(...equipmentPorts.data.map(port => ({
      id: port.id,
      type: 'port' as const,
      display_id: `${port.equipment?.equipment_id || 'EQ'}-${port.port_number}`,
      name: `Port ${port.port_number}${port.port_name ? ` (${port.port_name})` : ''}`,
      description: `Equipment port on ${port.equipment?.name || 'Unknown'}`,
      url: `/equipment/${port.equipment?.id}`,
      parent: port.equipment?.rack ? {
        type: 'rack',
        display_id: port.equipment.rack.rack_id,
        name: port.equipment.rack.name,
        url: `/racks/${port.equipment.rack.id}`,
      } : undefined,
      metadata: { port_type: 'EQUIPMENT_PORT', status: port.status },
    })))
  }

  if (!patchPorts.error && patchPorts.data) {
    results.push(...patchPorts.data.map(port => ({
      id: port.id,
      type: 'port' as const,
      display_id: `${port.patch_panel?.panel_id || 'PP'}-${port.port_number}`,
      name: `Port ${port.port_number}${port.port_name ? ` (${port.port_name})` : ''}`,
      description: `Patch port on ${port.patch_panel?.name || 'Unknown'}`,
      url: `/patch-panels/${port.patch_panel?.id}`,
      parent: port.patch_panel?.rack ? {
        type: 'rack',
        display_id: port.patch_panel.rack.rack_id,
        name: port.patch_panel.rack.name,
        url: `/racks/${port.patch_panel.rack.id}`,
      } : undefined,
      metadata: { port_type: 'PATCH_PORT', status: port.status },
    })))
  }

  return results
}