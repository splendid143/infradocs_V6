import { db } from '@/lib/supabase'
import { createRecord, deleteRecord } from './baseService'

export interface Attachment {
  id: string
  record_type: string
  record_id: string
  file_name: string
  storage_path: string
  mime_type: string
  size_bytes: number
  uploaded_by: string
  uploaded_at: string
  description: string | null
  document_type: string | null
  attachment_type: 'PHOTO' | 'DOCUMENT'
}

export interface AttachmentInsert extends Omit<Attachment, 'id' | 'uploaded_at'> {}

export interface AttachmentWithUploader extends Attachment {
  uploader_name?: string
  uploader_email?: string
}

export async function getAttachments(options: {
  page?: number
  pageSize?: number
  recordType?: string
  recordId?: string
  attachmentType?: string
} = {}): Promise<{ data: AttachmentWithUploader[]; count: number }> {
  const { page = 1, pageSize = 25, recordType, recordId, attachmentType } = options

  let query = db.from('attachments').select('*, uploader:users(name, email)', { count: 'exact' })

  if (recordType) query = query.eq('record_type', recordType)
  if (recordId) query = query.eq('record_id', recordId)
  if (attachmentType) query = query.eq('attachment_type', attachmentType)

  query = query.order('uploaded_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  const { data, error, count } = await query

  if (error) throw new Error(`Attachments fetch failed: ${error.message}`)

  const attachmentsWithUploader = (data || []).map(att => ({
    ...att,
    uploader_name: att.uploader?.name,
    uploader_email: att.uploader?.email,
  }))

  return { data: attachmentsWithUploader, count: count || 0 }
}

export async function getAttachmentsByRecord(recordType: string, recordId: string): Promise<AttachmentWithUploader[]> {
  const { data, error } = await db
    .from('attachments')
    .select('*, uploader:users(name, email)')
    .eq('record_type', recordType)
    .eq('record_id', recordId)
    .order('uploaded_at', { ascending: false })

  if (error) throw new Error(`Attachments fetch failed: ${error.message}`)

  return (data || []).map(att => ({
    ...att,
    uploader_name: att.uploader?.name,
    uploader_email: att.uploader?.email,
  }))
}

export async function uploadAttachment(
  file: File,
  recordType: string,
  recordId: string,
  options: {
    description?: string
    documentType?: string
    attachmentType: 'PHOTO' | 'DOCUMENT'
  }
): Promise<Attachment> {
  const bucket = options.attachmentType === 'PHOTO' ? 'infrastructure-photos' : 'infrastructure-documents'
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  const storagePath = `${recordType}s/${recordId}/${fileName}`

  const { error: uploadError } = await db.storage
    .from(bucket)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

  const { data: userData } = await db.auth.getUser()
  
  const attachmentData: AttachmentInsert = {
    record_type: recordType,
    record_id: recordId,
    file_name: file.name,
    storage_path: storagePath,
    mime_type: file.type,
    size_bytes: file.size,
    uploaded_by: userData.user?.id || '',
    description: options.description,
    document_type: options.documentType || null,
    attachment_type: options.attachmentType,
  }

  return createRecord<Attachment, AttachmentInsert>('attachments', attachmentData)
}

export async function deleteAttachment(id: string): Promise<void> {
  const { data: attachment } = await db
    .from('attachments')
    .select('storage_path, attachment_type')
    .eq('id', id)
    .single()

  if (attachment) {
    const bucket = attachment.attachment_type === 'PHOTO' ? 'infrastructure-photos' : 'infrastructure-documents'
    await db.storage.from(bucket).remove([attachment.storage_path])
  }

  return deleteRecord('attachments', id)
}

export async function getAttachmentUrl(attachmentType: 'PHOTO' | 'DOCUMENT', storagePath: string): Promise<string> {
  const bucket = attachmentType === 'PHOTO' ? 'infrastructure-photos' : 'infrastructure-documents'
  const { data } = await db.storage.from(bucket).createSignedUrl(storagePath, 3600)
  if (!data?.signedUrl) throw new Error('Failed to create signed URL')
  return data.signedUrl
}