import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const statusColors: Record<string, string> = {
  Active: 'badge-success', Lapsed: 'badge-danger', Matured: 'badge-neutral',
  Surrendered: 'badge-warning', Cancelled: 'badge-danger',
};

const PolicyListPage: React.FC = () => {
  const navigate = useNavigate();
  const [policies, setPolicies] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchPolicies = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/policies?page=${page}&limit=10`);
      setPolicies(res.data.data.policies);
      setPagination(res.data.data.pagination);
    } catch {
      toast.error('Failed to load policies');
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchPolicies(); }, [fetchPolicies]);

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-navy)' }}>My Policies</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {pagination?.total || 0} policies issued
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/agent/policies/issue')}>
            <Plus size={15} /> Issue Policy
          </button>
        </div>

        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            {isLoading ? (
              <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: '60px', borderRadius: '8px' }} />)}
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Policy Number</th>
                    <th>Customer</th>
                    <th>Plan</th>
                    <th>Type</th>
                    <th>Premium</th>
                    <th>Sum Assured</th>
                    <th>Term</th>
                    <th>Start Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {policies.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '3rem' }}>
                        No policies yet.{' '}
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/agent/policies/issue')}>
                          Issue your first policy →
                        </button>
                      </td>
                    </tr>
                  ) : (
                    policies.map((p: any) => {
                      const customer = p.customerId;
                      return (
                        <tr key={p._id}>
                          <td><span className="pii-tag">{p.policyNumber}</span></td>
                          <td style={{ fontWeight: 500 }}>
                            {typeof customer === 'object' ? `${customer.firstName} ${customer.lastName}` : '—'}
                          </td>
                          <td style={{ color: 'var(--color-text-secondary)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.planName}
                          </td>
                          <td><span className="badge badge-navy">{p.policyType}</span></td>
                          <td>
                            <div style={{ fontWeight: 500 }}>{fmt(p.premium)}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{p.premiumFrequency}</div>
                          </td>
                          <td style={{ fontWeight: 500 }}>{fmt(p.sumAssured)}</td>
                          <td>{p.policyTerm}y</td>
                          <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{fmtDate(p.startDate)}</td>
                          <td><span className={`badge ${statusColors[p.status] || 'badge-neutral'}`}>{p.status}</span></td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                {((page - 1) * 10) + 1}–{Math.min(page * 10, pagination.total)} of {pagination.total}
              </p>
              <div className="pagination">
                <button className="page-btn" disabled={!pagination.hasPrevPage} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></button>
                {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => i + 1).map(p => (
                  <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button className="page-btn" disabled={!pagination.hasNextPage} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PolicyListPage;
