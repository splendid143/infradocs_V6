import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createQRCode, getQRCodeByToken, getQRCodeByEntity, regenerateQRCode, deactivateQRCode, getQRCodesByEntity, generateQRToken, getEntityRoute } from '@/services/qrService'
import type { QRCode, QRCodeWithEntity } from '@/services/qrService'

export function useQRCodeByToken(token: string) {
  return useQuery({
    queryKey: ['qrCodes', 'token', token],
    queryFn: () => getQRCodeByToken(token),
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  })
}

export function useQRCodeByEntity(entityType: string, entityId: string) {
  return useQuery({
    queryKey: ['qrCodes', 'entity', entityType, entityId],
    queryFn: () => getQRCodeByEntity(entityType, entityId),
    enabled: !!entityType && !!entityId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useQRCodesByEntity(entityType: string, entityId: string) {
  return useQuery({
    queryKey: ['qrCodes', 'entity', 'all', entityType, entityId],
    queryFn: () => getQRCodesByEntity(entityType, entityId),
    enabled: !!entityType && !!entityId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateQRCode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      options,
    }: {
      entityType: string
      entityId: string
      options: { expiresAt?: string; createdBy: string }
    }) => createQRCode(entityType, entityId, options),
    onSuccess: (_, { entityType, entityId }) => {
      queryClient.invalidateQueries({ queryKey: ['qrCodes', 'entity', entityType, entityId] })
      queryClient.invalidateQueries({ queryKey: ['qrCodes', 'entity', 'all', entityType, entityId] })
    },
  })
}

export function useRegenerateQRCode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, createdBy }: { id: string; createdBy: string }) => regenerateQRCode(id, createdBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qrCodes'] })
    },
  })
}

export function useDeactivateQRCode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deactivateQRCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qrCodes'] })
    },
  })
}

export { generateQRToken, getEntityRoute }