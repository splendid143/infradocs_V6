import { useQuery } from '@tanstack/react-query'
import { globalSearch } from '@/services/searchService'
import type { SearchResult } from '@/services/searchService'

export function useGlobalSearch(query: string, enabled = true) {
  return useQuery<SearchResult[]>({
    queryKey: ['search', query],
    queryFn: () => globalSearch(query),
    enabled: enabled && query.trim().length > 0,
    staleTime: 1000 * 30,
  })
}