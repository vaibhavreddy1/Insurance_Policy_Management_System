import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../lib/api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, ArrowLeft, Info, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const POLICY_TYPES = ['Term Life', 'Endowment', 'ULIP', 'Whole Life', 'Money Back'];
const POLICY_TERMS = [10, 15, 20, 25, 30];
const FREQUENCIES = ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly'];

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

const Field = ({ label, id, error, children }: { label: string; id: string; error?: string; children: React.ReactNode }) => (
  <div className="form-group">
    <label className="form-label" htmlFor={id}>{label}</label>
    {children}
    {error && <span className="form-error"><Info size={12} />{error}</span>}
  </div>
);

const IssuePolicyPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefilledCustomerId = searchParams.get('customerId') || '';

  const [customers, setCustomers] = useState<any[]>([]);
  const [form, setForm] = useState({
    customerId: prefilledCustomerId,
    planName: '', policyType: '', sumAssured: '',
    premium: '', premiumFrequency: '', policyTerm: '',
    startDate: tomorrow(), remarks: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successPolicy, setSuccessPolicy] = useState<any>(null);

  useEffect(() => {
    api.get('/customers?limit=50').then(res => setCustomers(res.data.data.customers)).catch(() => {});
  }, []);

  const set = (key: string, val: string) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);
    try {
      const payload = {
        ...form,
        sumAssured: Number(form.sumAssured),
        premium: Number(form.premium),
        policyTerm: Number(form.policyTerm),
      };
      const res = await api.post('/policies/issue', payload);
      setSuccessPolicy(res.data.data.policy);
      toast.success('Policy issued successfully!');
    } catch (err: any) {
      const apiErrors = err?.response?.data?.errors;
      if (apiErrors) { setErrors(apiErrors); toast.error('Please fix validation errors.'); }
      else toast.error(err?.response?.data?.message || 'Failed to issue policy');
    } finally {
      setIsLoading(false);
    }
  };

  if (successPolicy) {
    return (
      <DashboardLayout>
        <div className="animate-fade-in" style={{ maxWidth: '500px', margin: '2rem auto' }}>
          <div className="card">
            <div className="card-body" style={{ padding: '2.5rem', textAlign: 'center' }}>
              <div className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4"
                style={{ background: 'var(--color-success-bg)' }}>
                <CheckCircle2 size={32} style={{ color: 'var(--color-success)' }} />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Policy Issued!</h2>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Policy Number</p>
              <div className="pii-tag" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '1.5rem', display: 'inline-block', padding: '0.4rem 1rem' }}>
                {successPolicy.policyNumber}
              </div>
              <div style={{ background: 'var(--color-surface-alt)', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
                {[
                  ['Plan', successPolicy.planName],
                  ['Type', successPolicy.policyType],
                  ['Premium', `₹${Number(successPolicy.premium).toLocaleString('en-IN')} / ${successPolicy.premiumFrequency}`],
                  ['Term', `${successPolicy.policyTerm} years`],
                  ['Sum Assured', `₹${Number(successPolicy.sumAssured).toLocaleString('en-IN')}`],
                  ['Start Date', new Date(successPolicy.startDate).toLocaleDateString('en-IN')],
                  ['Maturity Date', new Date(successPolicy.maturityDate).toLocaleDateString('en-IN')],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between items-center py-1">
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{l}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 justify-center flex-wrap">
                <button className="btn btn-ghost" onClick={() => { setSuccessPolicy(null); setForm({ customerId: '', planName: '', policyType: '', sumAssured: '', premium: '', premiumFrequency: '', policyTerm: '', startDate: tomorrow(), remarks: '' }); }}>
                  Issue Another
                </button>
                <button className="btn btn-primary" onClick={() => navigate('/agent/policies')}>
                  View All Policies
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
      <div className="animate-fade-in" style={{ maxWidth: '640px' }}>
        <div className="flex items-center gap-3 mb-6">
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => navigate('/agent/policies')}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--color-navy)' }}>Issue New Policy</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>All business rules are enforced server-side.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="card">
            <div className="card-header">
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Policy Details</h2>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <div style={{ gridColumn: '1 / -1' }}>
                  <Field label="Customer *" id="p-customer" error={errors.customerId}>
                    <select id="p-customer" className={`form-select ${errors.customerId ? 'error' : ''}`} value={form.customerId} onChange={e => set('customerId', e.target.value)} required>
                      <option value="">Select customer…</option>
                      {customers.map(c => (
                        <option key={c._id} value={c._id}>{c.firstName} {c.lastName} – {c.email}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <Field label="Plan Name *" id="p-plan" error={errors.planName}>
                    <input id="p-plan" className={`form-input ${errors.planName ? 'error' : ''}`} value={form.planName} onChange={e => set('planName', e.target.value)} placeholder="HDFC Life Click 2 Protect Super" required />
                  </Field>
                </div>
                <Field label="Policy Type *" id="p-type" error={errors.policyType}>
                  <select id="p-type" className={`form-select ${errors.policyType ? 'error' : ''}`} value={form.policyType} onChange={e => set('policyType', e.target.value)} required>
                    <option value="">Select type</option>
                    {POLICY_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Policy Term * (years)" id="p-term" error={errors.policyTerm}>
                  <select id="p-term" className={`form-select ${errors.policyTerm ? 'error' : ''}`} value={form.policyTerm} onChange={e => set('policyTerm', e.target.value)} required>
                    <option value="">Select term</option>
                    {POLICY_TERMS.map(t => <option key={t} value={t}>{t} years</option>)}
                  </select>
                </Field>
                <Field label="Sum Assured (₹) *" id="p-sa" error={errors.sumAssured}>
                  <input id="p-sa" type="number" min={100000} className={`form-input ${errors.sumAssured ? 'error' : ''}`} value={form.sumAssured} onChange={e => set('sumAssured', e.target.value)} placeholder="5000000" required />
                </Field>
                <Field label="Premium Amount (₹) * (min ₹5,000)" id="p-premium" error={errors.premium}>
                  <input id="p-premium" type="number" min={5000} className={`form-input ${errors.premium ? 'error' : ''}`} value={form.premium} onChange={e => set('premium', e.target.value)} placeholder="12000" required />
                </Field>
                <Field label="Premium Frequency *" id="p-freq" error={errors.premiumFrequency}>
                  <select id="p-freq" className={`form-select ${errors.premiumFrequency ? 'error' : ''}`} value={form.premiumFrequency} onChange={e => set('premiumFrequency', e.target.value)} required>
                    <option value="">Select frequency</option>
                    {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
                  </select>
                </Field>
                <Field label="Policy Start Date * (today or future)" id="p-start" error={errors.startDate}>
                  <input id="p-start" type="date" min={new Date().toISOString().split('T')[0]} className={`form-input ${errors.startDate ? 'error' : ''}`} value={form.startDate} onChange={e => set('startDate', e.target.value)} required />
                </Field>
                <div style={{ gridColumn: '1 / -1' }}>
                  <Field label="Remarks (Optional)" id="p-remarks" error={errors.remarks}>
                    <textarea id="p-remarks" className="form-textarea" value={form.remarks} onChange={e => set('remarks', e.target.value)} rows={3} placeholder="Any additional notes about this policy…" style={{ resize: 'vertical' }} />
                  </Field>
                </div>
              </div>

              {Number(form.premium) > 50000 && (
                <div style={{ marginTop: '1rem', padding: '0.875rem 1rem', background: 'var(--color-warning-bg)', borderRadius: '8px', border: '1px solid #FCD34D', fontSize: '0.8125rem', color: 'var(--color-warning)' }}>
                  <strong>⚠ PAN Required:</strong> Since premium exceeds ₹50,000, the customer must have a valid PAN number on file.
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/agent/policies')}>Cancel</button>
            <button id="issue-policy-submit" type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Issuing…
                </span>
              ) : (
                <><FileText size={14} /> Issue Policy</>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default IssuePolicyPage;
