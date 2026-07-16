import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft, CheckCircle2, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
];

const customerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Gender is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit mobile number'),
  aadhaar: z.string().regex(/^\d{12}$/, 'Aadhaar must be 12 digits'),
  pan: z.string().optional().refine(val => !val || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val), {
    message: 'Invalid PAN format',
  }),
  address: z.object({
    line1: z.string().min(3, 'Address Line 1 is required'),
    line2: z.string().optional(),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(1, 'State is required'),
    pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  }),
  nominee: z.object({
    name: z.string().min(2, 'Nominee name is required'),
    relationship: z.string().min(1, 'Relationship is required'),
    dateOfBirth: z.string().min(1, 'Nominee DOB is required'),
  }),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

const CreateCustomerPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [successCustomer, setSuccessCustomer] = useState<any>(null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      firstName: '', lastName: '', dateOfBirth: '', gender: '',
      email: '', mobile: '', aadhaar: '', pan: '',
      address: { line1: '', line2: '', city: '', state: '', pincode: '' },
      nominee: { name: '', relationship: '', dateOfBirth: '' },
    },
  });

  const onSubmit = async (data: CustomerFormValues) => {
    setIsLoading(true);

    try {
      const payload = { ...data, pan: data.pan || undefined };
      const res = await api.post('/customers', payload);
      setSuccessCustomer(res.data.data.customer);
      toast.success('Customer onboarded successfully!');
    } catch (err: any) {
      const apiErrors = err?.response?.data?.errors;
      if (apiErrors) {
        // Map backend errors to react-hook-form
        Object.keys(apiErrors).forEach(key => {
          setError(key as any, { type: 'server', message: apiErrors[key] });
        });
        toast.error('Please fix the validation errors below.');
      } else {
        toast.error(err?.response?.data?.message || 'Failed to create customer');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (successCustomer) {
    return (
      <DashboardLayout>
        <div className="animate-fade-in" style={{ maxWidth: '500px', margin: '2rem auto' }}>
          <div className="card">
            <div className="card-body" style={{ padding: '2.5rem', textAlign: 'center' }}>
              <div className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4"
                style={{ background: 'var(--color-success-bg)' }}>
                <CheckCircle2 size={32} style={{ color: 'var(--color-success)' }} />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Customer Onboarded!</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                {successCustomer.firstName} {successCustomer.lastName} has been added successfully.
              </p>
              <div style={{ background: 'var(--color-surface-alt)', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
                <div className="flex flex-col gap-2">
                  {[
                    ['Mobile', successCustomer.mobile],
                    ['Aadhaar', successCustomer.aadhaar],
                    ['PAN', successCustomer.pan || 'Not provided'],
                  ].map(([l, v]) => (
                    <div key={l} className="flex justify-between">
                      <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{l}</span>
                      <span className="pii-tag">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 justify-center flex-wrap">
                <button className="btn btn-ghost" onClick={() => { setSuccessCustomer(null); reset(); }}>
                  Onboard Another
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/agent/policies/issue?customerId=${successCustomer._id}`)}>
                  Issue Policy
                </button>
                <button className="btn btn-primary" onClick={() => navigate('/agent/customers')}>
                  View Customers
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
      <div className="animate-fade-in" style={{ maxWidth: '720px' }}>
        <div className="flex items-center gap-3 mb-6">
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => navigate('/agent/customers')}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--color-navy)' }}>Onboard New Customer</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Fill all required fields. PII data is stored securely.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          {/* Personal Information */}
          <div className="card">
            <div className="card-header">
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Personal Information</h2>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="firstName">First Name *</label>
                  <input id="firstName" {...register('firstName')} className={`form-input ${errors.firstName ? 'border-red-500 bg-red-50/50' : ''}`} placeholder="Ravi" />
                  {errors.firstName && <span className="form-error text-red-500 text-xs mt-1 block"><Info size={12} className="inline mr-1" />{errors.firstName.message}</span>}
                </div>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="lastName">Last Name *</label>
                  <input id="lastName" {...register('lastName')} className={`form-input ${errors.lastName ? 'border-red-500 bg-red-50/50' : ''}`} placeholder="Kumar" />
                  {errors.lastName && <span className="form-error text-red-500 text-xs mt-1 block"><Info size={12} className="inline mr-1" />{errors.lastName.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="dateOfBirth">Date of Birth * (Age: 18–65)</label>
                  <input id="dateOfBirth" type="date" {...register('dateOfBirth')} className={`form-input ${errors.dateOfBirth ? 'border-red-500 bg-red-50/50' : ''}`} />
                  {errors.dateOfBirth && <span className="form-error text-red-500 text-xs mt-1 block"><Info size={12} className="inline mr-1" />{errors.dateOfBirth.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="gender">Gender *</label>
                  <select id="gender" {...register('gender')} className={`form-select ${errors.gender ? 'border-red-500 bg-red-50/50' : ''}`}>
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && <span className="form-error text-red-500 text-xs mt-1 block"><Info size={12} className="inline mr-1" />{errors.gender.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="email">Email Address *</label>
                  <input id="email" type="email" {...register('email')} className={`form-input ${errors.email ? 'border-red-500 bg-red-50/50' : ''}`} placeholder="ravi@example.com" />
                  {errors.email && <span className="form-error text-red-500 text-xs mt-1 block"><Info size={12} className="inline mr-1" />{errors.email.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="mobile">Mobile Number * (10 digits, starts 6-9)</label>
                  <input id="mobile" type="tel" {...register('mobile')} className={`form-input ${errors.mobile ? 'border-red-500 bg-red-50/50' : ''}`} placeholder="9876543210" maxLength={10} />
                  {errors.mobile && <span className="form-error text-red-500 text-xs mt-1 block"><Info size={12} className="inline mr-1" />{errors.mobile.message}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* KYC Documents */}
          <div className="card">
            <div className="card-header">
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>KYC Documents</h2>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="aadhaar">Aadhaar Number * (12 digits)</label>
                  <input id="aadhaar" {...register('aadhaar')} className={`form-input ${errors.aadhaar ? 'border-red-500 bg-red-50/50' : ''}`} placeholder="123456789012" maxLength={12} />
                  {errors.aadhaar && <span className="form-error text-red-500 text-xs mt-1 block"><Info size={12} className="inline mr-1" />{errors.aadhaar.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="pan">PAN Card (Required if premium &gt; ₹50,000)</label>
                  <input id="pan" {...register('pan')} className={`form-input ${errors.pan ? 'border-red-500 bg-red-50/50' : ''}`} placeholder="ABCDE1234F" maxLength={10} style={{ textTransform: 'uppercase' }} />
                  {errors.pan && <span className="form-error text-red-500 text-xs mt-1 block"><Info size={12} className="inline mr-1" />{errors.pan.message}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="card">
            <div className="card-header">
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Address</h2>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label" htmlFor="address.line1">Address Line 1 *</label>
                  <input id="address.line1" {...register('address.line1')} className={`form-input ${errors.address?.line1 ? 'border-red-500 bg-red-50/50' : ''}`} placeholder="123 MG Road" />
                  {errors.address?.line1 && <span className="form-error text-red-500 text-xs mt-1 block"><Info size={12} className="inline mr-1" />{errors.address.line1.message}</span>}
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label" htmlFor="address.line2">Address Line 2</label>
                  <input id="address.line2" {...register('address.line2')} className="form-input" placeholder="Apartment / Suite (optional)" />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="address.city">City *</label>
                  <input id="address.city" {...register('address.city')} className={`form-input ${errors.address?.city ? 'border-red-500 bg-red-50/50' : ''}`} placeholder="Bengaluru" />
                  {errors.address?.city && <span className="form-error text-red-500 text-xs mt-1 block"><Info size={12} className="inline mr-1" />{errors.address.city.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="address.state">State *</label>
                  <select id="address.state" {...register('address.state')} className={`form-select ${errors.address?.state ? 'border-red-500 bg-red-50/50' : ''}`}>
                    <option value="">Select state</option>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.address?.state && <span className="form-error text-red-500 text-xs mt-1 block"><Info size={12} className="inline mr-1" />{errors.address.state.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="address.pincode">Pincode * (6 digits)</label>
                  <input id="address.pincode" {...register('address.pincode')} className={`form-input ${errors.address?.pincode ? 'border-red-500 bg-red-50/50' : ''}`} placeholder="560001" maxLength={6} />
                  {errors.address?.pincode && <span className="form-error text-red-500 text-xs mt-1 block"><Info size={12} className="inline mr-1" />{errors.address.pincode.message}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Nominee */}
          <div className="card">
            <div className="card-header">
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Nominee Details</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Nominee cannot be the policyholder</span>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="nominee.name">Nominee Full Name *</label>
                  <input id="nominee.name" {...register('nominee.name')} className={`form-input ${errors.nominee?.name ? 'border-red-500 bg-red-50/50' : ''}`} placeholder="Priya Kumar" />
                  {errors.nominee?.name && <span className="form-error text-red-500 text-xs mt-1 block"><Info size={12} className="inline mr-1" />{errors.nominee.name.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="nominee.relationship">Relationship *</label>
                  <select id="nominee.relationship" {...register('nominee.relationship')} className={`form-select ${errors.nominee?.relationship ? 'border-red-500 bg-red-50/50' : ''}`}>
                    <option value="">Select relationship</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.nominee?.relationship && <span className="form-error text-red-500 text-xs mt-1 block"><Info size={12} className="inline mr-1" />{errors.nominee.relationship.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="nominee.dateOfBirth">Nominee Date of Birth *</label>
                  <input id="nominee.dateOfBirth" type="date" {...register('nominee.dateOfBirth')} className={`form-input ${errors.nominee?.dateOfBirth ? 'border-red-500 bg-red-50/50' : ''}`} />
                  {errors.nominee?.dateOfBirth && <span className="form-error text-red-500 text-xs mt-1 block"><Info size={12} className="inline mr-1" />{errors.nominee.dateOfBirth.message}</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/agent/customers')}>Cancel</button>
            <button id="create-customer-submit" type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Saving…
                </span>
              ) : (
                <><UserPlus size={14} /> Onboard Customer</>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CreateCustomerPage;
