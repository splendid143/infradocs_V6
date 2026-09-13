import { useQuery } from '@tanstack/react-query'
import { getAuditLogs, getAuditLog, getEntityAuditHistory } from '@/services/auditService'
import type { AuditLogEntry } from '@/services/auditService'

export function useAuditLogs(options: {
  page?: number
  pageSize?: number
  actorId?: string
  action?: string
  entityType?: string
  entityId?: string
  dateFrom?: string
  dateTo?: string
} = {}) {
  return useQuery({
    queryKey: ['auditLogs', options],
    queryFn: () => getAuditLogs(options),
    staleTime: 1000 * 60 * 5,
  })
}

export function useAuditLog(id: string) {
  return useQuery({
    queryKey: ['auditLogs', id],
    queryFn: () => getAuditLog(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

export function useEntityAuditHistory(entityType: string, entityId: string) {
  return useQuery({
    queryKey: ['auditLogs', 'entity', entityType, entityId],
    queryFn: () => getEntityAuditHistory(entityType, entityId),
    enabled: !!entityType && !!entityId,
    staleTime: 1000 * 60 * 5,
  })
}