import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Search, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const CustomerListPage: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/customers?page=${page}&limit=10`);
      setCustomers(res.data.data.customers);
      setPagination(res.data.data.pagination);
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-navy)' }}>My Customers</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {pagination?.total || 0} customers in your portfolio
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={() => navigate('/agent/search')}>
              <Search size={15} /> Search
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/agent/customers/new')}>
              <UserPlus size={15} /> Onboard Customer
            </button>
          </div>
        </div>

        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            {isLoading ? (
              <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton" style={{ height: '48px', borderRadius: '8px' }} />)}
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Mobile</th>
                    <th>Aadhaar</th>
                    <th>PAN</th>
                    <th>Gender</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '3rem' }}>
                        No customers yet.{' '}
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/agent/customers/new')}>
                          Onboard your first customer →
                        </button>
                      </td>
                    </tr>
                  ) : (
                    customers.map((c: any) => (
                      <tr key={c._id}>
                        <td>
                          <div style={{ fontWeight: 500, color: 'var(--color-navy)' }}>{c.firstName} {c.lastName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            {new Date(c.dateOfBirth).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                        </td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{c.email}</td>
                        <td><span className="pii-tag">{c.mobile}</span></td>
                        <td><span className="pii-tag">{c.aadhaar}</span></td>
                        <td>{c.pan ? <span className="pii-tag">{c.pan}</span> : <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>—</span>}</td>
                        <td><span className="badge badge-neutral">{c.gender}</span></td>
                        <td>
                          <span className={`badge ${c.isActive ? 'badge-success' : 'badge-danger'}`}>
                            {c.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-1">
                            <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/agent/customers/${c._id}`)}>View</button>
                            <button className="btn btn-ghost btn-sm" title="View Policies" onClick={() => navigate(`/agent/policies/customer/${c._id}`)}>
                              <FileText size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
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
                <button className="page-btn" disabled={!pagination.hasPrevPage} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => i + 1).map(p => (
                  <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
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

export default CustomerListPage;
