import { db } from '@/lib/supabase'

export interface AuditLogEntry {
  id: string
  created_at: string
  actor_id: string
  actor_name: string
  actor_email: string
  action: string
  entity_type: string
  entity_id: string
  entity_display: string
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  details: string | null
}

export async function getAuditLogs(options: {
  page?: number
  pageSize?: number
  actorId?: string
  action?: string
  entityType?: string
  entityId?: string
  dateFrom?: string
  dateTo?: string
} = {}): Promise<{ data: AuditLogEntry[]; count: number }> {
  const { page = 1, pageSize = 50, actorId, action, entityType, entityId, dateFrom, dateTo } = options

  let query = db
    .from('audit_logs')
    .select('*, actor:users(name, email)', { count: 'exact' })

  if (actorId) query = query.eq('actor_id', actorId)
  if (action) query = query.eq('action', action)
  if (entityType) query = query.eq('entity_type', entityType)
  if (entityId) query = query.eq('entity_id', entityId)
  if (dateFrom) query = query.gte('created_at', dateFrom)
  if (dateTo) query = query.lte('created_at', dateTo)

  query = query.order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  const { data, error, count } = await query

  if (error) throw new Error(`Audit logs fetch failed: ${error.message}`)

  const logsWithActor = (data || []).map(log => ({
    ...log,
    actor_name: log.actor?.name || 'Unknown',
    actor_email: log.actor?.email || 'Unknown',
  }))

  return { data: logsWithActor, count: count || 0 }
}

export async function getAuditLog(id: string): Promise<AuditLogEntry | null> {
  const { data, error } = await db
    .from('audit_logs')
    .select('*, actor:users(name, email)')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Audit log fetch failed: ${error.message}`)
  }

  return {
    ...data,
    actor_name: data.actor?.name || 'Unknown',
    actor_email: data.actor?.email || 'Unknown',
  }
}

export async function getEntityAuditHistory(entityType: string, entityId: string): Promise<AuditLogEntry[]> {
  const { data, error } = await db
    .from('audit_logs')
    .select('*, actor:users(name, email)')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Entity audit history fetch failed: ${error.message}`)

  return (data || []).map(log => ({
    ...log,
    actor_name: log.actor?.name || 'Unknown',
    actor_email: log.actor?.email || 'Unknown',
  }))
}