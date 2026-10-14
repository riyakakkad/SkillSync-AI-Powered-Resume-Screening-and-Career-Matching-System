const Job = require('../models/Job.model');
const Application = require('../models/Application.model');
const Resume = require('../models/Resume.model');
const Notification = require('../models/Notification.model');
const User = require('../models/User.model');
const { callMlService } = require('../utils/mlClient');

// Helper to calculate candidate match against job requirements
async function evaluateCandidateMatch(candidateSkills = [], candidateDomain = 'General', candidateRelevantDomains = [], candidateText = '', job) {
  const reqSkills = job.requiredSkills || [];

  try {
    const mlResponse = await callMlService('/api/ml/match-jobs', {
      candidate_skills: candidateSkills,
      candidate_domain: candidateDomain,
      candidate_relevant_domains: candidateRelevantDomains.length ? candidateRelevantDomains : [candidateDomain],
      candidate_text: candidateText,
      jobs: [
        {
          _id: job._id.toString(),
          title: job.title,
          company: job.company,
          domain: job.domain || 'General',
          requiredSkills: reqSkills,
          description: job.description || ''
        }
      ]
    });

    if (mlResponse && mlResponse.jobs && mlResponse.jobs.length > 0) {
      const matched = mlResponse.jobs[0];
      return {
        matchScore: matched.matchScore,
        matchedSkills: matched.matchedSkills || [],
        missingSkills: matched.missingSkills || [],
        skillMatchRate: matched.skillMatchRate || 0,
        domainAlignment: matched.domainAlignment || 'Moderate',
        priority: matched.priority || 'Moderate Fit',
        explanation: matched.explanation || ''
      };
    }
  } catch (mlErr) {
    // Deterministic fallback using identical Phase 5 weighting
    console.warn('[RecruiterController] ML service fallback matching:', mlErr.message);
  }

  // Pure fallback
  const candLower = new Set(candidateSkills.map((s) => s.toLowerCase()));
  const matched = [];
  const missing = [];

  for (const skill of reqSkills) {
    const sLower = skill.toLowerCase();
    if (candLower.has(sLower) || Array.from(candLower).some((cs) => cs.includes(sLower) || sLower.includes(cs))) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  }

  const skillRatio = reqSkills.length > 0 ? matched.length / reqSkills.length : 0.5;
  const isDomainMatch = job.domain && (job.domain === candidateDomain || candidateRelevantDomains.includes(job.domain));
  const domainScore = isDomainMatch ? 1.0 : (job.domain === 'General' || candidateDomain === 'Unknown' ? 0.75 : 0.25);
  const composite = (skillRatio * 0.60) + (domainScore * 0.25) + 0.10;
  const matchScore = Math.round(Math.min(100, Math.max(10, composite * 100)));

  return {
    matchScore,
    matchedSkills: matched,
    missingSkills: missing,
    skillMatchRate: Math.round(skillRatio * 100),
    domainAlignment: isDomainMatch ? 'High' : (domainScore >= 0.7 ? 'Moderate' : 'Low'),
    priority: matchScore >= 75 ? 'High Match' : (matchScore >= 50 ? 'Moderate Fit' : 'Skill Stretch'),
    explanation: `Matched ${matched.length} of ${reqSkills.length} required skills (${Math.round(skillRatio * 100)}% coverage). ${isDomainMatch ? 'High' : 'Moderate'} domain alignment with ${job.domain || 'General'}.`
  };
}

