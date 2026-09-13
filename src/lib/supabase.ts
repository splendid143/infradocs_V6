import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env file.')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

/**
 * Untyped client for queries with joins / dynamic filters.
 * Placeholder Database types lack Relationships, so typed joins fail.
 * Use `supabase` for auth; use `db` for data access until types are generated.
 */
export const db = supabase as any

// Type-safe table references
export const TABLES = {
  USERS: 'users',
  SITES: 'sites',
  ROOMS: 'rooms',
  RACKS: 'racks',
  EQUIPMENT: 'equipment',
  EQUIPMENT_PORTS: 'equipment_ports',
  PATCH_PANELS: 'patch_panels',
  PATCH_PORTS: 'patch_ports',
  CABLES: 'cables',
  CABLE_ENDPOINTS: 'cable_endpoints',
  ATTACHMENTS: 'attachments',
  NOTES: 'notes',
  STATUS_HISTORY: 'status_history',
  QR_CODES: 'qr_codes',
  AUDIT_LOGS: 'audit_logs',
} as const