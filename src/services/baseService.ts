import { db } from '@/lib/supabase'

export interface PaginatedResult<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
}

export interface QueryOptions {
  page?: number
  pageSize?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
  filters?: Record<string, unknown>
}

// Dynamic table name – cast to avoid db-js requiring literal table keys
function fromTable(table: string) {
  return (db as any).from(table)
}

export async function fetchPaginated<T>(
  table: string,
  options: QueryOptions = {}
): Promise<PaginatedResult<T>> {
  let query = fromTable(table).select('*', { count: 'exact' })

  if (options.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query = query.eq(key, value)
      }
    })
  }

  const orderBy = options.orderBy || 'created_at'
  const orderDirection = options.orderDirection || 'desc'
  query = query.order(orderBy, { ascending: orderDirection === 'asc' })

  const page = options.page || 1
  const pageSize = options.pageSize || 25
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw new Error(`${table} fetch failed: ${error.message}`)
  }

  return {
    data: (data as T[]) || [],
    count: count || 0,
    page: options.page || 1,
    pageSize: options.pageSize || 25,
  }
}

export async function fetchOne<T>(
  table: string,
  id: string
): Promise<T | null> {
  const { data, error } = await fromTable(table)
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`${table} fetch failed: ${error.message}`)
  }

  return data as T
}

export async function fetchByField<T>(
  table: string,
  field: string,
  value: string
): Promise<T | null> {
  const { data, error } = await fromTable(table)
    .select('*')
    .eq(field, value)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`${table} fetch failed: ${error.message}`)
  }

  return data as T
}

export async function createRecord<T, InsertType>(
  table: string,
  record: InsertType
): Promise<T> {
  const { data, error } = await fromTable(table)
    .insert(record)
    .select()
    .single()

  if (error) {
    throw new Error(`${table} create failed: ${error.message}`)
  }

  return data as T
}

export async function updateRecord<T, UpdateType>(
  table: string,
  id: string,
  updates: UpdateType
): Promise<T> {
  const { data, error } = await fromTable(table)
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`${table} update failed: ${error.message}`)
  }

  return data as T
}

export async function deleteRecord(table: string, id: string): Promise<void> {
  const { error } = await fromTable(table).delete().eq('id', id)
  if (error) {
    throw new Error(`${table} delete failed: ${error.message}`)
  }
}

export async function fetchAll<T>(
  table: string,
  options: Omit<QueryOptions, 'page' | 'pageSize'> = {}
): Promise<T[]> {
  let query = fromTable(table).select('*')

  if (options.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query = query.eq(key, value)
      }
    })
  }

  const orderBy = options.orderBy || 'created_at'
  const orderDirection = options.orderDirection || 'desc'
  query = query.order(orderBy, { ascending: orderDirection === 'asc' })

  const { data, error } = await query

  if (error) {
    throw new Error(`${table} fetch failed: ${error.message}`)
  }

  return (data as T[]) || []
}
