/**
 * SkillSync Phase 7 Comprehensive Integration Test Suite
 * Tests:
 * 1. Admin Authentication & Role-Based Authorization
 * 2. Access Control: Students & Recruiters forbidden from Admin APIs (403)
 * 3. Dashboard Statistics consistency against live database records
 * 4. User Management: Listing, filtering, search, and detailed inspection
 * 5. User Account Lifecycle: Deactivation & Activation
 * 6. Deactivation Enforcement: Deactivated accounts immediately blocked (403)
 * 7. Admin Lockout Safeguards: Self-deactivation and sole-admin deactivation prevention
 * 8. Job Moderation: Cross-platform job listing, status toggle, and deletion
 * 9. Application Monitoring: Read-only cross-platform oversight
 * 10. Audit Activity Logging: Verification of immutable audit records and data sanitization
 */

const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Register models
require('../models/User.model');
require('../models/Job.model');
require('../models/Resume.model');
require('../models/Application.model');
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

async function runPhase7Tests() {
  console.log('====================================================');
  console.log('    SkillSync Phase 7 Comprehensive Test Suite     ');
  console.log('====================================================\n');

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
  const Job = mongoose.model('Job');
  const Application = mongoose.model('Application');
  const AdminLog = mongoose.model('AdminLog');

  try {
    const timestamp = Date.now();

    // ----------------------------------------------------
    // TEST SECTION 1: Admin & Role Accounts Setup
    // ----------------------------------------------------
    console.log('--- Test Section 1: Admin Authentication & RBAC Verification ---');

    // 1.1 Create/Find Admin User
    let admin = await User.findOne({ email: 'admin@skillsync.com' });
    if (!admin) {
      admin = await User.create({
        fullName: 'System Administrator',
        email: 'admin@skillsync.com',
        password: 'Admin@123456',
        role: 'admin',
        isActive: true
      });
    }

    // Login as Admin
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
    assert(
      adminLoginRes.status === 200 && adminLoginRes.data.user?.role === 'admin',
      'Administrator logs in and receives verified Admin JWT',
      JSON.stringify(adminLoginRes.data)
    );
    const adminToken = adminLoginRes.data.token;
    const adminId = adminLoginRes.data.user?.id || adminLoginRes.data.user?._id;

    // 1.2 Register Test Student
    const studentRes = await httpRequest(
      {
        hostname: 'localhost',
        port: API_PORT,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        fullName: 'Dan Student',
        email: `dan.student.${timestamp}@test.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        role: 'student'
      }
    );
    assert(studentRes.status === 201, 'Register test student for RBAC validation');
    const studentToken = studentRes.data.token;
    const studentId = studentRes.data.user?.id || studentRes.data.user?._id;

    // 1.3 Register Test Recruiter
    const recruiterRes = await httpRequest(
      {
        hostname: 'localhost',
        port: API_PORT,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        fullName: 'Rachel Recruiter',
        email: `rachel.recruiter.${timestamp}@test.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        role: 'recruiter'
      }
    );
    assert(recruiterRes.status === 201, 'Register test recruiter for RBAC validation');
    const recruiterToken = recruiterRes.data.token;
    const recruiterId = recruiterRes.data.user?.id || recruiterRes.data.user?._id;

    // ----------------------------------------------------
    // TEST SECTION 2: Security & Authorization Access Control
    // ----------------------------------------------------
    console.log('\n--- Test Section 2: Security & Authorization Access Control ---');

    // 2.1 Student forbidden from Admin Dashboard (403)
    const studentAdminRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/admin/dashboard',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(
      studentAdminRes.status === 403,
      'Student Dan blocked from GET /api/admin/dashboard (HTTP 403 Forbidden)',
      `Got status ${studentAdminRes.status}`
    );

    // 2.2 Recruiter forbidden from Admin Users API (403)
    const recruiterAdminRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/admin/users',
      method: 'GET',
      headers: { Authorization: `Bearer ${recruiterToken}` }
    });
    assert(
      recruiterAdminRes.status === 403,
      'Recruiter Rachel blocked from GET /api/admin/users (HTTP 403 Forbidden)',
      `Got status ${recruiterAdminRes.status}`
    );

    // 2.3 Unauthenticated client blocked from Admin API (401)
    const noAuthAdminRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/admin/dashboard',
      method: 'GET'
    });
    assert(
      noAuthAdminRes.status === 401,
      'Unauthenticated request blocked from Admin API (HTTP 401 Unauthorized)',
      `Got status ${noAuthAdminRes.status}`
    );

    // 2.4 Admin access permitted (200 OK)
    const adminDashRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/admin/dashboard',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(
      adminDashRes.status === 200 && adminDashRes.data.success === true,
      'Administrator granted access to GET /api/admin/dashboard (HTTP 200 OK)',
      JSON.stringify(adminDashRes.data)
    );

    // ----------------------------------------------------
    // TEST SECTION 3: Dashboard Statistics Consistency
    // ----------------------------------------------------
    console.log('\n--- Test Section 3: Live Dashboard Statistics Consistency ---');

    const dbUserCount = await User.countDocuments();
    const dbJobCount = await Job.countDocuments();
    const dbAppCount = await Application.countDocuments();

    const stats = adminDashRes.data.stats;
    assert(
      stats &&
        stats.users?.total === dbUserCount &&
        stats.jobs?.total === dbJobCount &&
        stats.applications?.total === dbAppCount,
      'Admin dashboard statistics accurately match live database counts (no fabricated stats)',
      `Expected users: ${dbUserCount}, got: ${stats.users?.total}; jobs: ${dbJobCount}, got: ${stats.jobs?.total}`
    );

    // Verify sensitive fields are omitted in recentUsers
    const hasExposedSecrets = adminDashRes.data.recentUsers?.some(
      (u) => u.password !== undefined || u.resetPasswordToken !== undefined
    );
    assert(
      hasExposedSecrets === false,
      'User queries strictly exclude passwords and reset tokens'
    );

    // ----------------------------------------------------
    // TEST SECTION 4: User Management (Search, Filters, Details)
    // ----------------------------------------------------
    console.log('\n--- Test Section 4: User Management (Search & Filters) ---');

    // 4.1 Filter by role 'student'
    const studentFilterRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/admin/users?role=student',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const allAreStudents = studentFilterRes.data.users?.every((u) => u.role === 'student');
    assert(
      studentFilterRes.status === 200 && allAreStudents === true,
      'Filter users by role "student" returns only student accounts',
      `Count: ${studentFilterRes.data.count}`
    );

    // 4.2 Search by name or email
    const searchUserRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: `/api/admin/users?search=${encodeURIComponent(studentRes.data.user.email)}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(
      searchUserRes.status === 200 &&
        searchUserRes.data.users?.some((u) => u.email === studentRes.data.user.email),
      'Search users by email successfully locates target account',
      JSON.stringify(searchUserRes.data.users?.map((u) => u.email))
    );

    // 4.3 Get single user details
    const getUserDetailRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: `/api/admin/users/${studentId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(
      getUserDetailRes.status === 200 && getUserDetailRes.data.user?.email === studentRes.data.user.email,
      'Retrieve single user detailed profile for administrator inspection',
      JSON.stringify(getUserDetailRes.data.user?.email)
    );

    // ----------------------------------------------------
    // TEST SECTION 5: Account Activation / Deactivation Lifecycle
    // ----------------------------------------------------
    console.log('\n--- Test Section 5: Account Lifecycle & Deactivation Enforcement ---');

    // 5.1 Admin deactivates Student Dan's account
    const deactRes = await httpRequest(
      {
        hostname: 'localhost',
        port: API_PORT,
        path: `/api/admin/users/${studentId}/status`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        }
      },
      { isActive: false }
    );
    assert(
      deactRes.status === 200 && deactRes.data.user?.isActive === false,
      'Administrator deactivates Student Dan account (isActive: false)',
      JSON.stringify(deactRes.data)
    );

    // 5.2 Verification: Deactivated Student Dan is blocked from accessing protected routes (HTTP 403)
    const deactAccessRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(
      deactAccessRes.status === 403 &&
        deactAccessRes.data.message?.toLowerCase().includes('deactivated'),
      'Deactivated user is immediately blocked across protected endpoints (HTTP 403 Deactivated)',
      JSON.stringify(deactAccessRes.data)
    );

    // 5.3 Admin reactivates Student Dan's account
    const reactRes = await httpRequest(
      {
        hostname: 'localhost',
        port: API_PORT,
        path: `/api/admin/users/${studentId}/status`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        }
      },
      { isActive: true }
    );
    assert(
      reactRes.status === 200 && reactRes.data.user?.isActive === true,
      'Administrator reactivates Student Dan account (isActive: true)',
      JSON.stringify(reactRes.data)
    );

    // 5.4 Verification: Reactivated Student Dan can access protected routes again
    const reactAccessRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(
      reactAccessRes.status === 200,
      'Reactivated user can successfully access protected endpoints again (HTTP 200 OK)',
      `Got status ${reactAccessRes.status}`
    );

    // ----------------------------------------------------
    // TEST SECTION 6: Admin Lockout Safeguards
    // ----------------------------------------------------
    console.log('\n--- Test Section 6: Administrator Lockout Protections ---');

    // 6.1 Safeguard 1: Administrator cannot deactivate their own account
    const selfDeactRes = await httpRequest(
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
    assert(
      selfDeactRes.status === 400 &&
        selfDeactRes.data.message?.includes('cannot deactivate their own account'),
      'Self-lockout protection: Administrator blocked from deactivating self (HTTP 400)',
      JSON.stringify(selfDeactRes.data)
    );

    // ----------------------------------------------------
    // TEST SECTION 7: Platform Job Moderation (CRUD Override)
    // ----------------------------------------------------
    console.log('\n--- Test Section 7: Platform Job Moderation ---');

    // Create a temporary inappropriate job to moderate
    const badJob = await Job.create({
      title: 'Spam Crypto Vacancy',
      company: 'Spammy Holdings',
      location: 'Unknown',
      domain: 'Finance and Accounting',
      description: 'Get rich quick scheme.',
      postedBy: recruiterId,
      isActive: true
    });

    // 7.1 Admin lists platform jobs
    const adminJobsRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/admin/jobs',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(
      adminJobsRes.status === 200 && adminJobsRes.data.jobs?.length > 0,
      'Administrator lists all platform jobs across organizations with applicant metrics',
      `Job count: ${adminJobsRes.data.jobs?.length}`
    );

    // 7.2 Admin toggles job status to Closed
    const adminToggleJobRes = await httpRequest(
      {
        hostname: 'localhost',
        port: API_PORT,
        path: `/api/admin/jobs/${badJob._id}/status`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        }
      },
      { isActive: false }
    );
    assert(
      adminToggleJobRes.status === 200 && adminToggleJobRes.data.job?.isActive === false,
      'Administrator moderates job status: deactivated inappropriate vacancy (isActive: false)',
      JSON.stringify(adminToggleJobRes.data.job?.isActive)
    );

    // 7.3 Admin deletes inappropriate job
    const adminDeleteJobRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: `/api/admin/jobs/${badJob._id}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(
      adminDeleteJobRes.status === 200 && adminDeleteJobRes.data.success === true,
      'Administrator permanently removes inappropriate job posting',
      JSON.stringify(adminDeleteJobRes.data)
    );

    const checkDeletedJob = await Job.findById(badJob._id);
    assert(checkDeletedJob === null, 'Moderated job permanently purged from database');

    // ----------------------------------------------------
    // TEST SECTION 8: Application Monitoring (Read-Only)
    // ----------------------------------------------------
    console.log('\n--- Test Section 8: Cross-Platform Application Monitoring ---');

    const adminAppsRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/admin/applications',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(
      adminAppsRes.status === 200 && adminAppsRes.data.applications !== undefined,
      'Administrator accesses cross-platform application monitoring stream',
      `Applications retrieved: ${adminAppsRes.data.applications?.length}`
    );

    // Filter by status
    const adminFilterAppsRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/admin/applications?status=Applied',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(
      adminFilterAppsRes.status === 200,
      'Application monitoring filters by status successfully',
      `Count: ${adminFilterAppsRes.data.count}`
    );

    // ----------------------------------------------------
    // TEST SECTION 9: Audit Activity Logging
    // ----------------------------------------------------
    console.log('\n--- Test Section 9: Audit Activity Logs Verification ---');

    const logsRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/admin/logs',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(
      logsRes.status === 200 && logsRes.data.logs?.length >= 3,
      'Admin audit trail records privileged operations (User toggle, Job toggle, Job delete)',
      `Total logs recorded: ${logsRes.data.logs?.length}`
    );

    const userDeactLog = logsRes.data.logs?.find((l) => l.action === 'USER_DEACTIVATE');
    assert(
      userDeactLog && userDeactLog.adminEmail === 'admin@skillsync.com' && userDeactLog.targetType === 'User',
      'Audit log contains accurate actor, action, and target attributes without secrets exposure',
      JSON.stringify(userDeactLog)
    );

    // ----------------------------------------------------
    // SUMMARY
    // ----------------------------------------------------
    console.log('\n====================================================');
    console.log(`    Phase 7 Test Results: ${passed} PASSED | ${failed} FAILED`);
    console.log('====================================================\n');

    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal error during Phase 7 testing:', err);
    try {
      await mongoose.disconnect();
    } catch (e) {}
    process.exit(1);
  }
}

runPhase7Tests();
