import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPatchPanels, getPatchPanel, getPatchPanelsByRack, createPatchPanel, updatePatchPanel, deletePatchPanel } from '@/services/patchPanelService'
import type { PatchPanel, PatchPanelInsert, PatchPanelUpdate, PatchPanelWithCounts } from '@/services/patchPanelService'

export function usePatchPanels(options: {
  page?: number
  pageSize?: number
  siteId?: string
  roomId?: string
  rackId?: string
  search?: string
  status?: string
} = {}) {
  return useQuery({
    queryKey: ['patchPanels', options],
    queryFn: () => getPatchPanels(options),
    staleTime: 1000 * 60 * 5,
  })
}

export function usePatchPanel(id: string) {
  return useQuery({
    queryKey: ['patchPanels', id],
    queryFn: () => getPatchPanel(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

export function usePatchPanelsByRack(rackId: string) {
  return useQuery({
    queryKey: ['patchPanels', 'rack', rackId],
    queryFn: () => getPatchPanelsByRack(rackId),
    enabled: !!rackId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreatePatchPanel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (panel: PatchPanelInsert) => createPatchPanel(panel),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patchPanels'] })
      queryClient.invalidateQueries({ queryKey: ['racks'] })
    },
  })
}

export function useUpdatePatchPanel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: PatchPanelUpdate }) => updatePatchPanel(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['patchPanels'] })
      queryClient.invalidateQueries({ queryKey: ['patchPanels', id] })
      queryClient.invalidateQueries({ queryKey: ['racks'] })
    },
  })
}

export function useDeletePatchPanel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePatchPanel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patchPanels'] })
      queryClient.invalidateQueries({ queryKey: ['racks'] })
    },
  })
}