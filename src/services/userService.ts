import { db } from '@/lib/supabase'
import { fetchPaginated, fetchOne, updateRecord } from './baseService'

export interface User {
  id: string
  user_code: string
  name: string
  email: string
  role: 'ADMIN' | 'ENGINEER' | 'VIEWER'
  account_status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISABLED'
  approval_status: 'PENDING' | 'APPROVED' | 'REJECTED'
  is_active: boolean
  department: string | null
  created_at: string
  approved_at: string | null
  approved_by: string | null
  disabled_at: string | null
  disabled_by: string | null
  last_login_at: string | null
}

export interface UserUpdate extends Partial<Omit<User, 'id' | 'created_at'>> {}

export interface UserWithDetails extends User {
  approved_by_name?: string
  disabled_by_name?: string
}

export async function getUsers(options: {
  page?: number
  pageSize?: number
  search?: string
  role?: string
  approvalStatus?: string
  accountStatus?: string
} = {}): Promise<{ data: UserWithDetails[]; count: number }> {
  const { page = 1, pageSize = 25, search, role, approvalStatus, accountStatus } = options

  let query = db.from('users').select('*, approved_by_user:users!approved_by(name), disabled_by_user:users!disabled_by(name)', { count: 'exact' })

  if (search) {
    query = query.or(`user_code.ilike.%${search}%,name.ilike.%${search}%,email.ilike.%${search}%,department.ilike.%${search}%`)
  }

  if (role) query = query.eq('role', role)
  if (approvalStatus) query = query.eq('approval_status', approvalStatus)
  if (accountStatus) query = query.eq('account_status', accountStatus)

  query = query.order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  const { data, error, count } = await query

  if (error) throw new Error(`Users fetch failed: ${error.message}`)

  const usersWithDetails = (data || []).map(user => ({
    ...user,
    approved_by_name: user.approved_by_user?.name,
    disabled_by_name: user.disabled_by_user?.name,
  }))

  return { data: usersWithDetails, count: count || 0 }
}

export async function getUser(id: string): Promise<UserWithDetails | null> {
  const { data, error } = await db
    .from('users')
    .select('*, approved_by_user:users!approved_by(name), disabled_by_user:users!disabled_by(name)')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`User fetch failed: ${error.message}`)
  }

  return {
    ...data,
    approved_by_name: data.approved_by_user?.name,
    disabled_by_name: data.disabled_by_user?.name,
  }
}

export async function approveUser(id: string, role: 'ENGINEER' | 'VIEWER' | 'ADMIN', approvedBy: string): Promise<User> {
  return updateRecord<User, UserUpdate>('users', id, {
    role,
    approval_status: 'APPROVED',
    account_status: 'APPROVED',
    is_active: true,
    approved_at: new Date().toISOString(),
    approved_by: approvedBy,
  })
}

export async function rejectUser(id: string): Promise<User> {
  return updateRecord<User, UserUpdate>('users', id, {
    approval_status: 'REJECTED',
    account_status: 'REJECTED',
    is_active: false,
  })
}

export async function disableUser(id: string, disabledBy: string): Promise<User> {
  return updateRecord<User, UserUpdate>('users', id, {
    account_status: 'DISABLED',
    is_active: false,
    disabled_at: new Date().toISOString(),
    disabled_by: disabledBy,
  })
}

export async function reactivateUser(id: string): Promise<User> {
  return updateRecord<User, UserUpdate>('users', id, {
    account_status: 'APPROVED',
    is_active: true,
    disabled_at: null,
    disabled_by: null,
  })
}

export async function changeUserRole(id: string, role: 'ENGINEER' | 'VIEWER' | 'ADMIN'): Promise<User> {
  return updateRecord<User, UserUpdate>('users', id, { role })
}

export async function updateLastLogin(id: string): Promise<void> {
  await db
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', id)
}