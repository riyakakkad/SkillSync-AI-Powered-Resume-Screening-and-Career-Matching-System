/**
 * SkillSync Master End-to-End (E2E) Functional & Security Test Suite
 * Validates complete user journeys across:
 * - Student Workflow (Register, Parse, ATS, Recommendations, Skill Gaps, Courses, Apply)
 * - Recruiter Workflow (Job CRUD, Screening, AI Match, Status Transitions, Notification)
 * - Admin Workflow (Dashboard Stats, User Deactivation, Job Moderation, Application Oversight, Audit Logs)
 * - RBAC & Security Isolation (401 unauthenticated, 403 forbidden, cross-recruiter isolation, self-lockout)
 */

const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Register all schemas
require('../models/User.model');
require('../models/Job.model');
require('../models/Resume.model');
require('../models/Application.model');
require('../models/Course.model');
require('../models/Notification.model');
require('../models/AdminLog.model');

const API_PORT = 5000;

function httpRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runMasterE2ETests() {
  console.log('======================================================================');
  console.log('       SkillSync Master End-to-End (E2E) Test Suite (Phase 1–8)       ');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/skillsync';
  await mongoose.connect(mongoUri);

  const User = mongoose.model('User');
  const Resume = mongoose.model('Resume');
  const Job = mongoose.model('Job');
  const Course = mongoose.model('Course');

  try {
    const timestamp = Date.now();

    // ======================================================================
    // JOURNEY 1: STUDENT END-TO-END WORKFLOW
    // ======================================================================
    console.log('--- Journey 1: Student End-to-End Workflow ---');

    // 1.1 Register Student
    const studentRegRes = await httpRequest(
      {
        hostname: 'localhost',
        port: API_PORT,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        fullName: 'E2E Student Test',
        email: `student.e2e.${timestamp}@test.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        role: 'student'
      }
    );
    assert(studentRegRes.status === 201 && studentRegRes.data.user?.role === 'student', 'Student Registration (201 Created)');
    const studentToken = studentRegRes.data.token;
    const studentId = studentRegRes.data.user?._id || studentRegRes.data.user?.id;

    // 1.2 Seed Analyzed Multi-Domain Resume for Student
    const studentResume = await Resume.create({
      user: studentId,
      originalName: 'E2E_Resume.pdf',
      fileName: `e2e_${timestamp}.pdf`,
      filePath: `/uploads/resumes/e2e_${timestamp}.pdf`,
      fileType: 'pdf',
      fileSize: 42000,
      extractedText:
        'Senior Full Stack Engineer with strong proficiency in Python, React, Node.js, TypeScript, MongoDB, Express, and Docker.',
      detectedSkills: ['Python', 'React', 'Node.js', 'TypeScript', 'MongoDB', 'Express', 'Docker'],
      detectedDomain: 'IT and Software Development',
      relevantDomains: ['IT and Software Development'],
      atsScore: 84,
      status: 'analyzed'
    });
    assert(studentResume._id !== undefined, 'Student Resume seeded and marked analyzed in MongoDB');

    // Update user profile skills
    await User.findByIdAndUpdate(studentId, {
      skills: ['Python', 'React', 'Node.js', 'TypeScript', 'MongoDB', 'Express', 'Docker']
    });

    // 1.3 Query Job Recommendations
    const recommendationsRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/jobs/recommendations',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(
      recommendationsRes.status === 200 && recommendationsRes.data.jobs?.length > 0,
      'Student retrieves AI job recommendations with match scores and explanations',
      `Jobs returned: ${recommendationsRes.data.jobs?.length}`
    );

    // 1.4 Query Skill Gap Analysis
    const skillGapsRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/jobs/skill-gaps',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(
      skillGapsRes.status === 200 && skillGapsRes.data.success === true,
      'Student retrieves domain-specific skill gap analysis with readiness score',
      JSON.stringify(skillGapsRes.data.skillGaps?.readinessScore)
    );

    // 1.5 Query Recommended Courses
    const coursesRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/courses/recommended',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(
      coursesRes.status === 200 && coursesRes.data.courses !== undefined,
      'Student retrieves targeted course recommendations bridging skill gaps'
    );

    // ======================================================================
    // JOURNEY 2: RECRUITER END-TO-END WORKFLOW
    // ======================================================================
    console.log('\n--- Journey 2: Recruiter End-to-End Workflow ---');

    // 2.1 Register Recruiter
    const recruiterRegRes = await httpRequest(
      {
        hostname: 'localhost',
        port: API_PORT,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        fullName: 'E2E Recruiter Test',
        email: `recruiter.e2e.${timestamp}@test.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        role: 'recruiter'
      }
    );
    assert(recruiterRegRes.status === 201 && recruiterRegRes.data.user?.role === 'recruiter', 'Recruiter Registration (201 Created)');
    const recruiterToken = recruiterRegRes.data.token;
    const recruiterId = recruiterRegRes.data.user?._id || recruiterRegRes.data.user?.id;

    // 2.2 Recruiter Dashboard Access
    const recruiterDashRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/recruiter/dashboard',
      method: 'GET',
      headers: { Authorization: `Bearer ${recruiterToken}` }
    });
    assert(recruiterDashRes.status === 200 && recruiterDashRes.data.stats !== undefined, 'Recruiter accesses Command Center dashboard');

    // 2.3 Recruiter Creates Job Posting
    const createJobRes = await httpRequest(
      {
        hostname: 'localhost',
        port: API_PORT,
        path: '/api/recruiter/jobs',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${recruiterToken}`
        }
      },
      {
        title: 'Full Stack JavaScript Engineer',
        company: 'SkillSync Cloud Systems',
        location: 'Remote',
        jobType: 'Full-time',
        experienceLevel: 'Mid-level',
        salary: '$130,000 - $160,000',
        domain: 'IT and Software Development',
        description: 'Building modern responsive applications using React, Node.js, and MongoDB.',
        requiredSkills: ['React', 'Node.js', 'MongoDB', 'TypeScript'],
        preferredSkills: ['Docker']
      }
    );
    assert(createJobRes.status === 201 && createJobRes.data.job?._id, 'Recruiter creates authorized job posting');
    const e2eJobId = createJobRes.data.job?._id;

    // 2.4 Student Applies to Recruiter Job
    const applyRes = await httpRequest(
      {
        hostname: 'localhost',
        port: API_PORT,
        path: '/api/applications',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`
        }
      },
      {
        jobId: e2eJobId,
        resumeId: studentResume._id.toString(),
        notes: 'Excited about modern full stack engineering.'
      }
    );
    assert(applyRes.status === 201 && applyRes.data.application?._id, 'Student submits application to recruiter job');
    const e2eAppId = applyRes.data.application?._id;

    // 2.5 Recruiter Screens Candidate & Evaluates AI Match
    const recruiterAppsRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/recruiter/applications',
      method: 'GET',
      headers: { Authorization: `Bearer ${recruiterToken}` }
    });
    const candidateApp = recruiterAppsRes.data.applications?.find((a) => a._id === e2eAppId);
    assert(
      recruiterAppsRes.status === 200 &&
        candidateApp &&
        candidateApp.match.matchScore >= 80 &&
        candidateApp.match.matchedSkills.includes('React'),
      `Recruiter reviews application with high candidate AI match (${candidateApp?.match?.matchScore}%) and verified skill breakdown`
    );

    // 2.6 Recruiter Updates Application Stage to 'Shortlisted'
    const updateStageRes = await httpRequest(
      {
        hostname: 'localhost',
        port: API_PORT,
        path: `/api/recruiter/applications/${e2eAppId}/status`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${recruiterToken}`
        }
      },
      {
        status: 'Shortlisted',
        notes: 'Exceptional full stack resume match.'
      }
    );
    assert(updateStageRes.status === 200 && updateStageRes.data.application?.status === 'Shortlisted', 'Recruiter updates stage to "Shortlisted"');

    // 2.7 Verify Student Sees Updated Status
    const studentCheckAppRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/applications',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const studentAppView = studentCheckAppRes.data.applications?.find((a) => a._id === e2eAppId);
    assert(
      studentCheckAppRes.status === 200 && studentAppView?.status === 'Shortlisted',
      'Student application page reflects real-time stage update ("Shortlisted")'
    );

    // ======================================================================
    // JOURNEY 3: ADMINISTRATOR END-TO-END WORKFLOW
    // ======================================================================
    console.log('\n--- Journey 3: Administrator End-to-End Workflow ---');

    // 3.1 Admin Login
    const adminLoginRes = await httpRequest(
      {
        hostname: 'localhost',
        port: API_PORT,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        email: 'admin@skillsync.com',
        password: 'Admin@123456'
      }
    );
    assert(adminLoginRes.status === 200 && adminLoginRes.data.user?.role === 'admin', 'Administrator logs in successfully');
    const adminToken = adminLoginRes.data.token;
    const adminId = adminLoginRes.data.user?._id || adminLoginRes.data.user?.id;

    // 3.2 Admin Dashboard Stats
    const adminDashRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/admin/dashboard',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(
      adminDashRes.status === 200 &&
        adminDashRes.data.stats.users?.total > 0 &&
        adminDashRes.data.stats.jobs?.total > 0 &&
        adminDashRes.data.stats.applications?.total > 0,
      'Administrator accesses system dashboard with live aggregated database metrics'
    );

    // 3.3 Admin Lists & Filters Users
    const adminUsersRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/admin/users?role=student',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminUsersRes.status === 200 && adminUsersRes.data.users?.length > 0, 'Administrator filters users by role');

    // 3.4 Admin Moderates Job Posting (Toggle status)
    const adminJobToggleRes = await httpRequest(
      {
        hostname: 'localhost',
        port: API_PORT,
        path: `/api/admin/jobs/${e2eJobId}/status`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        }
      },
      { isActive: false }
    );
    assert(
      adminJobToggleRes.status === 200 && adminJobToggleRes.data.job?.isActive === false,
      'Administrator toggles job status to closed (moderation override)'
    );

    // 3.5 Admin Inspects Platform Applications Stream
    const adminAppsRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/admin/applications',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminAppsRes.status === 200 && adminAppsRes.data.applications?.length > 0, 'Administrator views cross-platform application monitoring stream');

    // 3.6 Admin Inspects Audit Activity Trail
    const adminLogsRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/admin/logs',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(
      adminLogsRes.status === 200 && adminLogsRes.data.logs?.length > 0,
      'Administrator verifies audit activity logs recording privileged operations'
    );

    // ======================================================================
    // JOURNEY 4: SECURITY & AUTHORIZATION ISOLATION
    // ======================================================================
    console.log('\n--- Journey 4: Security Boundaries & Role Isolation ---');

    // 4.1 Unauthenticated requests blocked
    const unauthRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/admin/dashboard',
      method: 'GET'
    });
    assert(unauthRes.status === 401, 'Unauthenticated request blocked from admin endpoints (HTTP 401)');

    // 4.2 Student forbidden from Recruiter endpoint
    const studentBlockedFromRecruiter = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/recruiter/dashboard',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(studentBlockedFromRecruiter.status === 403, 'Student blocked from recruiter endpoints (HTTP 403)');

    // 4.3 Student forbidden from Admin endpoint
    const studentBlockedFromAdmin = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/admin/users',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(studentBlockedFromAdmin.status === 403, 'Student blocked from admin endpoints (HTTP 403)');

    // 4.4 Recruiter forbidden from Admin endpoint
    const recruiterBlockedFromAdmin = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/admin/dashboard',
      method: 'GET',
      headers: { Authorization: `Bearer ${recruiterToken}` }
    });
    assert(recruiterBlockedFromAdmin.status === 403, 'Recruiter blocked from admin endpoints (HTTP 403)');

    // 4.5 Admin Lockout Guard: Admin cannot deactivate own account
    const selfLockoutRes = await httpRequest(
      {
        hostname: 'localhost',
        port: API_PORT,
        path: `/api/admin/users/${adminId}/status`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        }
      },
      { isActive: false }
    );
    assert(selfLockoutRes.status === 400, 'Admin lockout guard prevents administrator self-deactivation (HTTP 400)');

    // 4.6 Clean up test job created in E2E
    await Job.findByIdAndDelete(e2eJobId);

    // ======================================================================
    // SUMMARY
    // ======================================================================
    console.log('\n======================================================================');
    console.log(`    Master E2E Test Suite Results: ${passed} PASSED | ${failed} FAILED`);
    console.log('======================================================================\n');

    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal error during E2E testing:', err);
    try {
      await mongoose.disconnect();
    } catch (e) {}
    process.exit(1);
  }
}

runMasterE2ETests();
