import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getEquipment, getEquipmentItem, getEquipmentByRack, createEquipment, updateEquipment, deleteEquipment,
  getPortsForEquipment, createEquipmentPort, updateEquipmentPort, deleteEquipmentPort,
} from '@/services/equipmentService'
import type { Equipment, EquipmentInsert, EquipmentUpdate, EquipmentWithCounts, EquipmentPortInsert, EquipmentPortUpdate } from '@/services/equipmentService'

export function useEquipment(options: {
  page?: number
  pageSize?: number
  siteId?: string
  roomId?: string
  rackId?: string
  search?: string
  status?: string
} = {}) {
  return useQuery({
    queryKey: ['equipment', options],
    queryFn: () => getEquipment(options),
    staleTime: 1000 * 60 * 5,
  })
}

export function useEquipmentItem(id: string) {
  return useQuery({
    queryKey: ['equipment', id],
    queryFn: () => getEquipmentItem(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

export function useEquipmentByRack(rackId: string) {
  return useQuery({
    queryKey: ['equipment', 'rack', rackId],
    queryFn: () => getEquipmentByRack(rackId),
    enabled: !!rackId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateEquipment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (equipment: EquipmentInsert) => createEquipment(equipment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      queryClient.invalidateQueries({ queryKey: ['racks'] })
    },
  })
}

export function useUpdateEquipment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: EquipmentUpdate }) => updateEquipment(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      queryClient.invalidateQueries({ queryKey: ['equipment', id] })
      queryClient.invalidateQueries({ queryKey: ['racks'] })
    },
  })
}

export function useDeleteEquipment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteEquipment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      queryClient.invalidateQueries({ queryKey: ['racks'] })
    },
  })
}

// ============================================
// EQUIPMENT PORTS
// ============================================

export function useEquipmentPorts(equipmentId: string) {
  return useQuery({
    queryKey: ['equipmentPorts', equipmentId],
    queryFn: () => getPortsForEquipment(equipmentId),
    enabled: !!equipmentId,
    staleTime: 1000 * 60,
  })
}

export function useCreateEquipmentPort() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (port: EquipmentPortInsert) => createEquipmentPort(port),
    onSuccess: (_, port) => {
      queryClient.invalidateQueries({ queryKey: ['equipmentPorts', port.equipment_id] })
      queryClient.invalidateQueries({ queryKey: ['equipment', port.equipment_id] })
    },
  })
}

export function useUpdateEquipmentPort() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, equipmentId, updates }: { id: string; equipmentId: string; updates: EquipmentPortUpdate }) =>
      updateEquipmentPort(id, updates),
    onSuccess: (_, { equipmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['equipmentPorts', equipmentId] })
    },
  })
}

export function useDeleteEquipmentPort() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string; equipmentId: string }) => deleteEquipmentPort(id),
    onSuccess: (_, { equipmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['equipmentPorts', equipmentId] })
      queryClient.invalidateQueries({ queryKey: ['equipment', equipmentId] })
    },
  })
}