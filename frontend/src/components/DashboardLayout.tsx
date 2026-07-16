import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, UserPlus, FileText, Search,
  LogOut, Menu, X, Shield, Briefcase, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
}

const adminNavItems: NavItem[] = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
  { label: 'Manage Agents', to: '/admin/agents', icon: Users },
  { label: 'Create Agent', to: '/admin/agents/new', icon: UserPlus },
];

const agentNavItems: NavItem[] = [
  { label: 'Dashboard', to: '/agent', icon: LayoutDashboard },
  { label: 'My Customers', to: '/agent/customers', icon: Users },
  { label: 'Onboard Customer', to: '/agent/customers/new', icon: UserPlus },
  { label: 'My Policies', to: '/agent/policies', icon: FileText },
  { label: 'Search Customer', to: '/agent/search', icon: Search },
];

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = user?.role === 'admin' ? adminNavItems : agentNavItems;

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(13,27,42,0.6)', backdropFilter: 'blur(3px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          width: '240px',
          background: 'var(--color-navy)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      >
        {/* Logo area */}
        <div style={{ padding: '1.5rem 1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg"
              style={{ background: 'var(--color-burgundy)' }}>
              <Shield size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#fff', fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.2 }}>HDFC Life</div>
              <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Policy Portal</div>
            </div>
          </div>
        </div>

        {/* Role badge */}
        <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-full"
              style={{ background: 'var(--color-burgundy)', fontSize: '0.6875rem', color: '#fff', fontWeight: 700 }}>
              {initials}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </div>
              <div className="flex items-center gap-1" style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.45)' }}>
                {user?.role === 'admin' ? <Shield size={10} /> : <Briefcase size={10} />}
                {user?.role === 'admin' ? 'Administrator' : `Agent · ${user?.agentCode || ''}`}
              </div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ padding: '1rem 0.875rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem', paddingLeft: '0.25rem' }}>
            Navigation
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin' || item.to === '/agent'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={16} />
              <span style={{ flex: 1 }}>{item.label}</span>
              <ChevronRight size={13} style={{ opacity: 0.3 }} />
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '1rem 0.875rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            className="nav-item w-full"
            onClick={handleLogout}
            style={{ color: 'rgba(255,100,100,0.8)' }}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar */}
        <header style={{
          height: '56px',
          background: '#ffffff',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 1.5rem',
          gap: '1rem',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}>
          <button
            className="btn btn-ghost btn-icon lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div className="flex items-center gap-2" style={{ marginLeft: 'auto' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Session: <span style={{ color: 'var(--color-warning)', fontWeight: 500 }}>15 min</span>
            </div>
            <div style={{ width: '1px', height: '20px', background: 'var(--color-border)' }} />
            <div style={{
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}>
              {user?.role === 'admin' ? (
                <><Shield size={13} style={{ color: 'var(--color-burgundy)' }} /> Admin</>
              ) : (
                <><Briefcase size={13} style={{ color: 'var(--color-burgundy)' }} /> Agent</>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '1.75rem 1.5rem', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
