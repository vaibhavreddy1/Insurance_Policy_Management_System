import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, FileText, ChevronRight } from 'lucide-react';

const CustomerSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.length < 2) return;
    setIsLoading(true);
    setHasSearched(true);
    try {
      const res = await api.get(`/customers/search?q=${encodeURIComponent(query)}`);
      setResults(res.data.data.customers);
    } catch (err) {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in" style={{ maxWidth: '800px' }}>
        <div className="mb-6">
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-navy)' }}>Search Customer</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Search by name, email, or mobile. Only your customers are shown.
          </p>
        </div>

        {/* Search Box */}
        <div className="card mb-5">
          <div className="card-body">
            <form onSubmit={handleSearch}>
              <div className="flex gap-3">
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  <input
                    id="customer-search-q"
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Type name, email, or mobile (min. 2 chars)…"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem', fontSize: '1rem' }}
                    autoFocus
                    minLength={2}
                    required
                  />
                </div>
                <button id="customer-search-btn" type="submit" className="btn btn-primary" disabled={isLoading || query.length < 2}>
                  {isLoading ? (
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <><Search size={14} /> Search</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Results */}
        {hasSearched && (
          <div className="animate-fade-in">
            {results.length === 0 && !isLoading ? (
              <div className="card">
                <div className="card-body" style={{ padding: '3rem', textAlign: 'center' }}>
                  <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                    No customers found for "{query}"
                  </p>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate('/agent/customers/new')}>
                    <UserPlus size={14} /> Onboard New Customer
                  </button>
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="card-header">
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                    {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {results.map((c: any, idx: number) => (
                    <div
                      key={c._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '1rem 1.25rem',
                        borderBottom: idx < results.length - 1 ? '1px solid var(--color-border)' : 'none',
                        gap: '1rem',
                        transition: 'background 0.12s',
                        cursor: 'pointer',
                      }}
                      onClick={() => navigate(`/agent/customers/${c._id}`)}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-alt)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Avatar */}
                      <div className="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0"
                        style={{ background: 'var(--color-navy)', color: '#fff', fontWeight: 700, fontSize: '0.875rem', fontFamily: "'Space Grotesk', sans-serif" }}>
                        {c.firstName[0]}{c.lastName[0]}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-navy)' }}>
                          {c.firstName} {c.lastName}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                          <span>{c.email}</span>
                          <span className="pii-tag">{c.mobile}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                        <span className="pii-tag">{c.aadhaar}</span>
                        <span className={`badge ${c.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {c.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={(e) => { e.stopPropagation(); navigate(`/agent/policies/customer/${c._id}`); }}
                          title="View Policies"
                        >
                          <FileText size={13} />
                        </button>
                        <ChevronRight size={14} style={{ color: 'var(--color-text-muted)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!hasSearched && (
          <div className="card" style={{ borderStyle: 'dashed' }}>
            <div className="card-body" style={{ padding: '3rem', textAlign: 'center' }}>
              <Search size={32} style={{ color: 'var(--color-text-muted)', margin: '0 auto 1rem' }} />
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                Enter at least 2 characters to search your customer portfolio
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CustomerSearchPage;
