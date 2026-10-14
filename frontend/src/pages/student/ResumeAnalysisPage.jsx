import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function ResumeAnalysisPage() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchResumesAndAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/resumes`);
      if (response.data.success && response.data.resumes.length > 0) {
        const resumeList = response.data.resumes;
        setResumes(resumeList);
        
        // Pick latest resume
        const latest = resumeList[0];
        
        // Fetch detailed analysis
        const analysisRes = await axios.get(`${API_BASE_URL}/resumes/${latest._id}/analysis`);
        if (analysisRes.data.success) {
          setSelectedResume(analysisRes.data.resume);
        } else {
          setSelectedResume(latest);
        }
      }
    } catch (err) {
      console.error('Error fetching resume analysis:', err);
      setError('Failed to load resume analysis details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumesAndAnalysis();
  }, []);

  const handleSelectResume = async (resumeId) => {
    setLoading(true);
    try {
      const analysisRes = await axios.get(`${API_BASE_URL}/resumes/${resumeId}/analysis`);
      if (analysisRes.data.success) {
        setSelectedResume(analysisRes.data.resume);
      }
    } catch (err) {
      alert('Failed to load analysis for selected resume.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader message="Analyzing resume document text and sections..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchResumesAndAnalysis} />;
  }

  if (!resumes || resumes.length === 0) {
    return (
      <EmptyState
        icon="📤"
        title="No Resume Uploaded"
        description="Upload your resume in PDF or DOCX format to trigger Python NLP section extraction and skill parsing."
        actionText="Upload Resume Now"
        onAction={() => navigate('/student/resume-upload')}
      />
    );
  }

  const parsedData = selectedResume?.parsedData || {};
  const contact = parsedData.contact || {};
  const detectedSkills = selectedResume?.detectedSkills || parsedData.skills || [];
  const status = selectedResume?.analysisStatus || selectedResume?.status || 'uploaded';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header & Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
            Structured Resume Analysis
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Real-time Python NLP section extraction and entity parsing.
          </p>
        </div>

        {resumes.length > 1 && (
          <select
            value={selectedResume?._id}
            onChange={(e) => handleSelectResume(e.target.value)}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: '10px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              color: '#fff',
              fontSize: '0.875rem'
            }}
          >
            {resumes.map((r) => (
              <option key={r._id} value={r._id}>
                {r.originalName} ({new Date(r.uploadedAt).toLocaleDateString()})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Status Banner */}
      <div
        className="card"
        style={{
          background: status === 'analyzed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
          borderColor: status === 'analyzed' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '2rem' }}>📄</div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span>{selectedResume?.originalName}</span>
              {(selectedResume?.detectedDomain || parsedData?.detectedDomain) && (
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.25)', border: '1px solid rgba(99, 102, 241, 0.45)', color: '#a5b4fc', fontWeight: 600 }}>
                  🏷️ {selectedResume?.detectedDomain || parsedData?.detectedDomain}
                </span>
              )}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Status: <span style={{ color: status === 'analyzed' ? '#34d399' : '#fbbf24', fontWeight: 600 }}>{status.toUpperCase()}</span>
              {selectedResume?.analyzedAt && ` • Analyzed on ${new Date(selectedResume.analyzedAt).toLocaleString()}`}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => navigate('/student/ats-score')}
            className="btn btn-primary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            🎯 View ATS Score
          </button>
        </div>
      </div>

      {status !== 'analyzed' ? (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem' }}>
            Analysis Not Run Yet
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Click the Analyze button in Resume Upload to trigger Python document text extraction.
          </p>
          <button onClick={() => navigate('/student/resume-upload')} className="btn btn-primary">
            Go to Resume Upload
          </button>
        </div>
      ) : (
        /* Structured Sections Display */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {/* Section 1: Contact Info */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              👤 Extracted Contact Details
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block' }}>Full Name</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>{contact.name || 'Not detected'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block' }}>Email</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>{contact.email || 'Not detected'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block' }}>Phone</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>{contact.phone || 'Not detected'}</span>
              </div>
              {contact.linkedin && (
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block' }}>LinkedIn</span>
                  <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cyan-accent)' }}>{contact.linkedin}</a>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Detected Skills */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🛠️ Detected Skills ({detectedSkills.length})
            </h3>
            {detectedSkills.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {detectedSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '0.8rem',
                      padding: '0.3rem 0.75rem',
                      borderRadius: '6px',
                      background: 'rgba(99, 102, 241, 0.15)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      color: '#818cf8',
                      fontWeight: 600
                    }}
                  >
                    ✓ {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No technical skills detected in document text.</p>
            )}
          </div>

          {/* Section 3: Summary / Profile */}
          {parsedData.summary && (
            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem' }}>
                📝 Summary / Profile Overview
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: '1.6' }}>
                {parsedData.summary}
              </p>
            </div>
          )}

          {/* Section 4: Education */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🎓 Education History
            </h3>
            {parsedData.education && parsedData.education.length > 0 ? (
              <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                {parsedData.education.map((edu, idx) => (
                  <li key={idx} style={{ marginBottom: '0.4rem' }}>{edu}</li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No education section detected.</p>
            )}
          </div>

          {/* Section 5: Work Experience */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              💼 Work Experience
            </h3>
            {parsedData.experience && parsedData.experience.length > 0 ? (
              <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                {parsedData.experience.map((exp, idx) => (
                  <li key={idx} style={{ marginBottom: '0.4rem' }}>{exp}</li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No work experience section detected.</p>
            )}
          </div>

          {/* Section 6: Key Projects */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🚀 Projects & Accomplishments
            </h3>
            {parsedData.projects && parsedData.projects.length > 0 ? (
              <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                {parsedData.projects.map((proj, idx) => (
                  <li key={idx} style={{ marginBottom: '0.4rem' }}>{proj}</li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No projects section detected.</p>
            )}
          </div>

          {/* Section 7: Certifications & Achievements */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🏆 Certifications & Achievements
            </h3>
            {parsedData.certifications && parsedData.certifications.length > 0 ? (
              <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                {parsedData.certifications.map((cert, idx) => (
                  <li key={idx} style={{ marginBottom: '0.4rem' }}>{cert}</li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No certifications section detected.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
