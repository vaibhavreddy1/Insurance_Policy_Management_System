import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Eye, EyeOff, AlertCircle, UserCog, UserCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { AxiosError } from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

interface ApiError {
  message?: string;
  errors?: Record<string, string>;
}

// Validation schema using Zod
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'admin' | 'agent'>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Redirect if already authenticated
  React.useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/agent', { replace: true });
    }
  }, [user, navigate]);

  const onSubmit = async (data: LoginFormValues) => {
    setError('');
    setIsLoading(true);

    try {
      // In a real app, you might pass the role to the login API or the API determines it
      await login(data.email, data.password);
      toast.success(`Welcome back, ${activeTab}!`);
      // Navigation happens via useEffect above
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      const msg = axiosErr.response?.data?.message || 'Login failed. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{
        background: `linear-gradient(135deg, var(--color-navy) 0%, var(--color-navy-mid) 50%, #1a1032 100%)`,
      }}
    >
      {/* Background geometric pattern */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', top: '-20%', right: '-10%', width: '600px', height: '600px',
          borderRadius: '50%', background: 'rgba(139,26,47,0.08)', filter: 'blur(80px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', left: '-10%', width: '500px', height: '500px',
          borderRadius: '50%', background: 'rgba(200,152,42,0.06)', filter: 'blur(80px)',
        }} />
      </div>

      <div style={{ width: '100%', maxWidth: '440px', padding: '1rem', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: 'var(--color-burgundy)', boxShadow: '0 8px 24px rgba(139,26,47,0.4)' }}>
            <Shield size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', textAlign: 'center', fontFamily: "'Space Grotesk', sans-serif" }}>
            HDFC Life IPMS
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', marginTop: '0.25rem', textAlign: 'center' }}>
            Insurance Policy Management System
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '2rem',
          backdropFilter: 'blur(20px)',
        }}>
          
          {/* Tabs for Separate Login Screens */}
          <div className="flex bg-white/5 rounded-lg p-1 mb-6 border border-white/10">
            <button
              onClick={() => { setActiveTab('admin'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'admin' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <UserCog size={16} />
              Admin
            </button>
            <button
              onClick={() => { setActiveTab('agent'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'agent' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <UserCircle size={16} />
              Agent
            </button>
          </div>

          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#fff', marginBottom: '1.5rem', textAlign: 'center' }}>
            Sign in to your {activeTab} account
          </h2>

          {error && (
            <div style={{
              background: 'rgba(185,28,28,0.15)',
              border: '1px solid rgba(185,28,28,0.3)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#FCA5A5',
              fontSize: '0.875rem',
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="form-group">
              <label className="form-label" style={{ color: 'rgba(255,255,255,0.65)' }}>
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder={activeTab === 'admin' ? "admin@hdfclife.com" : "agent@hdfclife.com"}
                {...register('email')}
                className={`form-input ${errors.email ? 'border-red-500 bg-red-500/10' : ''}`}
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: errors.email ? '1px solid #FCA5A5' : '1px solid rgba(255,255,255,0.12)',
                  color: '#fff',
                }}
              />
              {errors.email && (
                <span className="text-red-400 text-xs mt-1 block">{errors.email.message}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" style={{ color: 'rgba(255,255,255,0.65)' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={`form-input ${errors.password ? 'border-red-500 bg-red-500/10' : ''}`}
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: errors.password ? '1px solid #FCA5A5' : '1px solid rgba(255,255,255,0.12)',
                    color: '#fff',
                    paddingRight: '2.75rem',
                    width: '100%',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                    color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <span className="text-red-400 text-xs mt-1 block">{errors.password.message}</span>
              )}
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="btn btn-primary btn-lg"
              style={{ marginTop: '0.5rem', justifyContent: 'center' }}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Signing in…
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div style={{
            marginTop: '1.5rem',
            padding: '0.875rem',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: '0.5rem' }}>
              Demo Credentials
            </p>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 1.8 }}>
              {activeTab === 'admin' ? (
                <>
                  <div>Admin: <span style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.75)' }}>admin@hdfclife.com</span></div>
                  <div style={{ marginTop: '0.2rem' }}>Password: <span style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.75)' }}>Admin@123456</span></div>
                </>
              ) : (
                <>
                  <div>Agent: <span style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.75)' }}>agent@hdfclife.com</span></div>
                  <div style={{ marginTop: '0.2rem' }}>Password: <span style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.75)' }}>Agent@123456</span></div>
                </>
              )}
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)' }}>
          Session auto-expires in 15 minutes · Secured by HttpOnly cookies
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
