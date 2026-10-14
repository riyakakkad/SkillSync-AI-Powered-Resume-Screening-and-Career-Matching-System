import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Mail, Lock, AlertCircle, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.success) {
      // Redirect based on target or user role
      if (from) {
        navigate(from, { replace: true });
      } else {
        const role = result.user.role;
        if (role === 'student') navigate('/student/dashboard');
        else if (role === 'recruiter') navigate('/recruiter/dashboard');
        else if (role === 'admin') navigate('/admin/dashboard');
        else navigate('/');
      }
    } else {
      setErrorMsg(result.error);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '2.25rem' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'inline-flex', background: 'rgba(99, 102, 241, 0.15)', padding: '0.6rem', borderRadius: '12px', color: 'var(--primary-accent)', marginBottom: '0.75rem' }}>
            <Sparkles size={24} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Log in to your SkillSync account
          </p>
        </div>

        {errorMsg && (
          <div style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#f87171', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.875rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                style={{
                  width: '100%',
                  padding: '0.75rem 0.85rem 0.75rem 2.6rem',
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Password
              </label>
              <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--primary-accent)', textDecoration: 'none' }}>
                Forgot password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '0.75rem 0.85rem 0.75rem 2.6rem',
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', marginTop: '0.5rem', opacity: isSubmitting ? 0.7 : 1 }}
          >
            <LogIn size={18} />
            <span>{isSubmitting ? 'Logging in...' : 'Sign In'}</span>
          </button>
        </form>

        {/* Demo Quick-Fill Roles */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.65rem' }}>
            Quick Demo Credentials
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                setEmail('admin@skillsync.com');
                setPassword('Admin@123456');
              }}
              style={{
                fontSize: '0.75rem',
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                background: 'rgba(236, 72, 153, 0.15)',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                color: '#f472b6',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              ⚙️ Admin Demo
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('recruiter.demo@skillsync.com');
                setPassword('Password123!');
              }}
              style={{
                fontSize: '0.75rem',
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                background: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                color: '#38bdf8',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              💼 Recruiter Demo
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('student.demo@skillsync.com');
                setPassword('Password123!');
              }}
              style={{
                fontSize: '0.75rem',
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                color: '#a5b4fc',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              🎓 Student Demo
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary-accent)', fontWeight: 600, textDecoration: 'none' }}>
            Register Now
          </Link>
        </div>

      </div>
    </div>
  );
}
