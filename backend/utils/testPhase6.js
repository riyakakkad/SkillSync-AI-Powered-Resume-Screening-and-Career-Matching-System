/**
 * SkillSync Phase 6 Comprehensive Integration Test Suite
 * Tests:
 * 1. Recruiter Authentication & Role Verification
 * 2. Role-based authorization & Student access prevention (403)
 * 3. Recruiter Job Management (Create, Read, Update, Toggle status, Delete)
 * 4. Cross-recruiter ownership protection (Recruiter B cannot touch Recruiter A's jobs/applications)
 * 5. Recruiter Dashboard live persisted metrics & pipeline statistics
 * 6. Candidate application retrieval & deterministic Phase 5 AI matching reuse
 * 7. Application status transition lifecycle (Applied -> Under Review -> Interview -> Hired)
 * 8. Status transition rules & timeline persistence in MongoDB
 * 9. Candidate notification dispatch upon recruiter status change
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

async function runPhase6Tests() {
  console.log('====================================================');
  console.log('    SkillSync Phase 6 Comprehensive Test Suite     ');
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

  try {
    const timestamp = Date.now();

    // ----------------------------------------------------
    // TEST SECTION 1: Recruiter & Student Account Setup
    // ----------------------------------------------------
    console.log('--- Test Section 1: Authentication & Role Setup ---');

    // 1.1 Register Recruiter Alpha
    const recAlphaRes = await httpRequest(
      {
        hostname: 'localhost',
        port: API_PORT,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        fullName: 'Recruiter Alpha',
        email: `recruiter.alpha.${timestamp}@test.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        role: 'recruiter'
      }
    );
    assert(
      recAlphaRes.status === 201 && recAlphaRes.data.user?.role === 'recruiter',
      'Register Recruiter Alpha with role "recruiter"',
      JSON.stringify(recAlphaRes.data)
    );
    const alphaToken = recAlphaRes.data.token;
    const alphaId = recAlphaRes.data.user?.id || recAlphaRes.data.user?._id;

    // 1.2 Register Recruiter Beta (for cross-recruiter ownership checks)
    const recBetaRes = await httpRequest(
      {
        hostname: 'localhost',
        port: API_PORT,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        fullName: 'Recruiter Beta',
        email: `recruiter.beta.${timestamp}@test.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        role: 'recruiter'
      }
    );
    assert(
      recBetaRes.status === 201 && recBetaRes.data.user?.role === 'recruiter',
      'Register Recruiter Beta with role "recruiter"',
      JSON.stringify(recBetaRes.data)
    );
    const betaToken = recBetaRes.data.token;

    // 1.3 Register Student Charlie
    const studentRes = await httpRequest(
      {
        hostname: 'localhost',
        port: API_PORT,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        fullName: 'Charlie Student',
        email: `student.charlie.${timestamp}@test.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        role: 'student'
      }
    );
    assert(
      studentRes.status === 201 && studentRes.data.user?.role === 'student',
      'Register Student Charlie with role "student"',
      JSON.stringify(studentRes.data)
    );
    const studentToken = studentRes.data.token;
    const studentId = studentRes.data.user?.id || studentRes.data.user?._id;

    // ----------------------------------------------------
    // TEST SECTION 2: Role Authorization & Security Guards
    // ----------------------------------------------------
    console.log('\n--- Test Section 2: Security & Authorization Guards ---');

    // 2.1 Student forbidden from recruiter dashboard (403)
    const studentDashRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/recruiter/dashboard',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(
      studentDashRes.status === 403,
      'Student Charlie blocked from GET /api/recruiter/dashboard (HTTP 403)',
      `Got status ${studentDashRes.status}`
    );

    // 2.2 Student forbidden from creating recruiter jobs
    const studentCreateJobRes = await httpRequest(
      {
        hostname: 'localhost',
        port: API_PORT,
        path: '/api/recruiter/jobs',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`
        }
      },
      {
        title: 'Unauthorized Job',
        company: 'Malicious Corp',
        location: 'Remote',
        description: 'Should fail'
      }
    );
    assert(
      studentCreateJobRes.status === 403,
      'Student Charlie blocked from POST /api/recruiter/jobs (HTTP 403)',
      `Got status ${studentCreateJobRes.status}`
    );

    // 2.3 Unauthenticated request blocked (401)
    const noAuthRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/recruiter/dashboard',
      method: 'GET'
    });
    assert(
      noAuthRes.status === 401,
      'Unauthenticated request blocked from recruiter routes (HTTP 401)',
      `Got status ${noAuthRes.status}`
    );

    // ----------------------------------------------------
    // TEST SECTION 3: Recruiter Job Management (CRUD)
    // ----------------------------------------------------
    console.log('\n--- Test Section 3: Recruiter Job Management & Validation ---');

    // 3.1 Backend validation: reject job missing required fields (e.g. missing title)
    const invalidJobRes = await httpRequest(
      {
        hostname: 'localhost',
        port: API_PORT,
        path: '/api/recruiter/jobs',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${alphaToken}`
        }
      },
      {
        company: 'Alpha AI Tech',
        location: 'San Francisco, CA',
        description: 'Missing title'
      }
    );
    assert(
      invalidJobRes.status === 400,
      'Reject job creation without required title (HTTP 400 validation error)',
      `Got status ${invalidJobRes.status}`
    );

    // 3.2 Create Job 1: AI Engineer (IT Domain)
    const createJob1Res = await httpRequest(
      {
        hostname: 'localhost',
        port: API_PORT,
        path: '/api/recruiter/jobs',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${alphaToken}`
        }
      },
      {
        title: 'Senior AI Engineer',
        company: 'Alpha Dynamics',
        location: 'San Francisco, CA',
        jobType: 'Full-time',
        experienceLevel: 'Senior-level',
        salary: '$160,000 - $190,000',
        domain: 'IT and Software Development',
        description: 'Design and deploy production-grade machine learning pipelines with Python and PyTorch.',
        requiredSkills: ['Python', 'PyTorch', 'FastAPI', 'Machine Learning'],
        preferredSkills: ['Docker', 'MLOps']
      }
    );
    assert(
      createJob1Res.status === 201 && createJob1Res.data.job?._id,
      'Recruiter Alpha successfully creates Job 1 (Senior AI Engineer)',
      JSON.stringify(createJob1Res.data)
    );
    const job1Id = createJob1Res.data.job?._id;

    // 3.3 Create Job 2: Clinical Data Analyst (Healthcare Domain)
    const createJob2Res = await httpRequest(
      {
        hostname: 'localhost',
        port: API_PORT,
        path: '/api/recruiter/jobs',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${alphaToken}`
        }
      },
      {
        title: 'Clinical Data Specialist',
        company: 'Alpha Health Systems',
        location: 'Boston, MA',
        jobType: 'Full-time',
        experienceLevel: 'Mid-level',
        salary: '$110,000 - $130,000',
        domain: 'Healthcare',
        description: 'Analyze clinical trials data and healthcare records conforming to HIPAA standards.',
        requiredSkills: ['EHR', 'Clinical Data Analysis', 'HIPAA', 'Biostatistics'],
        preferredSkills: ['HL7', 'Epidemiology']
      }
    );
    assert(
      createJob2Res.status === 201 && createJob2Res.data.job?._id,
      'Recruiter Alpha successfully creates Job 2 (Clinical Data Specialist in Healthcare)',
      JSON.stringify(createJob2Res.data)
    );
    const job2Id = createJob2Res.data.job?._id;

    // 3.4 Read: Recruiter Alpha lists own jobs
    const getJobsRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/recruiter/jobs',
      method: 'GET',
      headers: { Authorization: `Bearer ${alphaToken}` }
    });
    assert(
      getJobsRes.status === 200 && getJobsRes.data.jobs?.length >= 2,
      'Recruiter Alpha lists own jobs (contains at least 2 postings)',
      `Returned count: ${getJobsRes.data.jobs?.length}`
    );

    // 3.5 Read: Get single job details with applicant counters
    const getJob1Res = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: `/api/recruiter/jobs/${job1Id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${alphaToken}` }
    });
    assert(
      getJob1Res.status === 200 && getJob1Res.data.job?.title === 'Senior AI Engineer',
      'Recruiter Alpha retrieves details for Job 1 with applicant metrics',
      JSON.stringify(getJob1Res.data.job?.title)
    );

    // 3.6 Update: Edit Job 1 title and requirements
    const updateJob1Res = await httpRequest(
      {
        hostname: 'localhost',
        port: API_PORT,
        path: `/api/recruiter/jobs/${job1Id}`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${alphaToken}`
        }
      },
      {
        title: 'Lead AI & MLOps Engineer',
        salary: '$175,000 - $210,000'
      }
    );
    assert(
      updateJob1Res.status === 200 && updateJob1Res.data.job?.title === 'Lead AI & MLOps Engineer',
      'Recruiter Alpha updates Job 1 title to "Lead AI & MLOps Engineer"',
      JSON.stringify(updateJob1Res.data.job?.title)
    );

    // 3.7 Toggle Job Status: Deactivate and reactivate
    const toggleDeactRes = await httpRequest(
      {
        hostname: 'localhost',
        port: API_PORT,
        path: `/api/recruiter/jobs/${job1Id}/status`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${alphaToken}`
        }
      },
      { isActive: false }
    );
    assert(
      toggleDeactRes.status === 200 && toggleDeactRes.data.job?.isActive === false,
      'Recruiter Alpha deactivates Job 1 (isActive = false)',
      JSON.stringify(toggleDeactRes.data.job?.isActive)
    );

    const toggleActRes = await httpRequest(
      {
        hostname: 'localhost',
        port: API_PORT,
        path: `/api/recruiter/jobs/${job1Id}/status`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${alphaToken}`
        }
      },
      { isActive: true }
    );
    assert(
      toggleActRes.status === 200 && toggleActRes.data.job?.isActive === true,
      'Recruiter Alpha reactivates Job 1 (isActive = true)',
      JSON.stringify(toggleActRes.data.job?.isActive)
    );

    // ----------------------------------------------------
    // TEST SECTION 4: Cross-Recruiter Ownership Enforcement
    // ----------------------------------------------------
    console.log('\n--- Test Section 4: Cross-Recruiter Ownership Checks ---');

    // 4.1 Recruiter Beta cannot edit Recruiter Alpha's job (403)
    const betaEditAlphaRes = await httpRequest(
      {
        hostname: 'localhost',
        port: API_PORT,
        path: `/api/recruiter/jobs/${job1Id}`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${betaToken}`
        }
      },
      { title: 'Hacked by Beta' }
    );
    assert(
      betaEditAlphaRes.status === 403,
      'Recruiter Beta forbidden from modifying Recruiter Alpha job (HTTP 403)',
      `Got status ${betaEditAlphaRes.status}`
    );

    // 4.2 Recruiter Beta cannot toggle status of Recruiter Alpha's job (403)
    const betaToggleAlphaRes = await httpRequest(
      {
        hostname: 'localhost',
        port: API_PORT,
        path: `/api/recruiter/jobs/${job1Id}/status`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${betaToken}`
        }
      },
      { isActive: false }
    );
    assert(
      betaToggleAlphaRes.status === 403,
      'Recruiter Beta forbidden from toggling status of Recruiter Alpha job (HTTP 403)',
      `Got status ${betaToggleAlphaRes.status}`
    );

    // 4.3 Recruiter Beta cannot delete Recruiter Alpha's job (403)
    const betaDeleteAlphaRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: `/api/recruiter/jobs/${job1Id}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${betaToken}` }
    });
    assert(
      betaDeleteAlphaRes.status === 403,
      'Recruiter Beta forbidden from deleting Recruiter Alpha job (HTTP 403)',
      `Got status ${betaDeleteAlphaRes.status}`
    );

    // ----------------------------------------------------
    // TEST SECTION 5: Recruiter Dashboard Live Metrics
    // ----------------------------------------------------
    console.log('\n--- Test Section 5: Recruiter Dashboard Dynamic Metrics ---');

    const dashRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/recruiter/dashboard',
      method: 'GET',
      headers: { Authorization: `Bearer ${alphaToken}` }
    });
    assert(
      dashRes.status === 200 &&
        dashRes.data.stats?.totalJobs >= 2 &&
        dashRes.data.stats?.activeJobs >= 2 &&
        dashRes.data.stats?.statusBreakdown !== undefined,
      'Recruiter Alpha dashboard displays live persisted stats and pipeline breakdown',
      JSON.stringify(dashRes.data.stats)
    );

    // ----------------------------------------------------
    // TEST SECTION 6: Candidate Applications & AI Matching
    // ----------------------------------------------------
    console.log('\n--- Test Section 6: Candidate Applications & AI Match Engine ---');

    // Connect mongoose to seed student resume for Charlie so realistic skills exist
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/skillsync';
    await mongoose.connect(mongoUri);

    const Resume = mongoose.model('Resume');
    const Application = mongoose.model('Application');

    // Create a realistic resume for Charlie in IT domain
    const charlieResume = await Resume.create({
      user: studentId,
      originalName: 'charlie_resume.pdf',
      fileName: `charlie_${timestamp}.pdf`,
      filePath: `/uploads/resumes/charlie_${timestamp}.pdf`,
      fileType: 'pdf',
      fileSize: 45000,
      extractedText:
        'Senior Machine Learning Engineer skilled in Python, PyTorch, FastAPI, Machine Learning, Docker, and Data Pipelines.',
      detectedSkills: ['Python', 'PyTorch', 'FastAPI', 'Machine Learning', 'Docker'],
      detectedDomain: 'IT and Software Development',
      relevantDomains: ['IT and Software Development'],
      atsScore: 88,
      status: 'analyzed'
    });

    // 6.1 Charlie submits application to Job 1 (AI Engineer - High match expected)
    const applyJob1Res = await httpRequest(
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
        jobId: job1Id,
        resumeId: charlieResume._id.toString(),
        notes: 'Passionate about production machine learning and PyTorch deployment.'
      }
    );
    assert(
      applyJob1Res.status === 201 && applyJob1Res.data.application?._id,
      'Student Charlie applies to Job 1 (Senior AI Engineer)',
      JSON.stringify(applyJob1Res.data)
    );
    const app1Id = applyJob1Res.data.application?._id;

    // 6.2 Charlie submits application to Job 2 (Healthcare - Low/Partial match expected)
    const applyJob2Res = await httpRequest(
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
        jobId: job2Id,
        resumeId: charlieResume._id.toString(),
        notes: 'Interested in transitioning into clinical analytics.'
      }
    );
    assert(
      applyJob2Res.status === 201 && applyJob2Res.data.application?._id,
      'Student Charlie applies to Job 2 (Clinical Data Specialist)',
      JSON.stringify(applyJob2Res.data)
    );
    const app2Id = applyJob2Res.data.application?._id;

    // 6.3 Recruiter Alpha fetches candidate applications with AI matching
    const recAppsRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/recruiter/applications',
      method: 'GET',
      headers: { Authorization: `Bearer ${alphaToken}` }
    });
    assert(
      recAppsRes.status === 200 && recAppsRes.data.applications?.length >= 2,
      'Recruiter Alpha retrieves candidate applications for owned jobs',
      `Application count: ${recAppsRes.data.applications?.length}`
    );

    // 6.4 Verify AI Candidate Matching for Job 1 (Charlie vs AI Engineer)
    const app1Match = recAppsRes.data.applications?.find((a) => a._id === app1Id);
    assert(
      app1Match &&
        app1Match.match.matchScore >= 70 &&
        app1Match.match.matchedSkills.includes('Python') &&
        app1Match.match.matchedSkills.includes('PyTorch') &&
        typeof app1Match.match.explanation === 'string' &&
        app1Match.match.explanation.length > 10,
      `AI Matching for AI role correctly computed high match (${app1Match?.match?.matchScore}%) with matched skills and explanation`,
      JSON.stringify({ score: app1Match?.match?.matchScore, matched: app1Match?.match?.matchedSkills })
    );

    // 6.5 Verify AI Candidate Matching for Job 2 (Charlie vs Healthcare role)
    const app2Match = recAppsRes.data.applications?.find((a) => a._id === app2Id);
    assert(
      app2Match &&
        app2Match.match.matchScore < app1Match.match.matchScore &&
        app2Match.match.missingSkills.includes('EHR') &&
        app2Match.match.missingSkills.includes('HIPAA'),
      `AI Matching for Healthcare role correctly identified lower fit (${app2Match?.match?.matchScore}%) and missing domain skills: EHR, HIPAA`,
      JSON.stringify({ score: app2Match?.match?.matchScore, missing: app2Match?.match?.missingSkills })
    );

    // 6.6 Cross-recruiter check: Recruiter Beta sees 0 applications (owns neither job)
    const betaAppsRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/recruiter/applications',
      method: 'GET',
      headers: { Authorization: `Bearer ${betaToken}` }
    });
    assert(
      betaAppsRes.status === 200 && betaAppsRes.data.applications?.length === 0,
      'Recruiter Beta sees 0 applications (cannot access Recruiter Alpha applications)',
      `Returned count: ${betaAppsRes.data.applications?.length}`
    );

    // 6.7 Recruiter Beta blocked from accessing single application detail for Alpha's job (403)
    const betaAppDetailRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: `/api/recruiter/applications/${app1Id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${betaToken}` }
    });
    assert(
      betaAppDetailRes.status === 403,
      'Recruiter Beta forbidden from accessing single application detail for Alpha job (HTTP 403)',
      `Got status ${betaAppDetailRes.status}`
    );

    // ----------------------------------------------------
    // TEST SECTION 7: Application Status Lifecycle & Transitions
    // ----------------------------------------------------
    console.log('\n--- Test Section 7: Application Status Transitions & Permitted States ---');

    // 7.1 Transition to 'Under Review'
    const statusUnderReviewRes = await httpRequest(
      {
        hostname: 'localhost',
        port: API_PORT,
        path: `/api/recruiter/applications/${app1Id}/status`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${alphaToken}`
        }
      },
      {
        status: 'Under Review',
        notes: 'Profile screened and marked strong fit.'
      }
    );
    assert(
      statusUnderReviewRes.status === 200 && statusUnderReviewRes.data.application?.status === 'Under Review',
      'Recruiter Alpha transitions application to "Under Review"',
      JSON.stringify(statusUnderReviewRes.data.application?.status)
    );

    // 7.2 Transition to 'Shortlisted'
    const statusShortlistRes = await httpRequest(
      {
        hostname: 'localhost',
        port: API_PORT,
        path: `/api/recruiter/applications/${app1Id}/status`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${alphaToken}`
        }
      },
      {
        status: 'Shortlisted',
        notes: 'Qualified candidate for team interview round.'
      }
    );
    assert(
      statusShortlistRes.status === 200 && statusShortlistRes.data.application?.status === 'Shortlisted',
      'Recruiter Alpha transitions application to "Shortlisted"',
      JSON.stringify(statusShortlistRes.data.application?.status)
    );

    // 7.3 Transition to 'Interview' with scheduled date
    const interviewDate = new Date(Date.now() + 86400000 * 3).toISOString();
    const statusInterviewRes = await httpRequest(
      {
        hostname: 'localhost',
        port: API_PORT,
        path: `/api/recruiter/applications/${app1Id}/status`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${alphaToken}`
        }
      },
      {
        status: 'Interview',
        notes: 'Technical panel interview scheduled.',
        interviewDate
      }
    );
    assert(
      statusInterviewRes.status === 200 && statusInterviewRes.data.application?.status === 'Interview',
      'Recruiter Alpha transitions application to "Interview" with interview date',
      JSON.stringify(statusInterviewRes.data.application?.status)
    );

    // 7.4 Transition to 'Hired'
    const statusHiredRes = await httpRequest(
      {
        hostname: 'localhost',
        port: API_PORT,
        path: `/api/recruiter/applications/${app1Id}/status`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${alphaToken}`
        }
      },
      {
        status: 'Hired',
        notes: 'Offer letter accepted.'
      }
    );
    assert(
      statusHiredRes.status === 200 && statusHiredRes.data.application?.status === 'Hired',
      'Recruiter Alpha transitions application to "Hired"',
      JSON.stringify(statusHiredRes.data.application?.status)
    );

    // 7.5 Status transition rule check: Cannot revert 'Hired' back to 'Applied' (400)
    const invalidRevertRes = await httpRequest(
      {
        hostname: 'localhost',
        port: API_PORT,
        path: `/api/recruiter/applications/${app1Id}/status`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${alphaToken}`
        }
      },
      {
        status: 'Applied'
      }
    );
    assert(
      invalidRevertRes.status === 400,
      'Reject invalid transition reverting Hired back to Applied (HTTP 400)',
      `Got status ${invalidRevertRes.status}`
    );

    // 7.6 Verify Timeline Persistence in MongoDB
    const appDoc = await Application.findById(app1Id);
    assert(
      appDoc &&
        appDoc.timeline.length >= 4 &&
        appDoc.timeline.some((t) => t.status === 'Under Review') &&
        appDoc.timeline.some((t) => t.status === 'Shortlisted') &&
        appDoc.timeline.some((t) => t.status === 'Interview') &&
        appDoc.timeline.some((t) => t.status === 'Hired'),
      'Application timeline events correctly persisted in MongoDB history',
      `Timeline entries: ${appDoc?.timeline?.length}`
    );

    // ----------------------------------------------------
    // TEST SECTION 8: Candidate Notification & Student Visibility
    // ----------------------------------------------------
    console.log('\n--- Test Section 8: Candidate Notification & Student Visibility ---');

    const Notification = mongoose.model('Notification');
    const studentNotifs = await Notification.find({ user: studentId }).sort({ createdAt: -1 });
    assert(
      studentNotifs.length > 0 &&
        studentNotifs.some((n) => n.title.includes('Application Status: Hired')),
      'Student Charlie received persisted in-app notifications for recruiter status updates',
      `Notification count: ${studentNotifs.length}`
    );

    // Student views own applications list: verify 'Hired' status is reflected to student
    const studentAppsRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/applications',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const charlieAppInMyList = studentAppsRes.data.applications?.find((a) => a._id === app1Id);
    assert(
      studentAppsRes.status === 200 && charlieAppInMyList?.status === 'Hired',
      'Updated status "Hired" is immediately visible on student Applications page',
      `Student view status: ${charlieAppInMyList?.status}`
    );

    // ----------------------------------------------------
    // TEST SECTION 9: Recruiter Job Deletion
    // ----------------------------------------------------
    console.log('\n--- Test Section 9: Recruiter Job Deletion ---');

    const deleteJob2Res = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: `/api/recruiter/jobs/${job2Id}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${alphaToken}` }
    });
    assert(
      deleteJob2Res.status === 200 && deleteJob2Res.data.success === true,
      'Recruiter Alpha successfully deletes Job 2',
      JSON.stringify(deleteJob2Res.data)
    );

    const getJobsAfterDelete = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/recruiter/jobs',
      method: 'GET',
      headers: { Authorization: `Bearer ${alphaToken}` }
    });
    const deletedJobStillPresent = getJobsAfterDelete.data.jobs?.some((j) => j._id === job2Id);
    assert(
      deletedJobStillPresent === false,
      'Deleted Job 2 is permanently removed from recruiter job listings in MongoDB',
      `Remaining jobs: ${getJobsAfterDelete.data.jobs?.length}`
    );

    // ----------------------------------------------------
    // SUMMARY
    // ----------------------------------------------------
    console.log('\n====================================================');
    console.log(`    Phase 6 Test Results: ${passed} PASSED | ${failed} FAILED`);
    console.log('====================================================\n');

    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal error during Phase 6 testing:', err);
    try {
      await mongoose.disconnect();
    } catch (e) {}
    process.exit(1);
  }
}

runPhase6Tests();
