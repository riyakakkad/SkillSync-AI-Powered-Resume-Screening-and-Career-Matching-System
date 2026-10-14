import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, LogOut, User as UserIcon, Shield, Briefcase, GraduationCap } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (
    location.pathname.startsWith('/student') ||
    location.pathname.startsWith('/recruiter') ||
    location.pathname.startsWith('/admin')
  ) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    if (user.role === 'student') return '/student/dashboard';
    if (user.role === 'recruiter') return '/recruiter/dashboard';
    if (user.role === 'admin') return '/admin/dashboard';
    return '/';
  };

  const getRoleIcon = () => {
    if (user?.role === 'student') return <GraduationCap size={16} />;
    if (user?.role === 'recruiter') return <Briefcase size={16} />;
    if (user?.role === 'admin') return <Shield size={16} />;
    return <UserIcon size={16} />;
  };

  return (
    <nav style={{ background: 'rgba(17, 24, 39, 0.8)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border-color)', sticky: 'top', zIndex: 100 }}>
      <div className="container" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        
        {/* Brand Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ background: 'var(--primary-gradient)', padding: '0.4rem', borderRadius: '10px', display: 'flex', color: '#fff' }}>
            <Sparkles size={20} />
          </div>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
            Skill<span style={{ color: 'var(--primary-accent)' }}>Sync</span>
          </span>
        </Link>

        {/* Auth Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {user ? (
            <>
              <Link 
                to={getDashboardPath()} 
                style={{ 
                  textDecoration: 'none', 
                  color: 'var(--text-main)', 
                  fontSize: '0.9rem', 
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)'
                }}
              >
                {getRoleIcon()}
                <span>Dashboard ({user.role})</span>
              </Link>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Hi, <strong style={{ color: '#fff' }}>{user.fullName}</strong>
              </div>

              <button 
                onClick={handleLogout} 
                className="btn" 
                style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#f87171', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn" style={{ background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary">
                Register
              </Link>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}
