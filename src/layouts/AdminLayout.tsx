import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Menu, X, ChevronDown, User, Shield, FileText, Settings, LogOut, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { clsx } from 'clsx'

const adminNavigation = [
  { name: 'All Users', href: '/admin/users', icon: User },
  { name: 'Pending Approval', href: '/admin/users/pending', icon: Shield },
  { name: 'Audit Log', href: '/admin/audit', icon: FileText },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export function AdminLayout() {
  const { user, profile, signOut, isAdmin } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-surface-200 transform transition-transform duration-200 lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-surface-200">
            <div className="flex items-center gap-2">
              <NavLink to="/dashboard" className="p-2 rounded-lg text-surface-500 hover:bg-surface-100">
                <ArrowLeft className="h-5 w-5" />
              </NavLink>
              <span className="text-xl font-bold text-surface-900">Admin Portal</span>
            </div>
            <button
              className="lg:hidden p-2 rounded-lg text-surface-500 hover:bg-surface-100"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4 overflow-y-auto" aria-label="Admin navigation">
            {adminNavigation.map((item) => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/')
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={clsx(
                    'sidebar-link',
                    isActive && 'sidebar-link-active'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  {item.name}
                </NavLink>
              )
            })}
          </nav>

          {/* User Info */}
          <div className="border-t border-surface-200 p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-900 truncate">
                  {profile?.name || user?.email}
                </p>
                <p className="text-xs text-red-600">Administrator</p>
              </div>
              <button
                className="p-2 rounded-lg text-surface-500 hover:bg-surface-100"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
              >
                <ChevronDown className={clsx('h-4 w-4', userMenuOpen && 'rotate-180')} />
              </button>
            </div>

            {/* User Menu Dropdown */}
            {userMenuOpen && (
              <div className="mt-2 rounded-lg border border-surface-200 bg-white py-1 shadow-lg animate-in fade-in-0 zoom-in-95">
                <NavLink
                  to="/dashboard"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-surface-700 hover:bg-surface-50"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to App
                </NavLink>
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-surface-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-surface-200 bg-white px-4 lg:px-6">
          <button
            className="lg:hidden p-2 rounded-lg text-surface-500 hover:bg-surface-100"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex-1" />
          
          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-sm text-surface-500">
              {profile?.user_code}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}