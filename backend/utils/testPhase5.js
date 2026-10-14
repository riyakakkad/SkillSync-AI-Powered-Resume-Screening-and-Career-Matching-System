/**
 * SkillSync Phase 5 Comprehensive Integration Test Suite
 * Tests:
 * 1. Multi-Domain AI Job Matching Engine & TF-IDF Cosine Similarity
 * 2. Meaningful match percentage, matched skills, missing skills, explanations
 * 3. Domain adaptation: Healthcare & Finance candidates get their domain jobs ranked highest
 * 4. Prioritized Skill Gap Analysis (Readiness score, Critical vs Growth gaps, MongoDB persistence)
 * 5. Course Recommendation Engine bridging actual missing skill gaps
 * 6. Job save and application flows with match metadata
 */

const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const API_PORT = 5000;
const ML_PORT = 8000;

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

async function runPhase5Tests() {
  console.log('====================================================');
  console.log('    SkillSync Phase 5 Comprehensive Test Suite     ');
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
    // ----------------------------------------------------
    // TEST 1: Direct ML Service /api/ml/match-jobs
    // ----------------------------------------------------
    console.log('[Test Suite 1] Testing ML Service Job Matching Endpoint...');
    const mlMatchPayload = {
      candidate_skills: ['Patient Care', 'Vital Signs', 'HIPAA Compliance', 'Clinical Workflow'],
      candidate_domain: 'Healthcare',
      candidate_relevant_domains: ['Healthcare'],
      candidate_text: 'Experienced registered nurse providing patient care, vital signs monitoring and HIPAA clinical compliance.',
      jobs: [
        {
          _id: 'job_hc_1',
          title: 'Clinical Nurse Specialist',
          company: 'Metro General Hospital',
          domain: 'Healthcare',
          requiredSkills: ['Patient Care', 'BLS', 'Clinical Workflow', 'HIPAA Compliance', 'Vital Signs'],
          description: 'Provide high-quality clinical patient care and maintain strict HIPAA regulatory compliance.'
        },
        {
          _id: 'job_it_1',
          title: 'Frontend React Developer',
          company: 'TechCorp Solutions',
          domain: 'IT and Software Development',
          requiredSkills: ['React', 'JavaScript', 'TypeScript', 'CSS3'],
          description: 'Frontend react developer building dashboards.'
        }
      ]
    };

    const mlMatchRes = await httpRequest({
      hostname: 'localhost',
      port: ML_PORT,
      path: '/api/ml/match-jobs',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, mlMatchPayload);

    assert(
      mlMatchRes.status === 200 && mlMatchRes.data.success && mlMatchRes.data.jobs.length === 2,
      'ML Service /api/ml/match-jobs returns ranked jobs',
      `Status: ${mlMatchRes.status}`
    );

    const topJob = mlMatchRes.data.jobs[0];
    const secondJob = mlMatchRes.data.jobs[1];

    assert(
      topJob.title === 'Clinical Nurse Specialist' && topJob.matchScore > secondJob.matchScore,
      'Healthcare role is ranked #1 for Healthcare candidate with higher matchScore',
      `Top: ${topJob.title} (${topJob.matchScore}%), Second: ${secondJob.title} (${secondJob.matchScore}%)`
    );

    assert(
      topJob.matchedSkills && topJob.matchedSkills.includes('Patient Care') && topJob.missingSkills.includes('BLS'),
      'Match details accurately extract matched vs missing skills',
      `Matched: ${topJob.matchedSkills?.join(', ')}, Missing: ${topJob.missingSkills?.join(', ')}`
    );

    assert(
      topJob.explanation && topJob.explanation.includes('Healthcare'),
      'Score explanation explains domain alignment and missing skills',
      topJob.explanation
    );

    // ----------------------------------------------------
    // TEST 2: Direct ML Service /api/ml/skill-gaps
    // ----------------------------------------------------
    console.log('\n[Test Suite 2] Testing ML Service Skill Gap Analysis Endpoint...');
    const mlGapPayload = {
      candidate_skills: ['Financial Modeling', 'Excel', 'Valuation'],
      candidate_domain: 'Finance and Accounting'
    };

    const mlGapRes = await httpRequest({
      hostname: 'localhost',
      port: ML_PORT,
      path: '/api/ml/skill-gaps',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, mlGapPayload);

    assert(
      mlGapRes.status === 200 && mlGapRes.data.success,
      'ML Service /api/ml/skill-gaps returns 200 OK',
      `Status: ${mlGapRes.status}`
    );

    assert(
      typeof mlGapRes.data.readinessScore === 'number' && mlGapRes.data.readinessScore > 0,
      'Returns valid readiness percentage score',
      `Score: ${mlGapRes.data.readinessScore}%`
    );

    assert(
      mlGapRes.data.criticalGaps && mlGapRes.data.criticalGaps.length > 0 && mlGapRes.data.criticalGaps[0].priority === 'High Priority',
      'Classifies missing essential domain skills as High Priority Critical Gaps',
      `Gaps count: ${mlGapRes.data.criticalGaps.length}, first gap: ${mlGapRes.data.criticalGaps[0]?.skill}`
    );

    // ----------------------------------------------------
    // TEST 3: Student Authentication & Resume Setup
    // ----------------------------------------------------
    console.log('\n[Test Suite 3] Registering Test Student & Simulating Analyzed Resume...');
    const testEmail = `phase5_student_${Date.now()}@example.com`;
    const regRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      fullName: 'Dr. Sarah Connor',
      email: testEmail,
      password: 'Password123!',
      confirmPassword: 'Password123!',
      role: 'student'
    });

    assert(
      regRes.status === 201 && regRes.data.token,
      'Register student for Phase 5 integration testing',
      `Status: ${regRes.status}`
    );

    const token = regRes.data.token;
    const studentAuthHeader = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };

    // Connect to MongoDB to inject a realistic analyzed multi-domain resume
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/skillsync';
    await mongoose.connect(mongoUri);
    const Resume = require('../models/Resume.model');
    const Job = require('../models/Job.model');
    const Course = require('../models/Course.model');

    const testResume = await Resume.create({
      user: regRes.data.user._id,
      originalName: 'Clinical_Nurse_Resume.pdf',
      fileName: `resume_${Date.now()}.pdf`,
      filePath: 'c:\\Users\\sanja\\OneDrive\\Desktop\\SkillSync\\backend\\uploads\\test_nurse.pdf',
      fileType: 'application/pdf',
      fileSize: 45000,
      status: 'analyzed',
      analysisStatus: 'analyzed',
      extractedText: 'Clinical nurse specialist with 5 years experience in patient care, triage vital signs, and HIPAA regulatory compliance.',
      detectedDomain: 'Healthcare',
      relevantDomains: ['Healthcare'],
      domainConfidence: 0.92,
      detectedSkills: ['Patient Care', 'Vital Signs', 'Clinical Workflow', 'HIPAA Compliance', 'Electronic Health Records'],
      atsScore: 84
    });

    assert(testResume && testResume._id, 'Created analyzed Healthcare candidate resume in MongoDB');

    // ----------------------------------------------------
    // TEST 4: Backend /api/jobs/recommendations
    // ----------------------------------------------------
    console.log('\n[Test Suite 4] Testing Backend AI Job Recommendations (/api/jobs/recommendations)...');
    
    // Check authorization: unauthenticated request must be blocked
    const unauthRecs = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/jobs/recommendations',
      method: 'GET'
    });
    assert(unauthRecs.status === 401, 'Protected route blocks unauthenticated access (401)');

    const recsRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/jobs/recommendations',
      method: 'GET',
      headers: studentAuthHeader
    });

    assert(
      recsRes.status === 200 && recsRes.data.success && recsRes.data.jobs.length > 0,
      'GET /api/jobs/recommendations returns 200 OK with ranked jobs',
      `Count: ${recsRes.data.count}`
    );

    assert(
      recsRes.data.candidateDomain === 'Healthcare',
      'Recommendations controller adopts candidate detectedDomain from analyzed resume',
      `Detected Domain: ${recsRes.data.candidateDomain}`
    );

    const firstJob = recsRes.data.jobs[0];
    assert(
      firstJob.domain === 'Healthcare',
      'Rank #1 recommended job is from Healthcare domain',
      `Rank 1: ${firstJob.title} (${firstJob.domain}) with ${firstJob.matchScore}% match`
    );

    assert(
      firstJob.matchScore >= 70,
      'Top Healthcare job has high match score (>= 70%)',
      `Score: ${firstJob.matchScore}%`
    );

    assert(
      firstJob.matchedSkills && firstJob.matchedSkills.length > 0,
      'Recommended job includes specific matched skills',
      `Matched: ${firstJob.matchedSkills.join(', ')}`
    );

    assert(
      typeof firstJob.isSaved === 'boolean' && typeof firstJob.isApplied === 'boolean',
      'Recommended job contains isSaved and isApplied flags'
    );

    // ----------------------------------------------------
    // TEST 5: Backend /api/jobs/skill-gaps
    // ----------------------------------------------------
    console.log('\n[Test Suite 5] Testing Backend Skill Gap Analysis (/api/jobs/skill-gaps)...');

    const gapRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/jobs/skill-gaps',
      method: 'GET',
      headers: studentAuthHeader
    });

    assert(
      gapRes.status === 200 && gapRes.data.success,
      'GET /api/jobs/skill-gaps returns 200 OK',
      `Status: ${gapRes.status}`
    );

    assert(
      gapRes.data.targetDomain === 'Healthcare',
      'Skill gaps targeted to candidate domain (Healthcare)',
      `Target: ${gapRes.data.targetDomain}`
    );

    assert(
      gapRes.data.criticalGaps && gapRes.data.criticalGaps.length > 0,
      'Identifies critical skill gaps for Healthcare benchmark',
      `Found ${gapRes.data.criticalGaps.length} critical gaps`
    );

    // Verify persisted in MongoDB
    const updatedResume = await Resume.findById(testResume._id);
    assert(
      updatedResume.skillGaps && updatedResume.skillGaps.readinessScore > 0,
      'Skill gap results are persisted in MongoDB Resume.skillGaps',
      `Persisted readiness: ${updatedResume.skillGaps?.readinessScore}%`
    );

    // ----------------------------------------------------
    // TEST 6: Backend /api/courses/recommended based on skill gaps
    // ----------------------------------------------------
    console.log('\n[Test Suite 6] Testing Course Recommendation Engine (/api/courses/recommended)...');

    const courseRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/courses/recommended',
      method: 'GET',
      headers: studentAuthHeader
    });

    assert(
      courseRes.status === 200 && courseRes.data.success && courseRes.data.courses.length > 0,
      'GET /api/courses/recommended returns 200 OK with recommended courses',
      `Courses count: ${courseRes.data.courses.length}`
    );

    assert(
      courseRes.data.targetDomain === 'Healthcare',
      'Course recommendations targeted to student domain (Healthcare)',
      `Target: ${courseRes.data.targetDomain}`
    );

    const gapBridgingCourses = courseRes.data.courses.filter((c) => c.bridgesGap === true);
    assert(
      gapBridgingCourses.length > 0,
      'Courses bridging identified missing skill gaps are tagged with bridgesGap: true',
      `Found ${gapBridgingCourses.length} gap-bridging courses`
    );

    // Top recommended course should be in candidate's domain or bridge a gap
    const topCourse = courseRes.data.courses[0];
    assert(
      topCourse.domain === 'Healthcare' || topCourse.bridgesGap,
      'Top recommended course specifically matches candidate domain or bridges identified gap',
      `Top course: "${topCourse.courseName}" (Domain: ${topCourse.domain}, BridgesGap: ${topCourse.bridgesGap})`
    );

    // ----------------------------------------------------
    // TEST 7: Job Save and Unsave Flow
    // ----------------------------------------------------
    console.log('\n[Test Suite 7] Testing Save, Application, and Unsave Lifecycle...');
    const targetJobId = firstJob._id;

    const saveRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: `/api/jobs/${targetJobId}/save`,
      method: 'POST',
      headers: studentAuthHeader
    });

    assert(
      saveRes.status === 201 && saveRes.data.success,
      'POST /api/jobs/:id/save saves job for candidate',
      `Status: ${saveRes.status}`
    );

    // Verify it shows up as isSaved: true in recommendations
    const verifySaved = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/jobs/recommendations',
      method: 'GET',
      headers: studentAuthHeader
    });
    const foundSaved = verifySaved.data.jobs.find((j) => j._id === targetJobId);
    assert(
      foundSaved && foundSaved.isSaved === true,
      'Saved job is dynamically flagged with isSaved: true in recommendation results'
    );

    // Submit Application
    const applyRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/applications',
      method: 'POST',
      headers: studentAuthHeader
    }, { jobId: targetJobId });

    assert(
      applyRes.status === 201 && applyRes.data.success,
      'POST /api/applications submits job application successfully',
      `Status: ${applyRes.status}`
    );

    // Verify it shows up as isApplied: true in recommendations
    const verifyApplied = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/jobs/recommendations',
      method: 'GET',
      headers: studentAuthHeader
    });
    const foundApplied = verifyApplied.data.jobs.find((j) => j._id === targetJobId);
    assert(
      foundApplied && foundApplied.isApplied === true,
      'Applied job is dynamically flagged with isApplied: true in recommendation results'
    );

    // Unsave job
    const unsaveRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: `/api/jobs/${targetJobId}/save`,
      method: 'DELETE',
      headers: studentAuthHeader
    });

    assert(
      unsaveRes.status === 200 && unsaveRes.data.success,
      'DELETE /api/jobs/:id/save removes job from saved list',
      `Status: ${unsaveRes.status}`
    );

    // ----------------------------------------------------
    // TEST 8: Finance Candidate Domain Adaptation Test
    // ----------------------------------------------------
    console.log('\n[Test Suite 8] Testing Finance Candidate Domain Adaptation...');
    const financeEmail = `finance_cand_${Date.now()}@example.com`;
    const finUserRes = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      fullName: 'Gordon Gekko',
      email: financeEmail,
      password: 'Password123!',
      confirmPassword: 'Password123!',
      role: 'student'
    });

    const finToken = finUserRes.data.token;
    const finAuthHeader = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${finToken}`
    };

    // Inject Finance Resume
    await Resume.create({
      user: finUserRes.data.user._id,
      originalName: 'Financial_Analyst_Resume.pdf',
      fileName: `resume_fin_${Date.now()}.pdf`,
      filePath: 'c:\\Users\\sanja\\OneDrive\\Desktop\\SkillSync\\backend\\uploads\\test_fin.pdf',
      fileType: 'application/pdf',
      fileSize: 42000,
      status: 'analyzed',
      analysisStatus: 'analyzed',
      extractedText: 'Senior financial analyst with expertise in financial modeling, valuation, Excel, accounting and corporate budgeting.',
      detectedDomain: 'Finance and Accounting',
      relevantDomains: ['Finance and Accounting'],
      domainConfidence: 0.94,
      detectedSkills: ['Financial Modeling', 'Excel', 'Valuation', 'Accounting', 'Budgeting'],
      atsScore: 88
    });

    const finRecs = await httpRequest({
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/jobs/recommendations',
      method: 'GET',
      headers: finAuthHeader
    });

    assert(
      finRecs.status === 200 && finRecs.data.candidateDomain === 'Finance and Accounting',
      'Finance candidate domain accurately recognized as Finance and Accounting'
    );

    const finTopJob = finRecs.data.jobs[0];
    assert(
      finTopJob.domain === 'Finance and Accounting',
      'Finance candidate has Finance role ranked #1',
      `Rank 1: ${finTopJob.title} (${finTopJob.domain}) with ${finTopJob.matchScore}%`
    );

    assert(
      finTopJob.matchScore >= 75,
      'Finance candidate achieves >= 75% match on matching Finance job',
      `Score: ${finTopJob.matchScore}%`
    );

    // Clean up test MongoDB connection
    await mongoose.disconnect();

  } catch (error) {
    console.error('Fatal test error:', error);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`Phase 5 Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase5Tests();
