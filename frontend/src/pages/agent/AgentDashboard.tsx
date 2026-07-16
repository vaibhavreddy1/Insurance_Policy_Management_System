import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../lib/api';
import { Users, FileText, UserPlus, Search, TrendingUp } from 'lucide-react';

const AgentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ customers: 0, policies: 0, activePolicies: 0 });
  const [recentCustomers, setRecentCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, polRes] = await Promise.all([
          api.get('/customers?limit=5&page=1'),
          api.get('/policies?limit=1&status=Active'),
        ]);
        setRecentCustomers(custRes.data.data.customers);
        setStats({
          customers: custRes.data.data.pagination.total,
          policies: polRes.data.data.pagination?.total || 0,
          activePolicies: polRes.data.data.pagination?.total || 0,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const quickActions = [
    { label: 'Onboard Customer', icon: UserPlus, action: () => navigate('/agent/customers/new'), color: 'var(--color-burgundy)' },
    { label: 'Search Customer', icon: Search, action: () => navigate('/agent/search'), color: 'var(--color-navy)' },
    { label: 'Issue Policy', icon: FileText, action: () => navigate('/agent/policies/issue'), color: 'var(--color-gold)' },
    { label: 'My Customers', icon: Users, action: () => navigate('/agent/customers'), color: 'var(--color-success)' },
  ];

  const statCards = [
    { label: 'My Customers', value: stats.customers, icon: Users, color: 'var(--color-navy)' },
    { label: 'Active Policies', value: stats.activePolicies, icon: FileText, color: 'var(--color-success)' },
    { label: 'Agent Code', value: user?.agentCode || '—', icon: TrendingUp, color: 'var(--color-gold)' },
  ];

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-navy)' }}>
              Agent Dashboard
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Welcome, {user?.name}. Manage your customers and policies below.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {statCards.map(card => (
            <div key={card.label} className="stat-card">
              <div className="flex items-start justify-between">
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {card.label}
                  </p>
                  <p style={{ fontSize: '1.75rem', fontWeight: 700, color: card.color, marginTop: '0.375rem', fontFamily: "'Space Grotesk', sans-serif" }}>
                    {isLoading ? '—' : card.value}
                  </p>
                </div>
                <div className="flex items-center justify-center w-9 h-9 rounded-lg"
                  style={{ background: `${card.color}15` }}>
                  <card.icon size={18} style={{ color: card.color }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="card mb-6">
          <div className="card-header">
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Quick Actions</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickActions.map(action => (
                <button
                  key={action.label}
                  onClick={action.action}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border transition-all"
                  style={{
                    background: 'var(--color-surface-alt)',
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = '#fff';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-alt)';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  }}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg"
                    style={{ background: `${action.color}15` }}>
                    <action.icon size={20} style={{ color: action.color }} />
                  </div>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-navy)', textAlign: 'center' }}>
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Customers */}
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Recent Customers</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/agent/customers')}>
              View All
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            {isLoading ? (
              <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '44px', borderRadius: '8px' }} />)}
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Mobile</th>
                    <th>Aadhaar</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recentCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2.5rem' }}>
                        No customers yet. <button className="btn btn-ghost btn-sm" onClick={() => navigate('/agent/customers/new')}>Onboard your first customer →</button>
                      </td>
                    </tr>
                  ) : (
                    recentCustomers.map((c: any) => (
                      <tr key={c._id}>
                        <td style={{ fontWeight: 500 }}>{c.firstName} {c.lastName}</td>
                        <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>{c.email}</td>
                        <td><span className="pii-tag">{c.mobile}</span></td>
                        <td><span className="pii-tag">{c.aadhaar}</span></td>
                        <td>
                          <span className={`badge ${c.isActive ? 'badge-success' : 'badge-danger'}`}>
                            {c.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/agent/customers/${c._id}`)}>
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AgentDashboard;
