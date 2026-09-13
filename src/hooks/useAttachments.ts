import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAttachments, getAttachmentsByRecord, uploadAttachment, deleteAttachment, getAttachmentUrl } from '@/services/attachmentService'
import type { Attachment, AttachmentWithUploader } from '@/services/attachmentService'

export function useAttachments(options: {
  page?: number
  pageSize?: number
  recordType?: string
  recordId?: string
  attachmentType?: string
} = {}) {
  return useQuery({
    queryKey: ['attachments', options],
    queryFn: () => getAttachments(options),
    staleTime: 1000 * 60 * 5,
  })
}

export function useAttachmentsByRecord(recordType: string, recordId: string) {
  return useQuery({
    queryKey: ['attachments', recordType, recordId],
    queryFn: () => getAttachmentsByRecord(recordType, recordId),
    enabled: !!recordType && !!recordId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useUploadAttachment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      file,
      recordType,
      recordId,
      options,
    }: {
      file: File
      recordType: string
      recordId: string
      options: { description?: string; documentType?: string; attachmentType: 'PHOTO' | 'DOCUMENT' }
    }) => uploadAttachment(file, recordType, recordId, options),
    onSuccess: (_, { recordType, recordId }) => {
      queryClient.invalidateQueries({ queryKey: ['attachments'] })
      queryClient.invalidateQueries({ queryKey: ['attachments', recordType, recordId] })
    },
  })
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteAttachment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments'] })
    },
  })
}

export function useAttachmentUrl(attachmentType: 'PHOTO' | 'DOCUMENT', storagePath: string) {
  return useQuery({
    queryKey: ['attachmentUrl', attachmentType, storagePath],
    queryFn: () => getAttachmentUrl(attachmentType, storagePath),
    enabled: !!storagePath,
    staleTime: 1000 * 60 * 30,
  })
}