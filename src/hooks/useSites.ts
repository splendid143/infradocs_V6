import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSites, getSite, getSiteBySiteId, getAllSites, createSite, updateSite, deleteSite } from '@/services/siteService'
import type { Site, SiteInsert, SiteUpdate, SiteWithCounts } from '@/services/siteService'

export function useSites(options: {
  page?: number
  pageSize?: number
  search?: string
  status?: string
} = {}) {
  return useQuery({
    queryKey: ['sites', options],
    queryFn: () => getSites(options),
    staleTime: 1000 * 60 * 5,
  })
}

export function useSite(id: string) {
  return useQuery({
    queryKey: ['sites', id],
    queryFn: () => getSite(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

export function useSiteBySiteId(siteId: string) {
  return useQuery({
    queryKey: ['sites', 'siteId', siteId],
    queryFn: () => getSiteBySiteId(siteId),
    enabled: !!siteId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useAllSites() {
  return useQuery({
    queryKey: ['sites', 'all'],
    queryFn: getAllSites,
    staleTime: 1000 * 60 * 10,
  })
}

export function useCreateSite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (site: SiteInsert) => createSite(site),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
    },
  })
}

export function useUpdateSite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: SiteUpdate }) => updateSite(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
      queryClient.invalidateQueries({ queryKey: ['sites', id] })
    },
  })
}

export function useDeleteSite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteSite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
    },
  })
}