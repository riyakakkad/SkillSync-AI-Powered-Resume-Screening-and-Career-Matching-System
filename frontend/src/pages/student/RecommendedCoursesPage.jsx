import React, { useState, useEffect } from 'react';
import axios from 'axios';
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

export default function RecommendedCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [targetDomain, setTargetDomain] = useState('General');
  const [identifiedSkillGaps, setIdentifiedSkillGaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [domainFilter, setDomainFilter] = useState('All Domains');
  const [onlyGapBridging, setOnlyGapBridging] = useState(false);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/courses/recommended`);
      if (response.data.success) {
        setCourses(response.data.courses || []);
        setTargetDomain(response.data.targetDomain || 'General');
        setIdentifiedSkillGaps(response.data.identifiedSkillGaps || []);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load recommended courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.skillCovered.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.instructor && course.instructor.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDomain = domainFilter === 'All Domains' || course.domain === domainFilter;
    const matchesGapOnly = !onlyGapBridging || course.bridgesGap;

    return matchesSearch && matchesDomain && matchesGapOnly;
  });

  if (loading) {
    return <Loader message="Matching curated courses against your identified skill gaps..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchCourses} />;
  }

  const gapBridgingCount = courses.filter((c) => c.bridgesGap).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
            Personalized Course Recommendations
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Curated learning resources selected to bridge your missing skill gaps in <strong>{targetDomain}</strong>.
          </p>
        </div>

        <button onClick={fetchCourses} className="btn" style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '0.85rem' }}>
          🔄 Refresh Pathways
        </button>
      </div>

      {/* Domain & Gap Context Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(6, 182, 212, 0.1) 100%)',
          borderColor: 'rgba(99, 102, 241, 0.3)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '1.3rem' }}>🎯</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
              Target Domain: {targetDomain}
            </span>
            <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
              {gapBridgingCount} Gap-Closing Courses Available
            </span>
          </div>

          <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0 }}>
            {identifiedSkillGaps.length > 0
              ? `Closing missing skills: ${identifiedSkillGaps.slice(0, 5).join(', ')}${identifiedSkillGaps.length > 5 ? '...' : ''}`
              : 'Courses aligned with industry benchmarks to strengthen your portfolio.'}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        className="card"
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
      >
        <input
          type="text"
          placeholder="Search by course name or skill..."
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

        <select
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
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

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff', fontSize: '0.875rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={onlyGapBridging}
            onChange={(e) => setOnlyGapBridging(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--cyan-accent)' }}
          />
          Gap-Bridging Only
        </label>

        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          Showing {filteredCourses.length} of {courses.length} courses
        </span>
      </div>

      {/* Course Cards Grid */}
      {filteredCourses.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filteredCourses.map((course) => (
            <div
              key={course._id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem',
                border: course.bridgesGap ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-color)',
                background: course.bridgesGap ? 'rgba(16, 185, 129, 0.03)' : 'var(--card-bg)'
              }}
            >
              <div>
                {/* Header: Platform & Rating */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span className="badge badge-pending" style={{ fontSize: '0.72rem' }}>
                    {course.platform}
                  </span>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    ★ {course.rating}
                  </div>
                </div>

                {/* Gap Bridging Badge */}
                {course.bridgesGap && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '9999px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        color: '#34d399',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      ⚡ Bridges Gap: {course.gapSkill}
                    </span>
                  </div>
                )}

                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.35rem' }}>
                  {course.courseName}
                </h3>

                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Instructor: <span style={{ color: '#fff' }}>{course.instructor}</span> • Duration: {course.duration}
                </p>

                {/* Domain & Skills Covered */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.5rem' }}>
                  {course.domain && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Domain: <span style={{ color: '#cbd5e1' }}>{course.domain}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Skill Focus:</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--cyan-accent)' }}>
                      {course.skillCovered}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div
                style={{
                  paddingTop: '0.85rem',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span className="badge badge-pending" style={{ fontSize: '0.72rem' }}>
                  {course.difficulty}
                </span>

                <a
                  href={course.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ padding: '0.4rem 0.95rem', fontSize: '0.825rem' }}
                >
                  Enroll / View Course ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="🎓"
          title="No Courses Found"
          description="Try broadening your domain or search filters to find relevant learning paths."
        />
      )}
    </div>
  );
}
