import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type UserProfile = Database['public']['Tables']['users']['Row']

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName: string, department?: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  updatePassword: (password: string) => Promise<{ error: Error | null }>
  refreshProfile: () => Promise<void>
  isApproved: boolean
  isActive: boolean
  isAdmin: boolean
  isEngineer: boolean
  isViewer: boolean
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('Failed to fetch profile:', error)
      setProfile(null)
    } else {
      setProfile(data)
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? new Error(error.message) : null }
  }

  const signUp = async (email: string, password: string, fullName: string, department?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          department,
        },
      },
    })
    return { error: error ? new Error(error.message) : null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error: error ? new Error(error.message) : null }
  }

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    return { error: error ? new Error(error.message) : null }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  const isApproved = profile?.approval_status === 'APPROVED'
  const isActive = profile?.account_status === 'APPROVED'
  const isAdmin = profile?.role === 'ADMIN'
  const isEngineer = profile?.role === 'ENGINEER'
  const isViewer = profile?.role === 'VIEWER'

  const hasPermission = (permission: string): boolean => {
    if (!isApproved || !isActive) return false
    
    const permissions: Record<string, string[]> = {
      'infrastructure.read': ['ADMIN', 'ENGINEER', 'VIEWER'],
      'infrastructure.create': ['ADMIN', 'ENGINEER'],
      'infrastructure.update': ['ADMIN', 'ENGINEER'],
      'infrastructure.delete': ['ADMIN'],
      'files.upload': ['ADMIN', 'ENGINEER'],
      'files.delete': ['ADMIN', 'ENGINEER'],
      'reports.view': ['ADMIN', 'ENGINEER', 'VIEWER'],
      'users.manage': ['ADMIN'],
      'users.approve': ['ADMIN'],
      'users.roles': ['ADMIN'],
      'audit.view': ['ADMIN'],
    }

    const allowedRoles = permissions[permission]
    if (!allowedRoles) return false
    return allowedRoles.includes(profile?.role ?? '')
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updatePassword,
      refreshProfile,
      isApproved,
      isActive,
      isAdmin,
      isEngineer,
      isViewer,
      hasPermission,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}