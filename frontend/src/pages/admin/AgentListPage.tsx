import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../lib/api';
import { UserPlus, Search, Filter, UserX, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { User, Pagination } from '../../types';

const AgentListPage: React.FC = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);

      const res = await api.get(`/admin/agents?${params}`);
      setAgents(res.data.data.agents);
      setPagination(res.data.data.pagination);
    } catch (err) {
      toast.error('Failed to load agents');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleDeactivate = async (agentId: string) => {
    setDeactivatingId(agentId);
    try {
      await api.delete(`/admin/agents/${agentId}`);
      toast.success('Agent deactivated successfully');
      setConfirmId(null);
      fetchAgents();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Deactivation failed');
    } finally {
      setDeactivatingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        {/* Confirm modal */}
        {confirmId && (
          <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: '400px' }}>
              <div className="modal-header">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-navy)' }}>Confirm Deactivation</h3>
              </div>
              <div className="modal-body">
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  Are you sure you want to deactivate this agent? They will immediately lose access to the system. This action can be reviewed but not automatically reversed.
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setConfirmId(null)}>Cancel</button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDeactivate(confirmId)}
                  disabled={!!deactivatingId}
                >
                  {deactivatingId === confirmId ? 'Deactivating…' : 'Yes, Deactivate'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-navy)' }}>Agent Management</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {pagination?.total || 0} agents registered in the system
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/admin/agents/new')}>
            <UserPlus size={15} />
            New Agent
          </button>
        </div>

        {/* Filters */}
        <div className="card mb-5">
          <div className="card-body" style={{ padding: '1rem 1.25rem' }}>
            <div className="flex flex-wrap gap-3">
              <div style={{ position: 'relative', flex: '1 1 220px' }}>
                <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  id="agent-search"
                  type="text"
                  placeholder="Search by name, email, or code…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="form-input"
                  style={{ paddingLeft: '2.25rem' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={14} style={{ color: 'var(--color-text-muted)' }} />
                <select
                  id="agent-status-filter"
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="form-select"
                  style={{ width: 'auto', minWidth: '140px' }}
                >
                  <option value="">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={fetchAgents} title="Refresh">
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            {isLoading ? (
              <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="skeleton" style={{ height: '48px', borderRadius: '8px' }} />
                ))}
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Agent Code</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '3rem' }}>
                        No agents found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    agents.map((agent) => (
                      <tr key={agent._id} className="animate-fade-in">
                        <td><span className="pii-tag">{agent.agentCode}</span></td>
                        <td>
                          <div style={{ fontWeight: 500, color: 'var(--color-navy)' }}>{agent.name}</div>
                        </td>
                        <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>{agent.email}</td>
                        <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                          {(agent as any).phone || '—'}
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
                          <div className="flex items-center gap-2">
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => navigate(`/admin/agents/${agent._id}`)}
                            >
                              View
                            </button>
                            {agent.isActive && (
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => setConfirmId(agent._id)}
                                disabled={!!deactivatingId}
                              >
                                <UserX size={13} />
                                Deactivate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                Showing {((page - 1) * 10) + 1}–{Math.min(page * 10, pagination.total)} of {pagination.total}
              </p>
              <div className="pagination">
                <button className="page-btn" disabled={!pagination.hasPrevPage} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>
                    {p}
                  </button>
                ))}
                <button className="page-btn" disabled={!pagination.hasNextPage} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AgentListPage;
