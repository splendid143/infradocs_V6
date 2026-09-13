import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsers, getUser, approveUser, rejectUser, disableUser, reactivateUser, changeUserRole, updateLastLogin } from '@/services/userService'
import type { User, UserWithDetails } from '@/services/userService'

export function useUsers(options: {
  page?: number
  pageSize?: number
  search?: string
  role?: string
  approvalStatus?: string
  accountStatus?: string
} = {}) {
  return useQuery({
    queryKey: ['users', options],
    queryFn: () => getUsers(options),
    staleTime: 1000 * 60 * 5,
  })
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => getUser(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

export function useApproveUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, role, approvedBy }: { id: string; role: 'ENGINEER' | 'VIEWER' | 'ADMIN'; approvedBy: string }) =>
      approveUser(id, role, approvedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useRejectUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => rejectUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useDisableUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, disabledBy }: { id: string; disabledBy: string }) => disableUser(id, disabledBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useReactivateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => reactivateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useChangeUserRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'ENGINEER' | 'VIEWER' | 'ADMIN' }) => changeUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useUpdateLastLogin() {
  return useMutation({
    mutationFn: (id: string) => updateLastLogin(id),
  })
}