// @desc    Get recruiter dashboard statistics
// @route   GET /api/recruiter/dashboard
// @access  Private (Recruiter)
exports.getRecruiterDashboard = async (req, res) => {
  try {
    const recruiterId = req.user.id;

    // 1. Fetch all jobs owned by recruiter
    const jobs = await Job.find({ postedBy: recruiterId }).sort({ createdAt: -1 });
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter((j) => j.isActive).length;
    const closedJobs = totalJobs - activeJobs;
    const jobIds = jobs.map((j) => j._id);

    // 2. Fetch all applications for these jobs
    const applications = await Application.find({ job: { $in: jobIds } })
      .populate('job', 'title company location domain')
      .populate('student', 'fullName email skills')
      .populate('resume', 'detectedSkills detectedDomain atsScore')
      .sort({ appliedAt: -1 });

    const totalApplications = applications.length;

    // 3. Status breakdown
    const statusBreakdown = {
      applied: 0,
      underReview: 0,
      shortlisted: 0,
      interview: 0,
      rejected: 0,
      hired: 0
    };

    applications.forEach((app) => {
      const s = (app.status || '').toLowerCase();
      if (s === 'applied') statusBreakdown.applied++;
      else if (s === 'under review') statusBreakdown.underReview++;
      else if (s === 'shortlisted') statusBreakdown.shortlisted++;
      else if (s === 'interview' || s === 'interview scheduled') statusBreakdown.interview++;
      else if (s === 'rejected') statusBreakdown.rejected++;
      else if (s === 'hired' || s === 'selected') statusBreakdown.hired++;
      else statusBreakdown.applied++;
    });

    // 4. Recent jobs with application count
    const recentJobs = jobs.slice(0, 5).map((j) => {
      const appCount = applications.filter((a) => a.job && a.job._id.toString() === j._id.toString()).length;
      return {
        ...j.toObject(),
        applicantCount: appCount
      };
    });

    // 5. Recent applications
    const recentApplications = applications.slice(0, 5).map((a) => ({
      _id: a._id,
      jobTitle: a.job?.title || 'Unknown Role',
      jobCompany: a.job?.company || '',
      studentName: a.student?.fullName || 'Anonymous Candidate',
      studentEmail: a.student?.email || '',
      status: a.status,
      appliedAt: a.appliedAt
    }));

    res.status(200).json({
      success: true,
      stats: {
        totalJobs,
        activeJobs,
        closedJobs,
        totalApplications,
        statusBreakdown
      },
      recentJobs,
      recentApplications
    });
  } catch (error) {
    console.error('Error in recruiter dashboard:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error loading recruiter dashboard'
    });
  }
};

// @desc    Get all jobs posted by the recruiter
// @route   GET /api/recruiter/jobs
// @access  Private (Recruiter)
exports.getRecruiterJobs = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const jobs = await Job.find({ postedBy: recruiterId }).sort({ createdAt: -1 });

    const jobIds = jobs.map((j) => j._id);
    const applications = await Application.find({ job: { $in: jobIds } }).select('job status');

    const jobsWithCounts = jobs.map((job) => {
      const jobApps = applications.filter((a) => a.job.toString() === job._id.toString());
      return {
        ...job.toObject(),
        applicantCount: jobApps.length,
        shortlistedCount: jobApps.filter((a) => ['shortlisted', 'interview', 'interview scheduled', 'hired', 'selected'].includes(a.status.toLowerCase())).length
      };
    });

    res.status(200).json({
      success: true,
      count: jobsWithCounts.length,
      jobs: jobsWithCounts
    });
  } catch (error) {
    console.error('Error fetching recruiter jobs:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching jobs'
    });
  }
};

// @desc    Get single job by ID (Recruiter ownership checked)
// @route   GET /api/recruiter/jobs/:id
// @access  Private (Recruiter)
exports.getRecruiterJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    if (job.postedBy && job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this job posting'
      });
    }

    const applicantCount = await Application.countDocuments({ job: job._id });

    res.status(200).json({
      success: true,
      job: {
        ...job.toObject(),
        applicantCount
      }
    });
  } catch (error) {
    console.error('Error fetching recruiter job details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job details'
    });
  }
};

