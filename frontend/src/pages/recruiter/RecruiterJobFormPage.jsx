import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Loader from '../../components/ui/Loader';
import ErrorState from '../../components/ui/ErrorState';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const DOMAIN_OPTIONS = [
  'IT and Software Development',
  'Data Science and Data Analytics',
  'Healthcare',
  'Finance and Accounting',
  'Marketing',
  'Human Resources',
  'Education',
  'Mechanical, Civil, and Electrical Engineering',
  'Business and Management',
  'Other'
];

const JOB_TYPE_OPTIONS = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'];
const EXPERIENCE_OPTIONS = ['Entry-level', 'Mid-level', 'Senior-level', 'Director', 'Executive'];

export default function RecruiterJobFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    domain: 'IT and Software Development',
    jobType: 'Full-time',
    experienceLevel: 'Entry-level',
    salaryMin: '',
    salaryMax: '',
    currency: 'USD',
    requiredSkills: '',
    preferredSkills: '',
    description: '',
    requirements: '',
    applicationDeadline: '',
    isActive: true
  });

  // If editing, fetch existing job details
  useEffect(() => {
    if (isEditing) {
      const fetchJobDetails = async () => {
        setLoading(true);
        try {
          const response = await axios.get(`${API_BASE_URL}/recruiter/jobs/${id}`);
          if (response.data.success && response.data.job) {
            const j = response.data.job;
            setFormData({
              title: j.title || '',
              company: j.company || '',
              location: j.location || '',
              domain: j.domain || 'IT and Software Development',
              jobType: j.jobType || 'Full-time',
              experienceLevel: j.experienceLevel || 'Entry-level',
              salaryMin: j.salary?.min !== undefined ? j.salary.min : '',
              salaryMax: j.salary?.max !== undefined ? j.salary.max : '',
              currency: j.salary?.currency || 'USD',
              requiredSkills: Array.isArray(j.requiredSkills) ? j.requiredSkills.join(', ') : '',
              preferredSkills: Array.isArray(j.preferredSkills) ? j.preferredSkills.join(', ') : '',
              description: j.description || '',
              requirements: Array.isArray(j.requirements) ? j.requirements.join('\n') : (j.requirements || ''),
              applicationDeadline: j.applicationDeadline ? new Date(j.applicationDeadline).toISOString().split('T')[0] : '',
              isActive: j.isActive !== undefined ? j.isActive : true
            });
          } else {
            setErrorMessage('Unable to load job details.');
          }
        } catch (err) {
          console.error('Error fetching job for edit:', err);
          setErrorMessage(err.response?.data?.message || 'Failed to retrieve job details.');
        } finally {
          setLoading(false);
        }
      };
      fetchJobDetails();
    }
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Front-end validations
    if (!formData.title.trim()) {
      setErrorMessage('Job title is required.');
      return;
    }
    if (!formData.company.trim()) {
      setErrorMessage('Company name is required.');
      return;
    }
    if (!formData.location.trim()) {
      setErrorMessage('Location is required.');
      return;
    }
    if (!formData.description.trim()) {
      setErrorMessage('Job description is required.');
      return;
    }

    const parsedRequiredSkills = formData.requiredSkills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const parsedPreferredSkills = formData.preferredSkills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const parsedRequirements = formData.requirements
      ? formData.requirements.split('\n').map((r) => r.trim()).filter(Boolean)
      : [];

    const payload = {
      title: formData.title.trim(),
      company: formData.company.trim(),
      location: formData.location.trim(),
      domain: formData.domain,
      jobType: formData.jobType,
      experienceLevel: formData.experienceLevel,
      description: formData.description.trim(),
      requiredSkills: parsedRequiredSkills,
      preferredSkills: parsedPreferredSkills,
      requirements: parsedRequirements,
      salary: {
        min: formData.salaryMin ? Number(formData.salaryMin) : undefined,
        max: formData.salaryMax ? Number(formData.salaryMax) : undefined,
        currency: formData.currency || 'USD'
      },
      applicationDeadline: formData.applicationDeadline || null,
      isActive: formData.isActive
    };

    setSubmitting(true);
    try {
      if (isEditing) {
        const response = await axios.put(`${API_BASE_URL}/recruiter/jobs/${id}`, payload);
        if (response.data.success) {
          setSuccessMessage('Job posting updated successfully!');
          setTimeout(() => {
            navigate('/recruiter/jobs');
          }, 1000);
        }
      } else {
        const response = await axios.post(`${API_BASE_URL}/recruiter/jobs`, payload);
        if (response.data.success) {
          setSuccessMessage('Job posting created successfully!');
          setTimeout(() => {
            navigate('/recruiter/jobs');
          }, 1000);
        }
      }
    } catch (err) {
      console.error('Job submission error:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to save job posting.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader message="Loading job posting details..." />;
  }

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button
            onClick={() => navigate('/recruiter/jobs')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--cyan-accent)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            ← Back to Job Postings
          </button>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            {isEditing ? 'Edit Job Posting ✏️' : 'Create New Job Posting ➕'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Define candidate skill criteria, domain context, and requirements for AI resume matching.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div
          style={{
            padding: '1rem',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: '0.9rem'
          }}
        >
          ⚠️ {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          style={{
            padding: '1rem',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            fontSize: '0.9rem'
          }}
        >
          ✅ {successMessage}
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '2rem' }}>
        {/* Section 1: Core Role Details */}
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            1. Role & Organization
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                Job Title <span style={{ color: '#f87171' }}>*</span>
              </label>
              <input
                type="text"
                name="title"
                placeholder="e.g. Senior Machine Learning Engineer"
                value={formData.title}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.9rem',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                Company Name <span style={{ color: '#f87171' }}>*</span>
              </label>
              <input
                type="text"
                name="company"
                placeholder="e.g. SkillSync Tech"
                value={formData.company}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.9rem',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                Location <span style={{ color: '#f87171' }}>*</span>
              </label>
              <input
                type="text"
                name="location"
                placeholder="e.g. San Francisco, CA or Remote"
                value={formData.location}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.9rem',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                Professional Domain <span style={{ color: '#f87171' }}>*</span>
              </label>
              <select
                name="domain"
                value={formData.domain}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.9rem',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              >
                {DOMAIN_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Employment Specifics */}
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            2. Employment Specifics & Compensation
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                Employment Type
              </label>
              <select
                name="jobType"
                value={formData.jobType}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.9rem',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              >
                {JOB_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                Experience Level
              </label>
              <select
                name="experienceLevel"
                value={formData.experienceLevel}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.9rem',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              >
                {EXPERIENCE_OPTIONS.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                Min Salary ($)
              </label>
              <input
                type="number"
                name="salaryMin"
                placeholder="e.g. 80000"
                value={formData.salaryMin}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.9rem',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                Max Salary ($)
              </label>
              <input
                type="number"
                name="salaryMax"
                placeholder="e.g. 120000"
                value={formData.salaryMax}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.9rem',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>
        </div>

        {/* Section 3: AI Matching Skills Engine */}
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            3. Skills for AI Candidate Matching
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Separate skills with commas. Our multi-domain matching engine compares these directly against applicant resumes.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--cyan-accent)', marginBottom: '0.35rem', fontWeight: 700 }}>
                Required Skills (Comma separated)
              </label>
              <input
                type="text"
                name="requiredSkills"
                placeholder="e.g. Python, PyTorch, Machine Learning, FastApi, Docker"
                value={formData.requiredSkills}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.9rem',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid rgba(6, 182, 212, 0.4)',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                Preferred / Bonus Skills (Comma separated)
              </label>
              <input
                type="text"
                name="preferredSkills"
                placeholder="e.g. Kubernetes, AWS, MLOps, LangChain"
                value={formData.preferredSkills}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.9rem',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>
        </div>

        {/* Section 4: Descriptions & Requirements */}
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            4. Job Description & Responsibilities
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                Role Description <span style={{ color: '#f87171' }}>*</span>
              </label>
              <textarea
                name="description"
                rows={5}
                placeholder="Outline the responsibilities, team impact, and daily workflow..."
                value={formData.description}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 0.9rem',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  resize: 'vertical'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                Key Qualifications / Responsibilities (One item per line)
              </label>
              <textarea
                name="requirements"
                rows={4}
                placeholder="3+ years experience with production ML models&#10;BS or MS in Computer Science or related field&#10;Demonstrated track record of delivering scalable APIs"
                value={formData.requirements}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.9rem',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>
        </div>

        {/* Section 5: Application Settings & Status */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
              Application Deadline (Optional)
            </label>
            <input
              type="date"
              name="applicationDeadline"
              value={formData.applicationDeadline}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.65rem 0.9rem',
                borderRadius: '8px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: '#fff',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', paddingTop: '1.25rem' }}>
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              style={{ width: '18px', height: '18px', accentColor: 'var(--cyan-accent)' }}
            />
            <label htmlFor="isActive" style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
              Accepting Applications Immediately (Active)
            </label>
          </div>
        </div>

        {/* Form Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <button
            type="button"
            onClick={() => navigate('/recruiter/jobs')}
            className="btn"
            style={{ background: 'rgba(255, 255, 255, 0.06)', color: '#fff' }}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{ padding: '0.65rem 1.75rem', fontWeight: 700 }}
          >
            {submitting ? 'Saving...' : isEditing ? 'Update Job Posting' : 'Publish Job Posting'}
          </button>
        </div>
      </form>
    </div>
  );
}
