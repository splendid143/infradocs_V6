import { db } from '@/lib/supabase'

export interface QRCode {
  id: string
  entity_type: string
  entity_id: string
  token: string
  created_at: string
  created_by: string
  expires_at: string | null
  is_active: boolean
}

export interface QRCodeWithEntity extends QRCode {
  entity_url?: string
  entity_name?: string
}

const ENTITY_ROUTES: Record<string, string> = {
  sites: '/sites/',
  rooms: '/rooms/',
  racks: '/racks/',
  equipment: '/equipment/',
  patch_panels: '/patch-panels/',
  cables: '/cables/',
}

export function generateQRToken(): string {
  return `qr_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

export function getEntityRoute(entityType: string): string {
  return ENTITY_ROUTES[entityType] || '/'
}

export async function createQRCode(
  entityType: string,
  entityId: string,
  options: {
    expiresAt?: string
    createdBy: string
  }
): Promise<QRCode> {
  const token = generateQRToken()
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const url = `${baseUrl}${getEntityRoute(entityType)}${entityId}`

  const qrData = {
    entity_type: entityType,
    entity_id: entityId,
    token,
    created_by: options.createdBy,
    expires_at: options.expiresAt || null,
    is_active: true,
  }

  const { data, error } = await db
    .from('qr_codes')
    .insert(qrData)
    .select()
    .single()

  if (error) throw new Error(`QR code create failed: ${error.message}`)

  return { ...data, entity_url: url }
}

export async function getQRCodeByToken(token: string): Promise<QRCodeWithEntity | null> {
  const { data, error } = await db
    .from('qr_codes')
    .select('*')
    .eq('token', token)
    .eq('is_active', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`QR code fetch failed: ${error.message}`)
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return null
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const url = `${baseUrl}${getEntityRoute(data.entity_type)}${data.entity_id}`

  return { ...data, entity_url: url }
}

export async function getQRCodeByEntity(entityType: string, entityId: string): Promise<QRCodeWithEntity | null> {
  const { data, error } = await db
    .from('qr_codes')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`QR code fetch failed: ${error.message}`)
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return null
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const url = `${baseUrl}${getEntityRoute(data.entity_type)}${data.entity_id}`

  return { ...data, entity_url: url }
}

export async function regenerateQRCode(id: string, createdBy: string): Promise<QRCode> {
  await db
    .from('qr_codes')
    .update({ is_active: false })
    .eq('id', id)

  const { data: oldQR } = await db
    .from('qr_codes')
    .select('entity_type, entity_id')
    .eq('id', id)
    .single()

  if (!oldQR) throw new Error('QR code not found')

  return createQRCode(oldQR.entity_type, oldQR.entity_id, { createdBy })
}

export async function deactivateQRCode(id: string): Promise<void> {
  const { error } = await db
    .from('qr_codes')
    .update({ is_active: false })
    .eq('id', id)

  if (error) throw new Error(`QR code deactivate failed: ${error.message}`)
}

export async function getQRCodesByEntity(entityType: string, entityId: string): Promise<QRCodeWithEntity[]> {
  const { data, error } = await db
    .from('qr_codes')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`QR codes fetch failed: ${error.message}`)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const route = getEntityRoute(entityType)

  return (data || []).map(qr => ({
    ...qr,
    entity_url: `${baseUrl}${route}${entityId}`,
  }))
}