// @desc    Create a new job posting
// @route   POST /api/recruiter/jobs
// @access  Private (Recruiter)
exports.createJob = async (req, res) => {
  try {
    const {
      title,
      company,
      companyLogo,
      location,
      salary,
      jobType,
      description,
      requiredSkills,
      preferredSkills,
      experienceLevel,
      domain
    } = req.body;

    // Backend validation of required fields
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Job title is required' });
    }
    if (!company || !company.trim()) {
      return res.status(400).json({ success: false, message: 'Company name is required' });
    }
    if (!location || !location.trim()) {
      return res.status(400).json({ success: false, message: 'Location is required' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Job description is required' });
    }

    // Helper to normalize skill arrays
    const parseSkills = (skills) => {
      if (Array.isArray(skills)) {
        return skills.map((s) => s.trim()).filter(Boolean);
      }
      if (typeof skills === 'string') {
        return skills.split(',').map((s) => s.trim()).filter(Boolean);
      }
      return [];
    };

    const normRequiredSkills = parseSkills(requiredSkills);
    const normPreferredSkills = parseSkills(preferredSkills);

    const job = await Job.create({
      title: title.trim(),
      company: company.trim(),
      companyLogo: companyLogo || '🏢',
      location: location.trim(),
      salary: salary || 'Competitive',
      jobType: jobType || 'Full-time',
      description: description.trim(),
      requiredSkills: normRequiredSkills,
      preferredSkills: normPreferredSkills,
      experienceLevel: experienceLevel || 'Entry-level',
      domain: domain && domain.trim() ? domain.trim() : 'General',
      postedBy: req.user.id,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Job posting created successfully',
      job
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating job posting'
    });
  }
};

// @desc    Update existing job posting
// @route   PUT /api/recruiter/jobs/:id
// @access  Private (Recruiter)
exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    if (job.postedBy && job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this job posting'
      });
    }

    const {
      title,
      company,
      companyLogo,
      location,
      salary,
      jobType,
      description,
      requiredSkills,
      preferredSkills,
      experienceLevel,
      domain,
      isActive
    } = req.body;

    const parseSkills = (skills) => {
      if (Array.isArray(skills)) return skills.map((s) => s.trim()).filter(Boolean);
      if (typeof skills === 'string') return skills.split(',').map((s) => s.trim()).filter(Boolean);
      return undefined;
    };

    if (title) job.title = title.trim();
    if (company) job.company = company.trim();
    if (companyLogo !== undefined) job.companyLogo = companyLogo;
    if (location) job.location = location.trim();
    if (salary) job.salary = salary.trim();
    if (jobType) job.jobType = jobType;
    if (description) job.description = description.trim();
    if (requiredSkills !== undefined) job.requiredSkills = parseSkills(requiredSkills);
    if (preferredSkills !== undefined) job.preferredSkills = parseSkills(preferredSkills);
    if (experienceLevel) job.experienceLevel = experienceLevel;
    if (domain) job.domain = domain.trim();
    if (isActive !== undefined) job.isActive = Boolean(isActive);

    await job.save();

    res.status(200).json({
      success: true,
      message: 'Job posting updated successfully',
      job
    });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating job posting'
    });
  }
};

// @desc    Toggle job active / inactive status
// @route   PATCH /api/recruiter/jobs/:id/status
// @access  Private (Recruiter)
exports.toggleJobStatus = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    if (job.postedBy && job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this job'
      });
    }

    if (typeof req.body.isActive === 'boolean') {
      job.isActive = req.body.isActive;
    } else {
      job.isActive = !job.isActive;
    }

    await job.save();

    res.status(200).json({
      success: true,
      message: `Job ${job.isActive ? 'activated' : 'deactivated'} successfully`,
      job
    });
  } catch (error) {
    console.error('Error toggling job status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error toggling job status'
    });
  }
};

// @desc    Delete job posting
// @route   DELETE /api/recruiter/jobs/:id
// @access  Private (Recruiter)
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    if (job.postedBy && job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this job'
      });
    }

    await job.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Job posting deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting job posting'
    });
  }
};

// @desc    Get applications for recruiter's jobs with AI candidate matching
// @route   GET /api/recruiter/applications
// @access  Private (Recruiter)
exports.getRecruiterApplications = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const { jobId, status, search } = req.query;

    // 1. Get recruiter's jobs
    const recruiterJobs = await Job.find({ postedBy: recruiterId });
    const jobIds = recruiterJobs.map((j) => j._id);

    const filter = { job: { $in: jobIds } };
    if (jobId) {
      filter.job = jobId;
    }
    if (status && status !== 'All') {
      filter.status = status;
    }

    const applications = await Application.find(filter)
      .populate('job')
      .populate('student', 'fullName email skills')
      .populate('resume')
      .sort({ appliedAt: -1 });

    // 2. Evaluate candidate matching against the corresponding job
    const applicationsWithMatch = await Promise.all(
      applications.map(async (app) => {
        const student = app.student;
        const resume = app.resume;
        const job = app.job;

        const candidateSkills = (resume && resume.detectedSkills && resume.detectedSkills.length > 0)
          ? resume.detectedSkills
          : (student?.skills || []);

        const candidateDomain = resume?.detectedDomain || 'General';
        const candidateRelevantDomains = resume?.relevantDomains || [candidateDomain];
        const candidateText = resume?.extractedText || '';

        let matchData = {
          matchScore: 50,
          matchedSkills: [],
          missingSkills: job?.requiredSkills || [],
          skillMatchRate: 0,
          domainAlignment: 'Moderate',
          priority: 'Moderate Fit',
          explanation: ''
        };

        if (job) {
          matchData = await evaluateCandidateMatch(
            candidateSkills,
            candidateDomain,
            candidateRelevantDomains,
            candidateText,
            job
          );
        }

        return {
          _id: app._id,
          status: app.status,
          appliedAt: app.appliedAt,
          interviewDate: app.interviewDate,
          notes: app.notes,
          timeline: app.timeline,
          candidate: {
            _id: student?._id,
            fullName: student?.fullName || 'Anonymous Candidate',
            email: student?.email || '',
            skills: candidateSkills,
            detectedDomain: candidateDomain,
            atsScore: resume?.atsScore || 0,
            resumeUrl: resume?.filePath || ''
          },
          job: {
            _id: job?._id,
            title: job?.title,
            company: job?.company,
            domain: job?.domain,
            requiredSkills: job?.requiredSkills || []
          },
          match: matchData
        };
      })
    );

    // Apply text search if requested
    let results = applicationsWithMatch;
    if (search && search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(
        (a) =>
          a.candidate.fullName.toLowerCase().includes(q) ||
          a.candidate.email.toLowerCase().includes(q) ||
          a.job.title.toLowerCase().includes(q) ||
          a.candidate.skills.some((s) => s.toLowerCase().includes(q))
      );
    }

    res.status(200).json({
      success: true,
      count: results.length,
      applications: results
    });
  } catch (error) {
    console.error('Error fetching recruiter applications:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching applications'
    });
  }
};

