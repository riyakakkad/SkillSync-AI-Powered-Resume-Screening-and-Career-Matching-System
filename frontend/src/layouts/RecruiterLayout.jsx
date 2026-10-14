import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RecruiterLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/recruiter/dashboard', icon: '📊' },
    { label: 'My Job Postings', path: '/recruiter/jobs', icon: '💼' },
    { label: 'Post New Job', path: '/recruiter/jobs/new', icon: '➕' },
    { label: 'Candidate Applications', path: '/recruiter/applications', icon: '👥' }
  ];

  const currentNav = navItems.find((item) => location.pathname === item.path);
  const pageTitle = currentNav ? currentNav.label : 'Recruiter Portal';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 90
          }}
        />
      )}

      {/* Recruiter Sidebar */}
      <aside
        style={{
          width: '260px',
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 100,
          transition: 'transform 0.3s ease',
          transform: mobileMenuOpen ? 'translateX(0)' : undefined
        }}
        className="recruiter-sidebar"
      >
        <div>
          {/* Brand Header */}
          <div
            style={{
              padding: '1.5rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.2rem',
                  color: '#fff'
                }}
              >
                R
              </div>
              <div>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
                  Skill<span style={{ color: 'var(--cyan-accent)' }}>Sync</span>
                </span>
                <span style={{ display: 'block', fontSize: '0.7rem', color: '#38bdf8', fontWeight: 700, letterSpacing: '0.06em' }}>
                  RECRUITER PORTAL
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ padding: '1.25rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path ||
                (item.path === '/recruiter/jobs' && location.pathname.startsWith('/recruiter/jobs/') && location.pathname !== '/recruiter/jobs/new');
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#ffffff' : 'var(--text-muted)',
                    background: isActive ? 'rgba(6, 182, 212, 0.16)' : 'transparent',
                    border: isActive ? '1px solid rgba(6, 182, 212, 0.35)' : '1px solid transparent',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '1.15rem' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Recruiter Profile Card Footer */}
        <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  color: '#fff',
                  flexShrink: 0
                }}
              >
                {user?.fullName?.charAt(0).toUpperCase() || 'R'}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.fullName || 'Recruiter'}
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.email}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.25)',
                color: '#f87171',
                padding: '0.45rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              title="Logout"
            >
              🚪
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, marginLeft: '260px', display: 'flex', flexDirection: 'column', minWidth: 0 }} className="recruiter-main-content">
        {/* Header Bar */}
        <header
          style={{
            height: '65px',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.75rem',
            position: 'sticky',
            top: 0,
            zIndex: 80
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="recruiter-mobile-btn"
              style={{
                display: 'none',
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '1.4rem',
                cursor: 'pointer'
              }}
            >
              ☰
            </button>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
              {pageTitle}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => navigate('/recruiter/jobs/new')}
              className="btn btn-primary"
              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
            >
              ➕ Post Job
            </button>
            <span className="badge badge-success">
              <span className="pulse-dot" /> Recruiter Verified
            </span>
          </div>
        </header>

        {/* Page Body */}
        <main style={{ padding: '1.75rem', flex: 1 }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 992px) {
          .recruiter-sidebar {
            transform: translateX(-100%);
          }
          .recruiter-main-content {
            margin-left: 0 !important;
          }
          .recruiter-mobile-btn {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
