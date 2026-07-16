import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../lib/api';
import { UserPlus, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const agentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  phone: z.string().optional().refine(val => !val || /^\d{10}$/.test(val), {
    message: 'Phone must be exactly 10 digits if provided',
  }),
});

type AgentFormValues = z.infer<typeof agentSchema>;

const CreateAgentPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [successAgent, setSuccessAgent] = useState<any>(null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<AgentFormValues>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      phone: '',
    },
  });

  const onSubmit = async (data: AgentFormValues) => {
    setIsLoading(true);

    try {
      const payload = { ...data, phone: data.phone || undefined };
      const res = await api.post('/admin/agents', payload);
      setSuccessAgent(res.data.data.agent);
      toast.success('Agent created successfully!');
    } catch (err: any) {
      const apiErrors = err?.response?.data?.errors;
      if (apiErrors) {
        // Map backend errors to react-hook-form
        Object.keys(apiErrors).forEach(key => {
          setError(key as any, { type: 'server', message: apiErrors[key] });
        });
      } else {
        toast.error(err?.response?.data?.message || 'Failed to create agent');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (successAgent) {
    return (
      <DashboardLayout>
        <div className="animate-fade-in" style={{ maxWidth: '480px', margin: '2rem auto' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="card-body" style={{ padding: '2.5rem' }}>
              <div className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4"
                style={{ background: 'var(--color-success-bg)' }}>
                <CheckCircle2 size={32} style={{ color: 'var(--color-success)' }} />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '0.5rem' }}>
                Agent Created Successfully
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                The agent account has been created and is ready to use.
              </p>
              <div style={{ background: 'var(--color-surface-alt)', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
                <div className="flex flex-col gap-2">
                  {[
                    ['Agent Code', successAgent.agentCode],
                    ['Name', successAgent.name],
                    ['Email', successAgent.email],
                    ['Status', 'Active'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between items-center">
                      <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{label}</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-navy)' }}>
                        {label === 'Agent Code' ? <span className="pii-tag">{value}</span> : value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 justify-center">
                <button className="btn btn-ghost" onClick={() => { setSuccessAgent(null); reset(); }}>
                  Create Another
                </button>
                <button className="btn btn-primary" onClick={() => navigate('/admin/agents')}>
                  View All Agents
                </button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="animate-fade-in" style={{ maxWidth: '560px' }}>
        <div className="flex items-center gap-3 mb-6">
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => navigate('/admin/agents')}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--color-navy)' }}>
              Create New Agent
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              Add a new field agent to the system
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <UserPlus size={16} style={{ color: 'var(--color-burgundy)' }} />
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Agent Details</h2>
            </div>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label" htmlFor="agent-name">Full Name *</label>
                  <input
                    id="agent-name"
                    type="text"
                    placeholder="Rajesh Sharma"
                    {...register('name')}
                    className={`form-input ${errors.name ? 'border-red-500 bg-red-50/50' : ''}`}
                  />
                  {errors.name && <span className="form-error text-red-500 text-xs mt-1 block">{errors.name.message}</span>}
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label" htmlFor="agent-email">Email Address *</label>
                  <input
                    id="agent-email"
                    type="email"
                    placeholder="agent@hdfclife.com"
                    {...register('email')}
                    className={`form-input ${errors.email ? 'border-red-500 bg-red-50/50' : ''}`}
                  />
                  {errors.email && <span className="form-error text-red-500 text-xs mt-1 block">{errors.email.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="agent-password">Password *</label>
                  <input
                    id="agent-password"
                    type="password"
                    placeholder="Min. 8 chars, A-Z, a-z, 0-9"
                    {...register('password')}
                    className={`form-input ${errors.password ? 'border-red-500 bg-red-50/50' : ''}`}
                  />
                  {errors.password && <span className="form-error text-red-500 text-xs mt-1 block">{errors.password.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="agent-phone">Phone (Optional)</label>
                  <input
                    id="agent-phone"
                    type="tel"
                    placeholder="9876543210"
                    {...register('phone')}
                    className={`form-input ${errors.phone ? 'border-red-500 bg-red-50/50' : ''}`}
                  />
                  {errors.phone && <span className="form-error text-red-500 text-xs mt-1 block">{errors.phone.message}</span>}
                </div>
              </div>

              <div style={{ background: 'var(--color-surface-alt)', borderRadius: '8px', padding: '0.875rem 1rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--color-text-secondary)' }}>Note:</strong> An Agent Code will be auto-generated. The agent can log in immediately with the provided credentials. Session expires in 15 minutes.
              </div>

              <div className="flex gap-3 justify-end">
                <button type="button" className="btn btn-ghost" onClick={() => navigate('/admin/agents')}>
                  Cancel
                </button>
                <button id="create-agent-submit" type="submit" className="btn btn-primary" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Creating…
                    </span>
                  ) : (
                    <><UserPlus size={14} /> Create Agent</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateAgentPage;