// @desc    Get single application details with deep candidate matching
// @route   GET /api/recruiter/applications/:id
// @access  Private (Recruiter)
exports.getRecruiterApplicationById = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('job')
      .populate('student', 'fullName email skills')
      .populate('resume');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Ownership check: job must belong to logged-in recruiter
    if (application.job.postedBy && application.job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this candidate application'
      });
    }

    const student = application.student;
    const resume = application.resume;
    const job = application.job;

    const candidateSkills = (resume && resume.detectedSkills && resume.detectedSkills.length > 0)
      ? resume.detectedSkills
      : (student?.skills || []);

    const candidateDomain = resume?.detectedDomain || 'General';
    const candidateRelevantDomains = resume?.relevantDomains || [candidateDomain];
    const candidateText = resume?.extractedText || '';

    const matchData = await evaluateCandidateMatch(
      candidateSkills,
      candidateDomain,
      candidateRelevantDomains,
      candidateText,
      job
    );

    res.status(200).json({
      success: true,
      application: {
        _id: application._id,
        status: application.status,
        appliedAt: application.appliedAt,
        interviewDate: application.interviewDate,
        notes: application.notes,
        timeline: application.timeline,
        candidate: {
          _id: student?._id,
          fullName: student?.fullName || 'Anonymous Candidate',
          email: student?.email || '',
          skills: candidateSkills,
          detectedDomain: candidateDomain,
          atsScore: resume?.atsScore || 0,
          parsedData: resume?.parsedData || {},
          resumeOriginalName: resume?.originalName || ''
        },
        job: {
          _id: job._id,
          title: job.title,
          company: job.company,
          location: job.location,
          salary: job.salary,
          jobType: job.jobType,
          domain: job.domain,
          requiredSkills: job.requiredSkills || [],
          preferredSkills: job.preferredSkills || [],
          description: job.description
        },
        match: matchData
      }
    });
  } catch (error) {
    console.error('Error fetching application details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching application details'
    });
  }
};

// @desc    Update application status & append timeline with candidate notification
// @route   PATCH /api/recruiter/applications/:id/status
// @access  Private (Recruiter)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status, notes, interviewDate } = req.body;

    const allowedStatuses = [
      'Applied',
      'Under Review',
      'Shortlisted',
      'Interview Scheduled',
      'Interview',
      'Rejected',
      'Selected',
      'Hired'
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}`
      });
    }

    const application = await Application.findById(req.params.id).populate('job');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Ownership check
    if (application.job.postedBy && application.job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update status for this job application'
      });
    }

    // Permitted transition check (terminal states cannot be reverted to Applied)
    const currentStatus = application.status;
    if ((currentStatus === 'Hired' || currentStatus === 'Selected') && status === 'Applied') {
      return res.status(400).json({
        success: false,
        message: 'Hired candidates cannot be reverted back to Applied state.'
      });
    }

    // Update status
    application.status = status;
    if (notes) application.notes = notes;
    if (interviewDate) application.interviewDate = new Date(interviewDate);

    // Append to timeline
    application.timeline.push({
      status,
      date: new Date(),
      notes: notes || `Application moved to ${status} by recruiter`
    });

    await application.save();

    // Create notification for the student
    try {
      await Notification.create({
        user: application.student,
        title: `Application Status: ${status}`,
        message: `Your application for "${application.job.title}" at "${application.job.company}" is now ${status}.`,
        type: 'application'
      });
    } catch (notifErr) {
      console.warn('[RecruiterController] Could not send student notification:', notifErr.message);
    }

    res.status(200).json({
      success: true,
      message: `Application status updated to ${status}`,
      application
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating application status'
    });
  }
};
