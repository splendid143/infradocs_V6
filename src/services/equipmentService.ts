import { db } from "@/lib/supabase";
import {
  fetchPaginated,
  fetchOne,
  fetchAll,
  createRecord,
  updateRecord,
  deleteRecord,
} from "./baseService";

export interface Equipment {
  id: string;
  rack_id: string;
  equipment_id: string;
  name: string;
  description: string | null;
  equipment_type: string | null;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  asset_tag: string | null;
  position_u: number | null;
  height_u: number;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface EquipmentInsert extends Omit<
  Equipment,
  "id" | "created_at" | "updated_at" | "updated_by"
> {
  updated_by?: string | null;
}
export interface EquipmentUpdate extends Partial<
  Omit<Equipment, "id" | "created_at" | "updated_at">
> {}

export interface EquipmentWithCounts extends Equipment {
  rack_name: string | null;
  rack_id_str: string | null;
  room_name: string | null;
  room_id_str: string | null;
  site_name: string | null;
  site_id_str: string | null;
  ports_count: number;
}

async function getEquipmentCounts(equipmentId: string) {
  const ports = await db
    .from("equipment_ports")
    .select("id", { count: "exact", head: true })
    .eq("equipment_id", equipmentId);
  return { ports_count: ports.count || 0 };
}

export async function getEquipment(
  options: {
    page?: number;
    pageSize?: number;
    siteId?: string;
    roomId?: string;
    rackId?: string;
    search?: string;
    status?: string;
  } = {},
): Promise<{ data: EquipmentWithCounts[]; count: number }> {
  const {
    page = 1,
    pageSize = 25,
    siteId,
    roomId,
    rackId,
    search,
    status,
  } = options;

  let query = db
    .from("equipment")
    .select(
      "*, rack:racks(rack_id, name, room:rooms(room_id, name, site:sites(site_id, name)))",
      { count: "exact" },
    );

  if (rackId) query = query.eq("rack_id", rackId);
  else if (roomId) query = query.eq("rack.room_id", roomId);
  else if (siteId) query = query.eq("rack.room.site_id", siteId);
  if (status) query = query.eq("status", status);

  if (search) {
    query = query.or(
      `equipment_id.ilike.%${search}%,name.ilike.%${search}%,serial_number.ilike.%${search}%,asset_tag.ilike.%${search}%`,
    );
  }

  query = query
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error, count } = await query;

  if (error) throw new Error(`Equipment fetch failed: ${error.message}`);

  const equipmentWithCounts = await Promise.all(
    (data || []).map(async (eq) => {
      const counts = await getEquipmentCounts(eq.id);
      return {
        ...eq,
        rack_name: eq.rack?.name || null,
        rack_id_str: eq.rack?.id || null,
        room_name: eq.rack?.room?.name || null,
        room_id_str: eq.rack?.room?.id || null,
        site_name: eq.rack?.room?.site?.name || null,
        site_id_str: eq.rack?.room?.site?.site_id || null,
        ...counts,
      };
    }),
  );

  return { data: equipmentWithCounts, count: count || 0 };
}

export async function getEquipmentItem(
  id: string,
): Promise<EquipmentWithCounts | null> {
  const { data, error } = await db
    .from("equipment")
    .select(
      "*, rack:racks(rack_id, name, room:rooms(room_id, name, site:sites(site_id, name)))",
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Equipment fetch failed: ${error.message}`);
  }

  const counts = await getEquipmentCounts(data.id);
  return {
    ...data,
    rack_name: data.rack?.name || null,
    rack_id_str: data.rack?.id || null,
    room_name: data.rack?.room?.name || null,
    room_id_str: data.rack?.room?.id || null,
    site_name: data.rack?.room?.site?.name || null,
    site_id_str: data.rack?.room?.site?.site_id || null,
    ...counts,
  };
}

export async function getEquipmentByRack(
  rackId: string,
): Promise<EquipmentWithCounts[]> {
  const { data, error } = await db
    .from("equipment")
    .select(
      "*, rack:racks(rack_id, name, room:rooms(room_id, name, site:sites(site_id, name)))",
    )
    .eq("rack_id", rackId)
    .order("position_u", { ascending: true });

  if (error) throw new Error(`Equipment fetch failed: ${error.message}`);

  return Promise.all(
    (data || []).map(async (eq) => {
      const counts = await getEquipmentCounts(eq.id);
      return {
        ...eq,
        rack_name: eq.rack?.name || null,
        rack_id_str: eq.rack?.id || null,
        room_name: eq.rack?.room?.name || null,
        room_id_str: eq.rack?.room?.id || null,
        site_name: eq.rack?.room?.site?.name || null,
        site_id_str: eq.rack?.room?.site?.site_id || null,
        ...counts,
      };
    }),
  );
}

export async function createEquipment(
  equipment: EquipmentInsert,
): Promise<Equipment> {
  return createRecord<Equipment, EquipmentInsert>("equipment", equipment);
}

export async function updateEquipment(
  id: string,
  updates: EquipmentUpdate,
): Promise<Equipment> {
  return updateRecord<Equipment, EquipmentUpdate>("equipment", id, updates);
}

export async function deleteEquipment(id: string): Promise<void> {
  return deleteRecord("equipment", id);
}

// ============================================
// EQUIPMENT PORTS
// ============================================

export interface EquipmentPort {
  id: string;
  equipment_id: string;
  port_number: string;
  port_name: string | null;
  port_type: string | null;
  speed: string | null;
  protocol: string | null;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface EquipmentPortInsert extends Omit<
  EquipmentPort,
  "id" | "created_at" | "updated_at" | "updated_by"
> {
  updated_by?: string | null;
}
export interface EquipmentPortUpdate extends Partial<
  Omit<EquipmentPort, "id" | "equipment_id" | "created_at" | "updated_at">
> {}

export async function getPortsForEquipment(
  equipmentId: string,
): Promise<EquipmentPort[]> {
  const { data, error } = await db
    .from("equipment_ports")
    .select("*")
    .eq("equipment_id", equipmentId)
    .order("port_number", { ascending: true });

  if (error) throw new Error(`Equipment ports fetch failed: ${error.message}`);
  return data || [];
}

export async function createEquipmentPort(
  port: EquipmentPortInsert,
): Promise<EquipmentPort> {
  return createRecord<EquipmentPort, EquipmentPortInsert>(
    "equipment_ports",
    port,
  );
}

export async function updateEquipmentPort(
  id: string,
  updates: EquipmentPortUpdate,
): Promise<EquipmentPort> {
  return updateRecord<EquipmentPort, EquipmentPortUpdate>(
    "equipment_ports",
    id,
    updates,
  );
}

export async function deleteEquipmentPort(id: string): Promise<void> {
  return deleteRecord("equipment_ports", id);
}
