import { db } from "@/lib/supabase";
import {
  fetchPaginated,
  fetchOne,
  fetchAll,
  createRecord,
  updateRecord,
  deleteRecord,
} from "./baseService";

export interface Room {
  id: string;
  site_id: string;
  room_id: string;
  name: string;
  description: string | null;
  room_type: string | null;
  floor: string | null;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface RoomInsert extends Omit<
  Room,
  "id" | "created_at" | "updated_at" | "updated_by"
> {
  updated_by?: string | null;
}
export interface RoomUpdate extends Partial<
  Omit<Room, "id" | "created_at" | "updated_at">
> {}

export interface RoomWithCounts extends Room {
  site_name: string | null;
  site_id_str: string | null;
  racks_count: number;
  equipment_count: number;
}

async function getRoomCounts(roomId: string) {
  const [racks, equipment] = await Promise.all([
    db
      .from("racks")
      .select("id", { count: "exact", head: true })
      .eq("room_id", roomId),
    db
      .from("equipment")
      .select("id, rack:racks!inner(room_id)", { count: "exact", head: true })
      .eq("rack.room_id", roomId),
  ]);
  if (equipment.error)
    console.error("Room equipment count failed:", equipment.error.message);
  return {
    racks_count: racks.count || 0,
    equipment_count: equipment.count || 0,
  };
}

export async function getRooms(
  options: {
    page?: number;
    pageSize?: number;
    siteId?: string;
    search?: string;
    status?: string;
  } = {},
): Promise<{ data: RoomWithCounts[]; count: number }> {
  const { page = 1, pageSize = 25, siteId, search, status } = options;

  let query = db
    .from("rooms")
    .select("*, site:sites(site_id, name)", { count: "exact" });

  if (siteId) query = query.eq("site_id", siteId);
  if (status) query = query.eq("status", status);

  if (search) {
    query = query.or(
      `room_id.ilike.%${search}%,name.ilike.%${search}%,description.ilike.%${search}%`,
    );
  }

  query = query
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error, count } = await query;

  if (error) throw new Error(`Rooms fetch failed: ${error.message}`);

  const roomsWithCounts = await Promise.all(
    (data || []).map(async (room) => {
      const counts = await getRoomCounts(room.id);
      return {
        ...room,
        site_name: room.site?.name || null,
        site_id_str: room.site?.site_id || null,
        ...counts,
      };
    }),
  );

  return { data: roomsWithCounts, count: count || 0 };
}

export async function getRoom(id: string): Promise<RoomWithCounts | null> {
  const { data, error } = await db
    .from("rooms")
    .select("*, site:sites(site_id, name)")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Room fetch failed: ${error.message}`);
  }

  const counts = await getRoomCounts(data.id);
  return {
    ...data,
    site_name: data.site?.name || null,
    site_id_str: data.site?.site_id || null,
    ...counts,
  };
}

export async function getRoomsBySite(
  siteId: string,
): Promise<RoomWithCounts[]> {
  const { data, error } = await db
    .from("rooms")
    .select("*, site:sites(site_id, name)")
    .eq("site_id", siteId)
    .order("room_id", { ascending: true });

  if (error) throw new Error(`Rooms fetch failed: ${error.message}`);

  return Promise.all(
    (data || []).map(async (room) => {
      const counts = await getRoomCounts(room.id);
      return {
        ...room,
        site_name: room.site?.name || null,
        site_id_str: room.site?.site_id || null,
        ...counts,
      };
    }),
  );
}

export async function createRoom(room: RoomInsert): Promise<Room> {
  return createRecord<Room, RoomInsert>("rooms", room);
}

export async function updateRoom(
  id: string,
  updates: RoomUpdate,
): Promise<Room> {
  return updateRecord<Room, RoomUpdate>("rooms", id, updates);
}

export async function deleteRoom(id: string): Promise<void> {
  return deleteRecord("rooms", id);
}
