import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { AppLayout } from '@/layouts/AppLayout'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { SignupPage } from '@/features/auth/pages/SignupPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { PendingApprovalPage } from '@/features/auth/pages/PendingApprovalPage'
import { AccountDisabledPage } from '@/features/auth/pages/AccountDisabledPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { SitesPage } from '@/features/sites/pages/SitesPage'
import { SiteDetailPage } from '@/features/sites/pages/SiteDetailPage'
import { RoomsPage } from '@/features/rooms/pages/RoomsPage'
import { RoomDetailPage } from '@/features/rooms/pages/RoomDetailPage'
import { RacksPage } from '@/features/racks/pages/RacksPage'
import { RackDetailPage } from '@/features/racks/pages/RackDetailPage'
import { EquipmentPage } from '@/features/equipment/pages/EquipmentPage'
import { EquipmentDetailPage } from '@/features/equipment/pages/EquipmentDetailPage'
import { PatchPanelsPage } from '@/features/patch-panels/pages/PatchPanelsPage'
import { PatchPanelDetailPage } from '@/features/patch-panels/pages/PatchPanelDetailPage'
import { CablesPage } from '@/features/cables/pages/CablesPage'
import { CableDetailPage } from '@/features/cables/pages/CableDetailPage'
import { CableNewPage } from '@/features/cables/pages/CableNewPage'
import { CableEditPage } from '@/features/cables/pages/CableEditPage'
import { SearchPage } from '@/features/search/pages/SearchPage'
import { QRPage } from '@/features/qr/pages/QRPage'
import { ReportsPage } from '@/features/reports/pages/ReportsPage'
import { IssuesPage } from '@/features/issues/pages/IssuesPage'
import { AdminLayout } from '@/layouts/AdminLayout'
import { AdminUsersPage } from '@/features/users/pages/AdminUsersPage'
import { AdminPendingUsersPage } from '@/features/users/pages/AdminPendingUsersPage'
import { AdminUserDetailPage } from '@/features/users/pages/AdminUserDetailPage'
import { AdminAuditPage } from '@/features/audit/pages/AdminAuditPage'
import { AdminSettingsPage } from '@/features/users/pages/AdminSettingsPage'
import { ProtectedRoute, AdminRoute } from '@/components/auth/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/pending-approval" element={<PendingApprovalPage />} />
        <Route path="/account-disabled" element={<AccountDisabledPage />} />
        
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          
          <Route path="/sites" element={<SitesPage />} />
          <Route path="/sites/:id" element={<SiteDetailPage />} />
          
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/rooms/:id" element={<RoomDetailPage />} />
          
          <Route path="/racks" element={<RacksPage />} />
          <Route path="/racks/:id" element={<RackDetailPage />} />
          
          <Route path="/equipment" element={<EquipmentPage />} />
          <Route path="/equipment/:id" element={<EquipmentDetailPage />} />
          
          <Route path="/patch-panels" element={<PatchPanelsPage />} />
          <Route path="/patch-panels/:id" element={<PatchPanelDetailPage />} />
          
          <Route path="/cables" element={<CablesPage />} />
          <Route path="/cables/:id" element={<CableDetailPage />} />
          <Route path="/cables/new" element={<CableNewPage />} />
          <Route path="/cables/:id/edit" element={<CableEditPage />} />
          
          <Route path="/search" element={<SearchPage />} />
          <Route path="/qr" element={<QRPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/issues" element={<IssuesPage />} />
        </Route>
        
        <Route element={<ProtectedRoute><AdminRoute><AdminLayout /></AdminRoute></ProtectedRoute>}>
          <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/users/pending" element={<AdminPendingUsersPage />} />
          <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
          <Route path="/admin/audit" element={<AdminAuditPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App