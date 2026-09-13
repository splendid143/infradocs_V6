import { db } from "@/lib/supabase";
import {
  fetchPaginated,
  fetchOne,
  fetchByField,
  fetchAll,
  createRecord,
  updateRecord,
  deleteRecord,
} from "./baseService";

export interface Site {
  id: string;
  site_id: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface SiteInsert extends Omit<
  Site,
  "id" | "created_at" | "updated_at" | "updated_by"
> {
  updated_by?: string | null;
}
export interface SiteUpdate extends Partial<
  Omit<Site, "id" | "created_at" | "updated_at">
> {}

export interface SiteWithCounts extends Site {
  rooms_count: number;
  racks_count: number;
  equipment_count: number;
}

async function getCounts(siteId: string) {
  const [rooms, racks, equipment] = await Promise.all([
    db
      .from("rooms")
      .select("id", { count: "exact", head: true })
      .eq("site_id", siteId),
    db
      .from("racks")
      .select("id, room:rooms!inner(site_id)", { count: "exact", head: true })
      .eq("room.site_id", siteId),
    db
      .from("equipment")
      .select("id, rack:racks!inner(room:rooms!inner(site_id))", {
        count: "exact",
        head: true,
      })
      .eq("rack.room.site_id", siteId),
  ]);
  if (racks.error)
    console.error("Site rack count failed:", racks.error.message);
  if (equipment.error)
    console.error("Site equipment count failed:", equipment.error.message);
  return {
    rooms_count: rooms.count || 0,
    racks_count: racks.count || 0,
    equipment_count: equipment.count || 0,
  };
}
export async function getSites(
  options: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
  } = {},
): Promise<{ data: SiteWithCounts[]; count: number }> {
  const { page = 1, pageSize = 25, search, status } = options;

  const result = await fetchPaginated<Site>("sites", {
    page,
    pageSize,
    filters: search ? undefined : { status },
    orderBy: "created_at",
    orderDirection: "desc",
  });

  if (search) {
    const { data, error, count } = await db
      .from("sites")
      .select("*", { count: "exact" })
      .or(
        `site_id.ilike.%${search}%,name.ilike.%${search}%,description.ilike.%${search}%`,
      )
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) throw new Error(`Sites fetch failed: ${error.message}`);

    const sitesWithCounts = await Promise.all(
      (data || []).map(async (site) => {
        const counts = await getCounts(site.id);
        return { ...site, ...counts };
      }),
    );

    return { data: sitesWithCounts, count: count || 0 };
  }

  const sitesWithCounts = await Promise.all(
    result.data.map(async (site) => {
      const counts = await getCounts(site.id);
      return { ...site, ...counts };
    }),
  );

  return { data: sitesWithCounts, count: result.count };
}

export async function getSite(id: string): Promise<SiteWithCounts | null> {
  const site = await fetchOne<Site>("sites", id);
  if (!site) return null;

  const counts = await getCounts(site.id);
  return { ...site, ...counts };
}

export async function getSiteBySiteId(
  siteId: string,
): Promise<SiteWithCounts | null> {
  const site = await fetchByField<Site>("sites", "site_id", siteId);
  if (!site) return null;

  const counts = await getCounts(site.id);
  return { ...site, ...counts };
}

export async function getAllSites(): Promise<Site[]> {
  return fetchAll<Site>("sites", { orderBy: "site_id", orderDirection: "asc" });
}

export async function createSite(site: SiteInsert): Promise<Site> {
  return createRecord<Site, SiteInsert>("sites", site);
}

export async function updateSite(
  id: string,
  updates: SiteUpdate,
): Promise<Site> {
  return updateRecord<Site, SiteUpdate>("sites", id, updates);
}

export async function deleteSite(id: string): Promise<void> {
  return deleteRecord("sites", id);
}
