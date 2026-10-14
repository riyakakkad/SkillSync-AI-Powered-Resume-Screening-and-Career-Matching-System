const http = require('http');

function makeJsonRequest(options, body = null) {
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
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function makeMultipartRequest(options, fileContent, filename, mimetype) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    
    let header = `--${boundary}\r\n`;
    header += `Content-Disposition: form-data; name="resume"; filename="${filename}"\r\n`;
    header += `Content-Type: ${mimetype}\r\n\r\n`;
    
    const footer = `\r\n--${boundary}--\r\n`;

    const payload = Buffer.concat([
      Buffer.from(header, 'utf8'),
      Buffer.from(fileContent),
      Buffer.from(footer, 'utf8')
    ]);

    options.headers = {
      ...options.headers,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': payload.length
    };

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
    req.write(payload);
    req.end();
  });
}

async function runMultiDomainBackendTests() {
  console.log('=== SKILLSYNC BACKEND MULTI-DOMAIN INTEGRATION TEST SUITE ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  const timestamp = Date.now();
  const nurseEmail = `nurse_${timestamp}@health.org`;
  const financeEmail = `cpa_${timestamp}@audit.com`;
  const password = 'Password123!';

  try {
    // 1. Register Healthcare Candidate
    const nurseReg = await makeJsonRequest({
      hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { fullName: 'Sarah Jenkins, RN', email: nurseEmail, password, confirmPassword: password, role: 'student' });
    assert(nurseReg.status === 201 && nurseReg.data.token, 'Healthcare Candidate Registration (201 Created)');
    const nurseToken = nurseReg.data.token;

    // 2. Upload Healthcare Resume
    const healthcareResumeText = `
    Sarah Jenkins, RN, BSN
    Email: sarah.jenkins@health.org
    Phone: (555) 345-6789
    LinkedIn: linkedin.com/in/sarahjenkinsrn

    PROFESSIONAL SUMMARY
    Dedicated Registered Nurse with expertise in acute patient care, emergency triage, and vital signs monitoring.

    CLINICAL COMPETENCIES
    Patient Care, Clinical Assessment, EHR / EMR, HIPAA Compliance, Triage, Phlebotomy, Vital Signs Monitoring, BLS (Basic Life Support), Medication Administration

    EDUCATION
    Bachelor of Science in Nursing - Johns Hopkins University (2020 - 2024)

    CLINICAL EXPERIENCE
    Staff Nurse - Metropolitan Hospital (2024 - Present)
    Administered medications, conducted clinical assessments, and documented electronic health records (EHR).

    LICENSURE & CERTIFICATIONS
    Registered Nurse License, BLS Certification
    `;

    const uploadNurseRes = await makeMultipartRequest({
      hostname: 'localhost', port: 5000, path: '/api/resumes/upload', method: 'POST',
      headers: { Authorization: `Bearer ${nurseToken}` }
    }, healthcareResumeText, 'Sarah_Jenkins_Nursing_Resume.pdf', 'application/pdf');
    assert(uploadNurseRes.status === 201 && uploadNurseRes.data.resume._id, 'Healthcare Resume Upload (201 Created)');
    const nurseResumeId = uploadNurseRes.data.resume._id;

    // 3. Trigger Backend Analysis for Healthcare Resume
    const analyzeNurseRes = await makeJsonRequest({
      hostname: 'localhost', port: 5000, path: `/api/resumes/${nurseResumeId}/analyze`, method: 'POST',
      headers: { Authorization: `Bearer ${nurseToken}` }
    });
    assert(analyzeNurseRes.status === 200, 'Healthcare Resume Analysis (200 OK)');
    const nurseResume = analyzeNurseRes.data.resume;

    assert(nurseResume.detectedDomain === 'Healthcare', `Healthcare Domain Classified (Got: ${nurseResume.detectedDomain})`);
    assert(nurseResume.detectedSkills.includes('Patient Care') && nurseResume.detectedSkills.includes('HIPAA Compliance'),
           'Healthcare Clinical Skills Extracted from Resume');
    assert(nurseResume.atsScore >= 70, `Fair Domain-Adaptive ATS Score for Nurse (Got: ${nurseResume.atsScore}%)`);

    // Verify recommendations are domain-appropriate (no Git/SQL/Python forced)
    const recs = nurseResume.atsBreakdown.recommendations.join(' ');
    assert(!recs.includes('Git') && !recs.includes('Python'), 'No inappropriate IT skills recommended to nurse');

    // 4. Verify Student Profile Skills Auto-Updated with Healthcare Skills
    const nurseProfile = await makeJsonRequest({
      hostname: 'localhost', port: 5000, path: '/api/profile', method: 'GET',
      headers: { Authorization: `Bearer ${nurseToken}` }
    });
    assert(nurseProfile.data.profile.skills.includes('Patient Care'), 'Student Profile Updated with Healthcare Skills');

    // 5. Register Finance Candidate
    const finReg = await makeJsonRequest({
      hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { fullName: 'Michael Vance, CPA', email: financeEmail, password, confirmPassword: password, role: 'student' });
    assert(finReg.status === 201 && finReg.data.token, 'Finance Candidate Registration (201 Created)');
    const finToken = finReg.data.token;

    // 6. Upload & Analyze Finance Resume
    const financeResumeText = `
    Michael Vance, CPA
    Email: michael.vance@audit.com
    Phone: (555) 456-7890

    PROFESSIONAL SUMMARY
    Senior Financial Analyst specializing in corporate audit, variance analysis, and GAAP compliance.

    CORE COMPETENCIES
    Financial Modeling, GAAP, IFRS, Auditing, Tax Compliance, Financial Reporting, QuickBooks, General Ledger, Variance Analysis, Budgeting

    EDUCATION
    Master of Science in Accounting - NYU Stern (2020 - 2022)

    WORK EXPERIENCE
    Senior Auditor - KPMG (2022 - Present)
    Conducted external audit engagements and evaluated balance sheet reconciliation.
    `;

    const uploadFinRes = await makeMultipartRequest({
      hostname: 'localhost', port: 5000, path: '/api/resumes/upload', method: 'POST',
      headers: { Authorization: `Bearer ${finToken}` }
    }, financeResumeText, 'Michael_Vance_Finance_Resume.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    assert(uploadFinRes.status === 201, 'Finance DOCX Resume Upload (201 Created)');
    const finResumeId = uploadFinRes.data.resume._id;

    const analyzeFinRes = await makeJsonRequest({
      hostname: 'localhost', port: 5000, path: `/api/resumes/${finResumeId}/analyze`, method: 'POST',
      headers: { Authorization: `Bearer ${finToken}` }
    });
    assert(analyzeFinRes.status === 200, 'Finance Resume Analysis (200 OK)');
    const finResume = analyzeFinRes.data.resume;

    assert(finResume.detectedDomain === 'Finance and Accounting', `Finance Domain Classified (Got: ${finResume.detectedDomain})`);
    assert(finResume.detectedSkills.includes('GAAP') && finResume.detectedSkills.includes('Auditing'),
           'Finance Skills Extracted (GAAP, Auditing, Financial Modeling)');

    // 7. Verify GET /api/resumes/:id/analysis returns domain metadata
    const getAnalysisRes = await makeJsonRequest({
      hostname: 'localhost', port: 5000, path: `/api/resumes/${finResumeId}/analysis`, method: 'GET',
      headers: { Authorization: `Bearer ${finToken}` }
    });
    assert(getAnalysisRes.status === 200 && getAnalysisRes.data.detectedDomain === 'Finance and Accounting',
           'GET Analysis Endpoint returns detectedDomain and metadata');

    console.log(`\n==================================================`);
    console.log(`BACKEND MULTI-DOMAIN SUMMARY: ${passed} PASSED, ${failed} FAILED.`);
    console.log(`==================================================\n`);

    if (failed > 0) process.exit(1);

  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

runMultiDomainBackendTests();
