import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import JobCard from '../../components/ui/JobCard';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const ALL_DOMAINS = [
  'All Domains',
  'IT and Software Development',
  'Data Science and Data Analytics',
  'Healthcare',
  'Finance and Accounting',
  'Marketing',
  'Human Resources',
  'Education',
  'Mechanical, Civil, and Electrical Engineering',
  'Business and Management'
];

export default function JobMatchingPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [candidateProfile, setCandidateProfile] = useState({
    domain: 'General',
    skills: [],
    hasResume: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterDomain, setFilterDomain] = useState('All Domains');
  const [minMatchScore, setMinMatchScore] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // First attempt to fetch AI recommendations
      const [recsRes, appsRes] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/jobs/recommendations`),
        axios.get(`${API_BASE_URL}/applications`)
      ]);

      if (recsRes.status === 'fulfilled' && recsRes.value.data.success) {
        setJobs(recsRes.value.data.jobs || []);
        setCandidateProfile({
          domain: recsRes.value.data.candidateDomain || 'General',
          relevantDomains: recsRes.value.data.candidateRelevantDomains || [],
          skills: recsRes.value.data.candidateSkills || [],
          hasResume: recsRes.value.data.hasAnalyzedResume || false
        });
      } else {
        // Fallback to basic /jobs endpoint
        const fallbackRes = await axios.get(`${API_BASE_URL}/jobs`);
        if (fallbackRes.data.success) {
          setJobs(fallbackRes.data.jobs || []);
        }
      }

      if (appsRes.status === 'fulfilled' && appsRes.value.data.success) {
        setApplications(appsRes.value.data.applications || []);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load available job postings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveJob = async (jobId) => {
    try {
      await axios.post(`${API_BASE_URL}/jobs/${jobId}/save`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving job');
    }
  };

  const handleUnsaveJob = async (jobId) => {
    try {
      await axios.delete(`${API_BASE_URL}/jobs/${jobId}/save`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error removing saved job');
    }
  };

  const handleApply = async (job) => {
    try {
      await axios.post(`${API_BASE_URL}/applications`, { jobId: job._id });
      alert(`Successfully submitted application for ${job.title}!`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error applying for job');
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.requiredSkills && job.requiredSkills.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesType = filterType === 'All' || job.jobType === filterType;
    const matchesDomain = filterDomain === 'All Domains' || job.domain === filterDomain;
    const matchesMinScore = (job.matchScore || 0) >= minMatchScore;

    return matchesSearch && matchesType && matchesDomain && matchesMinScore;
  });

  if (loading) {
    return <Loader message="Analyzing job postings and computing AI similarity scores..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Title & Context */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
            AI Job Matching & Recommendations
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Personalized role recommendations ranked via pure-Python TF-IDF & Cosine Similarity across 9 professional domains.
          </p>
        </div>

        <button onClick={fetchData} className="btn" style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '0.85rem' }}>
          🔄 Refresh Matches
        </button>
      </div>

      {/* Candidate Profile Context Banner */}
      {candidateProfile.hasResume ? (
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.1) 100%)',
            borderColor: 'rgba(16, 185, 129, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            padding: '1.25rem 1.5rem'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '1.25rem' }}>🎯</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
                Active Profile: {candidateProfile.domain}
              </span>
              <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                AI Verified
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0 }}>
              Matching based on {candidateProfile.skills.length} extracted skills from your resume. Jobs aligned with your domain and skill profile are ranked at the top.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => navigate('/student/skill-gaps')}
              className="btn btn-primary"
              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
            >
              Analyze Skill Gaps →
            </button>
          </div>
        </div>
      ) : (
        <div
          className="card"
          style={{
            background: 'rgba(245, 158, 11, 0.1)',
            borderColor: 'rgba(245, 158, 11, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            padding: '1.25rem 1.5rem'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.25rem' }}>💡</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
                Upload Your Resume for Personalized AI Scores
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Upload your resume in Resume Upload to unlock personalized match scores, missing skill breakdowns, and prioritized recommendations.
            </p>
          </div>

          <button
            onClick={() => navigate('/student/resume-upload')}
            className="btn btn-primary"
            style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
          >
            Upload Resume
          </button>
        </div>
      )}

      {/* Filter Controls Bar */}
      <div
        className="card"
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          gap: '0.85rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
      >
        {/* Search */}
        <input
          type="text"
          placeholder="Search title, company, skill..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '0.55rem 0.9rem',
            borderRadius: '8px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            color: '#fff',
            fontSize: '0.875rem',
            flex: '1 1 200px'
          }}
        />

        {/* Domain Filter */}
        <select
          value={filterDomain}
          onChange={(e) => setFilterDomain(e.target.value)}
          style={{
            padding: '0.55rem 0.9rem',
            borderRadius: '8px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            color: '#fff',
            fontSize: '0.875rem',
            flex: '1 1 180px'
          }}
        >
          {ALL_DOMAINS.map((domain) => (
            <option key={domain} value={domain}>
              {domain}
            </option>
          ))}
        </select>

        {/* Job Type Filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{
            padding: '0.55rem 0.9rem',
            borderRadius: '8px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            color: '#fff',
            fontSize: '0.875rem'
          }}
        >
          <option value="All">All Job Types</option>
          <option value="Full-time">Full-time</option>
          <option value="Part-time">Part-time</option>
          <option value="Internship">Internship</option>
          <option value="Contract">Contract</option>
          <option value="Remote">Remote</option>
        </select>

        {/* Minimum Match Score Filter */}
        <select
          value={minMatchScore}
          onChange={(e) => setMinMatchScore(Number(e.target.value))}
          style={{
            padding: '0.55rem 0.9rem',
            borderRadius: '8px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            color: '#fff',
            fontSize: '0.875rem'
          }}
        >
          <option value={0}>All Match Scores</option>
          <option value={70}>High Matches (70%+)</option>
          <option value={50}>Moderate+ Matches (50%+)</option>
        </select>

        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          Showing {filteredJobs.length} of {jobs.length} roles
        </span>
      </div>

      {/* Job Cards Grid */}
      {filteredJobs.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filteredJobs.map((job) => {
            const isApplied = applications.some((app) => (app.job?._id || app.job) === job._id);
            return (
              <JobCard
                key={job._id}
                job={job}
                onSave={handleSaveJob}
                onUnsave={handleUnsaveJob}
                onApply={handleApply}
                isSaved={job.isSaved}
                isApplied={isApplied}
              />
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon="💼"
          title="No Matching Jobs Found"
          description="Try broadening your domain, job type, or minimum match score filters."
        />
      )}
    </div>
  );
}
