import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../lib/api';
import { Users, UserPlus, UserCheck, UserX, TrendingUp } from 'lucide-react';
import type { User, Pagination } from '../../types';

interface StatsCard {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [agents, setAgents] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allRes, activeRes] = await Promise.all([
          api.get('/admin/agents?limit=5&page=1'),
          api.get('/admin/agents?status=active&limit=1'),
        ]);
        setAgents(allRes.data.data.agents);
        setPagination(allRes.data.data.pagination);
        const total = allRes.data.data.pagination.total;
        const active = activeRes.data.data.pagination.total;
        setStats({ total, active, inactive: total - active });
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards: StatsCard[] = [
    { label: 'Total Agents', value: stats.total, icon: Users, color: 'var(--color-navy)' },
    { label: 'Active Agents', value: stats.active, icon: UserCheck, color: 'var(--color-success)' },
    { label: 'Inactive Agents', value: stats.inactive, icon: UserX, color: 'var(--color-error)' },
    { label: 'System Status', value: 'Operational', icon: TrendingUp, color: 'var(--color-gold)' },
  ];

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        {/* Page Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-navy)' }}>
              Admin Dashboard
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Welcome back, {user?.name}. Here's your system overview.
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/admin/agents/new')}>
            <UserPlus size={15} />
            New Agent
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          {statCards.map((card) => (
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

        {/* Recent Agents */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-navy)' }}>Recent Agents</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>
                {pagination?.total || 0} total agents registered
              </p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/agents')}>
              View All
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            {isLoading ? (
              <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton" style={{ height: '44px', borderRadius: '8px' }} />
                ))}
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Agent Code</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {agents.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2.5rem' }}>
                        No agents found. Create your first agent to get started.
                      </td>
                    </tr>
                  ) : (
                    agents.map((agent) => (
                      <tr key={agent._id} className="animate-fade-in">
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
                              style={{ background: 'var(--color-navy)', color: '#fff' }}>
                              {agent.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 500, color: 'var(--color-navy)' }}>{agent.name}</div>
                              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>{agent.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${agent.isActive ? 'badge-success' : 'badge-danger'}`}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                            {agent.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                          {agent.createdAt ? new Date(agent.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td>
                          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/admin/agents/${agent._id}`)}>
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

export default AdminDashboard;
