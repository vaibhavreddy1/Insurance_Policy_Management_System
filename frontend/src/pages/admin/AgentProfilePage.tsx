import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../lib/api';
import { Users, FileText, UserX, ChevronLeft, Calendar, Phone, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import type { User } from '../../types';

interface AgentProfile {
  agent: User;
  counts: {
    customers: number;
    policies: number;
  };
}

const AgentProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get(`/admin/agents/${id}`);
      setProfile(res.data.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load agent profile');
      navigate('/admin/agents');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleDeactivate = async () => {
    setIsDeactivating(true);
    try {
      await api.delete(`/admin/agents/${id}`);
      toast.success('Agent deactivated successfully');
      setShowConfirm(false);
      fetchProfile();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Deactivation failed');
    } finally {
      setIsDeactivating(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-10 h-10 rounded-full border-[3px] border-current border-t-transparent animate-spin"
            style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-burgundy)' }}
          />
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) return null;

  const { agent, counts } = profile;

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        {/* Confirm Modal */}
        {showConfirm && (
          <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: '400px' }}>
              <div className="modal-header">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-navy)' }}>Confirm Deactivation</h3>
              </div>
              <div className="modal-body">
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  Are you sure you want to deactivate {agent.name}? They will immediately lose access to the system.
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setShowConfirm(false)}>Cancel</button>
                <button
                  className="btn btn-danger"
                  onClick={handleDeactivate}
                  disabled={isDeactivating}
                >
                  {isDeactivating ? 'Deactivating…' : 'Yes, Deactivate'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Back navigation */}
        <button 
          className="btn btn-ghost btn-sm mb-6" 
          onClick={() => navigate('/admin/agents')}
          style={{ paddingLeft: 0 }}
        >
          <ChevronLeft size={16} />
          Back to Agents
        </button>

        {/* Profile Header Card */}
        <div className="card mb-6">
          <div className="card-body" style={{ padding: '2rem' }}>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="flex items-start gap-5">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold"
                  style={{ background: 'var(--color-gold)20', color: 'var(--color-navy)' }}
                >
                  {agent.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-navy)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {agent.name}
                    <span className={`badge ${agent.isActive ? 'badge-success' : 'badge-danger'}`}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                      {agent.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 mt-3" style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                    <div className="flex items-center gap-1.5">
                      <span className="pii-tag" style={{ margin: 0 }}>{agent.agentCode}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Mail size={14} />
                      {agent.email}
                    </div>
                    {(agent as any).phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone size={14} />
                        {(agent as any).phone}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      Joined {new Date(agent.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
              
              {agent.isActive && (
                <button
                  className="btn btn-danger"
                  onClick={() => setShowConfirm(true)}
                  disabled={isDeactivating}
                >
                  <UserX size={15} />
                  Deactivate Agent
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Customers Onboarded
                </p>
                <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-navy)', marginTop: '0.375rem', fontFamily: "'Space Grotesk', sans-serif" }}>
                  {counts.customers}
                </p>
              </div>
              <div className="flex items-center justify-center w-9 h-9 rounded-lg"
                style={{ background: 'var(--color-navy)15' }}>
                <Users size={18} style={{ color: 'var(--color-navy)' }} />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Policies Issued
                </p>
                <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-burgundy)', marginTop: '0.375rem', fontFamily: "'Space Grotesk', sans-serif" }}>
                  {counts.policies}
                </p>
              </div>
              <div className="flex items-center justify-center w-9 h-9 rounded-lg"
                style={{ background: 'var(--color-burgundy)15' }}>
                <FileText size={18} style={{ color: 'var(--color-burgundy)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AgentProfilePage;
