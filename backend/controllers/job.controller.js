const Job = require('../models/Job.model');
const SavedJob = require('../models/SavedJob.model');
const Resume = require('../models/Resume.model');
const Application = require('../models/Application.model');
const User = require('../models/User.model');
const { callMlService } = require('../utils/mlClient');

// @desc    Get all active jobs
// @route   GET /api/jobs
// @access  Public / Private
exports.getJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true }).sort({ createdAt: -1 });

    // Check if user is logged in to mark saved jobs
    let savedJobIds = [];
    if (req.user) {
      const savedJobs = await SavedJob.find({ user: req.user.id }).select('job');
      savedJobIds = savedJobs.map((sj) => sj.job.toString());
    }

    const jobsWithSavedFlag = jobs.map((job) => ({
      ...job.toObject(),
      isSaved: savedJobIds.includes(job._id.toString())
    }));

    res.status(200).json({
      success: true,
      count: jobsWithSavedFlag.length,
      jobs: jobsWithSavedFlag
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching jobs'
    });
  }
};

// @desc    Get single job by ID
// @route   GET /api/jobs/:id
// @access  Public / Private
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    let isSaved = false;
    let isApplied = false;
    if (req.user) {
      const existingSaved = await SavedJob.findOne({ user: req.user.id, job: job._id });
      isSaved = !!existingSaved;

      const existingApp = await Application.findOne({ student: req.user.id, job: job._id });
      isApplied = !!existingApp;
    }

    res.status(200).json({
      success: true,
      job: {
        ...job.toObject(),
        isSaved,
        isApplied
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching job details'
    });
  }
};

// @desc    Get AI-matched recommended jobs for the authenticated student
// @route   GET /api/jobs/recommendations
// @access  Private (Student)
exports.getRecommendedJobs = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const resume = await Resume.findOne({ user: req.user.id, status: 'analyzed' }).sort({ createdAt: -1 });

    const candidateSkills = (resume && resume.detectedSkills && resume.detectedSkills.length > 0)
      ? resume.detectedSkills
      : (user?.skills || []);

    const candidateDomain = (resume && resume.detectedDomain && resume.detectedDomain !== 'Unknown')
      ? resume.detectedDomain
      : (user?.domain || 'General');

    const candidateRelevantDomains = (resume && resume.relevantDomains && resume.relevantDomains.length > 0)
      ? resume.relevantDomains
      : [candidateDomain];

    const candidateText = resume?.extractedText || '';

    // Fetch all active jobs from MongoDB
    const jobs = await Job.find({ isActive: true }).lean();

    if (jobs.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        candidateDomain,
        candidateRelevantDomains,
        candidateSkills,
        jobs: []
      });
    }

    // User's saved jobs and applications
    const [savedJobs, userApps] = await Promise.all([
      SavedJob.find({ user: req.user.id }).select('job'),
      Application.find({ student: req.user.id }).select('job')
    ]);
    const savedJobIds = savedJobs.map((sj) => sj.job.toString());
    const appliedJobIds = userApps.map((app) => app.job.toString());

    // Call ML Service for AI Job Matching & Ranking
    let rankedJobs = [];
    try {
      const mlResponse = await callMlService('/api/ml/match-jobs', {
        candidate_skills: candidateSkills,
        candidate_domain: candidateDomain,
        candidate_relevant_domains: candidateRelevantDomains,
        candidate_text: candidateText,
        jobs: jobs.map((j) => ({
          ...j,
          _id: j._id.toString()
        }))
      });

      if (mlResponse && mlResponse.jobs) {
        rankedJobs = mlResponse.jobs;
      }
    } catch (mlErr) {
      console.warn('[JobController] ML service fallback matching:', mlErr.message);
      // Fallback matching if ML service temporarily unreachable
      rankedJobs = jobs.map((job) => {
        const reqSkills = job.requiredSkills || [];
        const matched = reqSkills.filter((s) =>
          candidateSkills.some((cs) => cs.toLowerCase() === s.toLowerCase())
        );
        const missing = reqSkills.filter((s) => !matched.includes(s));
        const ratio = reqSkills.length > 0 ? matched.length / reqSkills.length : 0.5;
        const score = Math.round(ratio * 75 + (job.domain === candidateDomain ? 25 : 5));
        return {
          ...job,
          matchScore: score,
          matchedSkills: matched,
          missingSkills: missing,
          skillMatchRate: Math.round(ratio * 100),
          domainAlignment: job.domain === candidateDomain ? 'High' : 'Moderate',
          priority: score >= 75 ? 'High Match' : (score >= 50 ? 'Moderate Fit' : 'Potential Fit'),
          explanation: `Matched ${matched.length} of ${reqSkills.length} required skills.`
        };
      }).sort((a, b) => b.matchScore - a.matchScore);
    }

    // Annotate with isSaved and isApplied flags
    const jobsWithFlags = rankedJobs.map((j) => ({
      ...j,
      isSaved: savedJobIds.includes(j._id.toString()),
      isApplied: appliedJobIds.includes(j._id.toString())
    }));

    res.status(200).json({
      success: true,
      count: jobsWithFlags.length,
      candidateDomain,
      candidateRelevantDomains,
      candidateSkills,
      hasAnalyzedResume: !!resume,
      jobs: jobsWithFlags
    });
  } catch (error) {
    console.error('Error fetching recommended jobs:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching recommended jobs'
    });
  }
};

