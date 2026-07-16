import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AgentListPage from './pages/admin/AgentListPage';
import CreateAgentPage from './pages/admin/CreateAgentPage';
import AgentProfilePage from './pages/admin/AgentProfilePage';
import AgentDashboard from './pages/agent/AgentDashboard';
import CustomerListPage from './pages/agent/CustomerListPage';
import CreateCustomerPage from './pages/agent/CreateCustomerPage';
import CustomerSearchPage from './pages/agent/CustomerSearchPage';
import PolicyListPage from './pages/agent/PolicyListPage';
import IssuePolicyPage from './pages/agent/IssuePolicyPage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          gutter={8}
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.875rem',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            },
            success: {
              iconTheme: { primary: '#0F7A4B', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#B91C1C', secondary: '#fff' },
            },
          }}
        />

        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/agents" element={<AgentListPage />} />
            <Route path="/admin/agents/new" element={<CreateAgentPage />} />
            <Route path="/admin/agents/:id" element={<AgentProfilePage />} />
          </Route>

          {/* Agent Routes */}
          <Route element={<ProtectedRoute allowedRoles={['agent']} />}>
            <Route path="/agent" element={<AgentDashboard />} />
            <Route path="/agent/customers" element={<CustomerListPage />} />
            <Route path="/agent/customers/new" element={<CreateCustomerPage />} />
            <Route path="/agent/search" element={<CustomerSearchPage />} />
            <Route path="/agent/policies" element={<PolicyListPage />} />
            <Route path="/agent/policies/issue" element={<IssuePolicyPage />} />
          </Route>

          {/* Fallback — redirect to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
