import React, { useState, useEffect } from 'react';
import { fetchBackendHealth, fetchMLHealth } from '../services/api';
import { Server, Database, Cpu, RefreshCw, CheckCircle2, AlertCircle, Sparkles, Layers } from 'lucide-react';

export default function LandingPage() {
  const [backendStatus, setBackendStatus] = useState({ loading: true, data: null, error: null });
  const [mlStatus, setMlStatus] = useState({ loading: true, data: null, error: null });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkHealth = async () => {
    setIsRefreshing(true);
    
    // Check Backend
    setBackendStatus(prev => ({ ...prev, loading: true }));
    const backendRes = await fetchBackendHealth();
    if (backendRes.success) {
      setBackendStatus({ loading: false, data: backendRes.data, error: null });
    } else {
      setBackendStatus({ loading: false, data: null, error: backendRes.error });
    }

    // Check ML Service
    setMlStatus(prev => ({ ...prev, loading: true }));
    const mlRes = await fetchMLHealth();
    if (mlRes.success) {
      setMlStatus({ loading: false, data: mlRes.data, error: null });
    } else {
      setMlStatus({ loading: false, data: null, error: mlRes.error });
    }

    setIsRefreshing(false);
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '3rem', minHeight: '90vh', justifyContent: 'center' }}>
      {/* Hero Header */}
      <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '0.4rem 1rem', borderRadius: '9999px', marginBottom: '1.5rem', color: '#a5b4fc', fontSize: '0.875rem' }}>
          <Sparkles size={16} />
          <span>SkillSync Multi-Domain Resume Screening & Career Matching System</span>
        </div>

        <h1 style={{ fontSize: '3.25rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '1rem' }}>
          Welcome to <span className="gradient-text">SkillSync</span>
        </h1>

        <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', fontWeight: 500, lineHeight: 1.6, marginBottom: '1.5rem' }}>
          AI-Powered Resume Screening, Domain Skill Extraction, Career Matching & Recruitment Oversight
        </p>

        {/* Portal Quick Links */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <a
            href="/login"
            className="btn btn-primary"
            style={{ padding: '0.65rem 1.5rem', fontSize: '0.95rem' }}
          >
            🎓 Student Portal
          </a>
          <a
            href="/login"
            className="btn"
            style={{
              padding: '0.65rem 1.5rem',
              fontSize: '0.95rem',
              background: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid rgba(6, 182, 212, 0.35)',
              color: '#38bdf8'
            }}
          >
            💼 Recruiter Portal
          </a>
          <a
            href="/login"
            className="btn"
            style={{
              padding: '0.65rem 1.5rem',
              fontSize: '0.95rem',
              background: 'rgba(236, 72, 153, 0.15)',
              border: '1px solid rgba(236, 72, 153, 0.35)',
              color: '#f472b6'
            }}
          >
            ⚙️ Admin Panel
          </a>
        </div>
      </div>

      {/* Connectivity Status Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={20} style={{ color: 'var(--primary-accent)' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Microservices Status Dashboard</h2>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={checkHealth} 
            disabled={isRefreshing}
            style={{ opacity: isRefreshing ? 0.7 : 1 }}
          >
            <RefreshCw size={16} className={isRefreshing ? 'spin-icon' : ''} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
            <span>{isRefreshing ? 'Checking...' : 'Re-check Services'}</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          
          {/* Express Backend Card */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '0.75rem', borderRadius: '12px', color: '#818cf8' }}>
                  <Server size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Express Backend</h3>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Node.js REST API Server</p>
                </div>
              </div>
              {backendStatus.loading ? (
                <span className="badge badge-pending"><span className="pulse-dot"></span>Connecting...</span>
              ) : backendStatus.data ? (
                <span className="badge badge-success"><span className="pulse-dot"></span>Operational</span>
              ) : (
                <span className="badge badge-error"><AlertCircle size={14} />Offline</span>
              )}
            </div>

            {backendStatus.data ? (
              <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '1rem', borderRadius: '10px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Endpoint:</span>
                  <code style={{ color: '#a5b4fc' }}>/api/health</code>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Service:</span>
                  <span>{backendStatus.data.service}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Version:</span>
                  <span>{backendStatus.data.version}</span>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: '#f87171', background: 'rgba(244, 63, 94, 0.1)', padding: '0.75rem', borderRadius: '8px' }}>
                {backendStatus.error || 'Server not reachable on port 5000'}
              </p>
            )}
          </div>

          {/* MongoDB Connection Card */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.75rem', borderRadius: '12px', color: '#34d399' }}>
                  <Database size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>MongoDB Database</h3>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Mongoose ODM Connection</p>
                </div>
              </div>
              {backendStatus.loading ? (
                <span className="badge badge-pending"><span className="pulse-dot"></span>Checking...</span>
              ) : backendStatus.data?.database?.status === 'connected' ? (
                <span className="badge badge-success"><span className="pulse-dot"></span>Connected</span>
              ) : (
                <span className="badge badge-pending"><span className="pulse-dot"></span>Disconnected</span>
              )}
            </div>

            {backendStatus.data?.database ? (
              <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '1rem', borderRadius: '10px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Database Name:</span>
                  <code style={{ color: '#6ee7b7' }}>{backendStatus.data.database.name}</code>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Mongoose State:</span>
                  <span style={{ textTransform: 'capitalize' }}>{backendStatus.data.database.status}</span>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.05)', padding: '0.75rem', borderRadius: '8px' }}>
                Database status relies on Backend API connection.
              </p>
            )}
          </div>

          {/* Python ML Microservice Card */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '0.75rem', borderRadius: '12px', color: '#38bdf8' }}>
                  <Cpu size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Python ML Service</h3>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>FastAPI AI Microservice</p>
                </div>
              </div>
              {mlStatus.loading ? (
                <span className="badge badge-pending"><span className="pulse-dot"></span>Connecting...</span>
              ) : mlStatus.data ? (
                <span className="badge badge-success"><span className="pulse-dot"></span>Operational</span>
              ) : (
                <span className="badge badge-error"><AlertCircle size={14} />Offline</span>
              )}
            </div>

            {mlStatus.data ? (
              <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '1rem', borderRadius: '10px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Endpoint:</span>
                  <code style={{ color: '#7dd3fc' }}>/health</code>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Service:</span>
                  <span>{mlStatus.data.service}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Version:</span>
                  <span>{mlStatus.data.version}</span>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: '#f87171', background: 'rgba(244, 63, 94, 0.1)', padding: '0.75rem', borderRadius: '8px' }}>
                {mlStatus.error || 'FastAPI service not reachable on port 8000'}
              </p>
            )}
          </div>

        </div>
      </div>

      {/* Footer Info */}
      <div style={{ textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        SkillSync Project Architecture &copy; {new Date().getFullYear()} — Built with React, Node.js, Express, MongoDB & Python FastAPI
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