// @desc    Get prioritized domain skill gap analysis for student
// @route   GET /api/jobs/skill-gaps
// @access  Private (Student)
exports.getSkillGaps = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const resume = await Resume.findOne({ user: req.user.id, status: 'analyzed' }).sort({ createdAt: -1 });

    const candidateSkills = (resume && resume.detectedSkills && resume.detectedSkills.length > 0)
      ? resume.detectedSkills
      : (user?.skills || []);

    const candidateDomain = (resume && resume.detectedDomain && resume.detectedDomain !== 'Unknown')
      ? resume.detectedDomain
      : (user?.domain || 'IT and Software Development');

    // Fetch active jobs in this domain for market demand frequency
    const activeJobs = await Job.find({ isActive: true, domain: candidateDomain }).lean();

    const gapResult = await callMlService('/api/ml/skill-gaps', {
      candidate_skills: candidateSkills,
      candidate_domain: candidateDomain,
      jobs: activeJobs.map((j) => ({
        ...j,
        _id: j._id.toString()
      }))
    });

    // Persist in Resume document if resume exists
    if (resume) {
      resume.skillGaps = gapResult;
      await resume.save();
    }

    res.status(200).json({
      success: true,
      ...gapResult,
      hasAnalyzedResume: !!resume
    });
  } catch (error) {
    console.error('Error analyzing skill gaps:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error performing skill gap analysis'
    });
  }
};

// @desc    Save job
// @route   POST /api/jobs/:id/save
// @access  Private (Student)
exports.saveJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const existing = await SavedJob.findOne({ user: req.user.id, job: jobId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Job is already saved'
      });
    }

    const savedJob = await SavedJob.create({
      user: req.user.id,
      job: jobId
    });

    res.status(201).json({
      success: true,
      message: 'Job saved successfully',
      savedJob
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error saving job'
    });
  }
};

// @desc    Remove saved job
// @route   DELETE /api/jobs/:id/save
// @access  Private (Student)
exports.unsaveJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const deleted = await SavedJob.findOneAndDelete({ user: req.user.id, job: jobId });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Saved job not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Job removed from saved list'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing saved job'
    });
  }
};

// @desc    Get user's saved jobs
// @route   GET /api/jobs/saved
// @access  Private (Student)
exports.getSavedJobs = async (req, res) => {
  try {
    const savedJobs = await SavedJob.find({ user: req.user.id })
      .populate('job')
      .sort({ savedAt: -1 });

    const jobs = savedJobs
      .filter((sj) => sj.job !== null)
      .map((sj) => ({
        ...sj.job.toObject(),
        savedAt: sj.savedAt,
        savedJobId: sj._id,
        isSaved: true
      }));

    res.status(200).json({
      success: true,
      count: jobs.length,
      savedJobs: jobs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching saved jobs'
    });
  }
};
