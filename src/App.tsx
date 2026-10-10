/**
 * App — routing graph.
 *
 *   /login                 public (credentials -> MFA steps)
 *   ProtectedRoute wraps everything else:
 *     /            Dashboard
 *     /users       Users directory + moderation actions
 *     /reports     Moderation queue + conversation evidence
 *     /audit       Append-only audit log
 *     /support     Complaints & feedback inbox (backend pending)
 *     /settings    Session info + admin lifecycle
 */
import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/auth/Login';
import { DashboardPage } from './pages/dashboard/Dashboard';
import { UsersPage } from './pages/users/UsersPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { AuditLogPage } from './pages/audit/AuditLogPage';
import { SupportPage } from './pages/support/SupportPage';
import { SettingsPage } from './pages/settings/SettingsPage';

const App: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/audit" element={<AuditLogPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

export default App;
