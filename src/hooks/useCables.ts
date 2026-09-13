import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCables, getCable, getCableByCableId, getCablesByRack, createCableWithEndpoints, updateCableWithEndpoints, deleteCable, getConnectedCable } from '@/services/cableService'
import type { Cable, CableInsert, CableUpdate, CableWithEndpoints } from '@/services/cableService'

export function useCables(options: {
  page?: number
  pageSize?: number
  siteId?: string
  roomId?: string
  rackId?: string
  patchPanelId?: string
  search?: string
  status?: string
  cableType?: string
} = {}) {
  return useQuery({
    queryKey: ['cables', options],
    queryFn: () => getCables(options),
    staleTime: 1000 * 60 * 5,
  })
}

export function useCable(id: string) {
  return useQuery({
    queryKey: ['cables', id],
    queryFn: () => getCable(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

export function useCableByCableId(cableId: string) {
  return useQuery({
    queryKey: ['cables', 'cableId', cableId],
    queryFn: () => getCableByCableId(cableId),
    enabled: !!cableId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useCablesByRack(rackId: string) {
  return useQuery({
    queryKey: ['cables', 'rack', rackId],
    queryFn: () => getCablesByRack(rackId),
    enabled: !!rackId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useConnectedCable(portType: 'EQUIPMENT_PORT' | 'PATCH_PORT', portId: string) {
  return useQuery({
    queryKey: ['cables', 'connected', portType, portId],
    queryFn: () => getConnectedCable(portType, portId),
    enabled: !!portId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateCable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      cable,
      endpointA,
      endpointB,
    }: {
      cable: CableInsert
      endpointA?: { endpoint_type: 'EQUIPMENT_PORT' | 'PATCH_PORT'; equipment_port_id?: string; patch_port_id?: string } | null
      endpointB?: { endpoint_type: 'EQUIPMENT_PORT' | 'PATCH_PORT'; equipment_port_id?: string; patch_port_id?: string } | null
    }) => createCableWithEndpoints(cable, endpointA, endpointB),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cables'] })
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      queryClient.invalidateQueries({ queryKey: ['patchPanels'] })
      queryClient.invalidateQueries({ queryKey: ['racks'] })
    },
  })
}

export function useUpdateCable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      updates,
      endpointA,
      endpointB,
    }: {
      id: string
      updates: CableUpdate
      endpointA?: { endpoint_type: 'EQUIPMENT_PORT' | 'PATCH_PORT'; equipment_port_id?: string; patch_port_id?: string }
      endpointB?: { endpoint_type: 'EQUIPMENT_PORT' | 'PATCH_PORT'; equipment_port_id?: string; patch_port_id?: string }
    }) => updateCableWithEndpoints(id, updates, endpointA, endpointB),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['cables'] })
      queryClient.invalidateQueries({ queryKey: ['cables', id] })
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      queryClient.invalidateQueries({ queryKey: ['patchPanels'] })
      queryClient.invalidateQueries({ queryKey: ['racks'] })
    },
  })
}

export function useDeleteCable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCable(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cables'] })
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      queryClient.invalidateQueries({ queryKey: ['patchPanels'] })
      queryClient.invalidateQueries({ queryKey: ['racks'] })
    },
  })
}