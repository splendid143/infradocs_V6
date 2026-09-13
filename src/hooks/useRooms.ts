import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRooms, getRoom, getRoomsBySite, createRoom, updateRoom, deleteRoom } from '@/services/roomService'
import type { Room, RoomInsert, RoomUpdate, RoomWithCounts } from '@/services/roomService'

export function useRooms(options: {
  page?: number
  pageSize?: number
  siteId?: string
  search?: string
  status?: string
} = {}) {
  return useQuery({
    queryKey: ['rooms', options],
    queryFn: () => getRooms(options),
    staleTime: 1000 * 60 * 5,
  })
}

export function useRoom(id: string) {
  return useQuery({
    queryKey: ['rooms', id],
    queryFn: () => getRoom(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

export function useRoomsBySite(siteId: string) {
  return useQuery({
    queryKey: ['rooms', 'site', siteId],
    queryFn: () => getRoomsBySite(siteId),
    enabled: !!siteId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateRoom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (room: RoomInsert) => createRoom(room),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      queryClient.invalidateQueries({ queryKey: ['sites'] })
    },
  })
}

export function useUpdateRoom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: RoomUpdate }) => updateRoom(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      queryClient.invalidateQueries({ queryKey: ['rooms', id] })
      queryClient.invalidateQueries({ queryKey: ['sites'] })
    },
  })
}

export function useDeleteRoom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteRoom(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      queryClient.invalidateQueries({ queryKey: ['sites'] })
    },
  })
}