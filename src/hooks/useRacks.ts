import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRacks, getRack, getRacksByRoom, createRack, updateRack, deleteRack } from '@/services/rackService'
import type { Rack, RackInsert, RackUpdate, RackWithCounts } from '@/services/rackService'

export function useRacks(options: {
  page?: number
  pageSize?: number
  siteId?: string
  roomId?: string
  search?: string
  status?: string
} = {}) {
  return useQuery({
    queryKey: ['racks', options],
    queryFn: () => getRacks(options),
    staleTime: 1000 * 60 * 5,
  })
}

export function useRack(id: string) {
  return useQuery({
    queryKey: ['racks', id],
    queryFn: () => getRack(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

export function useRacksByRoom(roomId: string) {
  return useQuery({
    queryKey: ['racks', 'room', roomId],
    queryFn: () => getRacksByRoom(roomId),
    enabled: !!roomId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateRack() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (rack: RackInsert) => createRack(rack),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['racks'] })
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
  })
}

export function useUpdateRack() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: RackUpdate }) => updateRack(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['racks'] })
      queryClient.invalidateQueries({ queryKey: ['racks', id] })
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
  })
}

export function useDeleteRack() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteRack(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['racks'] })
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
  })
}