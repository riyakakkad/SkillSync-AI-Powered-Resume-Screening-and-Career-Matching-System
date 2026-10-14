const User = require('../models/User.model');
const Job = require('../models/Job.model');
const Application = require('../models/Application.model');
const Resume = require('../models/Resume.model');
const AdminLog = require('../models/AdminLog.model');

// Helper to log administrative actions
const createAuditLog = async ({ req, action, targetType, targetId, details }) => {
  try {
    const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
    await AdminLog.create({
      admin: req.user._id,
      adminEmail: req.user.email,
      action,
      targetType,
      targetId: targetId ? targetId.toString() : '',
      details: details || '',
      ipAddress
    });
  } catch (err) {
    console.warn('[AdminController] Warning: Could not record audit log:', err.message);
  }
};

// @desc    Get aggregate platform metrics and statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
exports.getAdminDashboard = async (req, res) => {
  try {
    // 1. User aggregations
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalRecruiters = await User.countDocuments({ role: 'recruiter' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const activeUsers = await User.countDocuments({ isActive: true });
    const deactivatedUsers = await User.countDocuments({ isActive: false });

    // 2. Job aggregations
    const totalJobs = await Job.countDocuments();
    const activeJobs = await Job.countDocuments({ isActive: true });
    const closedJobs = await Job.countDocuments({ isActive: false });

    // 3. Application aggregations & pipeline breakdown
    const totalApplications = await Application.countDocuments();
    const allApplications = await Application.find().select('status');

    const statusBreakdown = {
      applied: 0,
      underReview: 0,
      shortlisted: 0,
      interview: 0,
      hired: 0,
      rejected: 0
    };

    allApplications.forEach((app) => {
      const st = (app.status || '').toLowerCase();
      if (st === 'applied') statusBreakdown.applied++;
      else if (st === 'under review') statusBreakdown.underReview++;
      else if (st === 'shortlisted') statusBreakdown.shortlisted++;
      else if (st === 'interview' || st === 'interview scheduled') statusBreakdown.interview++;
      else if (st === 'hired' || st === 'selected') statusBreakdown.hired++;
      else if (st === 'rejected') statusBreakdown.rejected++;
    });

    // 4. Resume & ATS statistics
    const totalResumes = await Resume.countDocuments();
    const resumesWithAts = await Resume.find({ atsScore: { $gt: 0 } }).select('atsScore');
    const averageAtsScore =
      resumesWithAts.length > 0
        ? Math.round(resumesWithAts.reduce((sum, r) => sum + r.atsScore, 0) / resumesWithAts.length)
        : 0;

    // 5. Recent platform streams
    const recentUsers = await User.find()
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentJobs = await Job.find()
      .populate('postedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentApplications = await Application.find()
      .populate('student', 'fullName email')
      .populate('job', 'title company')
      .sort({ appliedAt: -1 })
      .limit(5);

    const recentLogs = await AdminLog.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          students: totalStudents,
          recruiters: totalRecruiters,
          admins: totalAdmins,
          active: activeUsers,
          deactivated: deactivatedUsers
        },
        jobs: {
          total: totalJobs,
          active: activeJobs,
          closed: closedJobs
        },
        applications: {
          total: totalApplications,
          statusBreakdown
        },
        resumes: {
          total: totalResumes,
          averageAtsScore
        }
      },
      recentUsers,
      recentJobs,
      recentApplications,
      recentLogs
    });
  } catch (error) {
    console.error('Error loading admin dashboard:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error loading administrator dashboard'
    });
  }
};

// @desc    Get paginated users with filtering & search
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { role, status, search } = req.query;

    const filter = {};

    // Filter by role
    if (role && ['student', 'recruiter', 'admin'].includes(role)) {
      filter.role = role;
    }

    // Filter by account active status
    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'deactivated') {
      filter.isActive = false;
    }

    // Search query on name or email
    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { fullName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ];
    }

    const totalUsers = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: users.length,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
      users
    });
  } catch (error) {
    console.error('Error fetching users for admin:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching users'
    });
  }
};

// @desc    Get detailed single user profile
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      '-password -resetPasswordToken -resetPasswordExpire'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found'
      });
    }

    let extraData = {};

    if (user.role === 'student') {
      const resumes = await Resume.find({ user: user._id }).select('originalName atsScore detectedDomain status createdAt');
      const applicationCount = await Application.countDocuments({ student: user._id });
      extraData = { resumes, applicationCount };
    } else if (user.role === 'recruiter') {
      const jobsPosted = await Job.find({ postedBy: user._id }).select('title company isActive createdAt');
      extraData = { jobsPosted, jobCount: jobsPosted.length };
    }

    res.status(200).json({
      success: true,
      user,
      extraData
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching user profile'
    });
  }
};

// @desc    Toggle user active/deactivated status
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin)
exports.toggleUserStatus = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // SAFEGUARD 1: Self-lockout prevention (Admin cannot deactivate self)
    if (targetUser._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Action rejected: Administrators cannot deactivate their own account.'
      });
    }

    // SAFEGUARD 2: Last active admin protection
    if (targetUser.role === 'admin' && targetUser.isActive) {
      const activeAdminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Action rejected: Cannot deactivate the sole remaining active administrator.'
        });
      }
    }

    // Apply explicit status if provided, or toggle
    if (typeof req.body.isActive === 'boolean') {
      targetUser.isActive = req.body.isActive;
    } else {
      targetUser.isActive = !targetUser.isActive;
    }

    await targetUser.save();

    // Audit log
    await createAuditLog({
      req,
      action: targetUser.isActive ? 'USER_ACTIVATE' : 'USER_DEACTIVATE',
      targetType: 'User',
      targetId: targetUser._id,
      details: `Admin ${req.user.email} ${targetUser.isActive ? 'activated' : 'deactivated'} user account: ${targetUser.email} (Role: ${targetUser.role})`
    });

    res.status(200).json({
      success: true,
      message: `User ${targetUser.email} is now ${targetUser.isActive ? 'active' : 'deactivated'}`,
      user: {
        _id: targetUser._id,
        fullName: targetUser.fullName,
        email: targetUser.email,
        role: targetUser.role,
        isActive: targetUser.isActive
      }
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating user status'
    });
  }
};

// @desc    Get paginated platform jobs with filtering
// @route   GET /api/admin/jobs
// @access  Private (Admin)
exports.getJobs = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { status, domain, search } = req.query;

    const filter = {};

    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'closed') {
      filter.isActive = false;
    }

    if (domain && domain !== 'All Domains') {
      filter.domain = domain;
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { company: { $regex: q, $options: 'i' } },
        { location: { $regex: q, $options: 'i' } }
      ];
    }

    const totalJobs = await Job.countDocuments(filter);
    const jobs = await Job.find(filter)
      .populate('postedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Compute applicant counts for these jobs
    const jobIds = jobs.map((j) => j._id);
    const applications = await Application.find({ job: { $in: jobIds } }).select('job');

    const jobsWithMetrics = jobs.map((job) => {
      const appCount = applications.filter((a) => a.job.toString() === job._id.toString()).length;
      return {
        ...job.toObject(),
        applicantCount: appCount
      };
    });

    res.status(200).json({
      success: true,
      count: jobsWithMetrics.length,
      totalJobs,
      totalPages: Math.ceil(totalJobs / limit),
      currentPage: page,
      jobs: jobsWithMetrics
    });
  } catch (error) {
    console.error('Error fetching jobs for admin:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching platform jobs'
    });
  }
};

// @desc    Get single job details for admin inspection
// @route   GET /api/admin/jobs/:id
// @access  Private (Admin)
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('postedBy', 'fullName email');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    const applicantCount = await Application.countDocuments({ job: job._id });
    const applications = await Application.find({ job: job._id })
      .populate('student', 'fullName email')
      .select('status appliedAt student')
      .limit(10);

    res.status(200).json({
      success: true,
      job: {
        ...job.toObject(),
        applicantCount,
        recentApplications: applications
      }
    });
  } catch (error) {
    console.error('Error fetching job details for admin:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching job details'
    });
  }
};

// @desc    Toggle job active status (Admin override)
// @route   PATCH /api/admin/jobs/:id/status
// @access  Private (Admin)
exports.toggleJobStatus = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    if (typeof req.body.isActive === 'boolean') {
      job.isActive = req.body.isActive;
    } else {
      job.isActive = !job.isActive;
    }

    await job.save();

    await createAuditLog({
      req,
      action: 'JOB_TOGGLE_STATUS',
      targetType: 'Job',
      targetId: job._id,
      details: `Admin ${req.user.email} changed status for "${job.title}" at "${job.company}" to ${job.isActive ? 'Active' : 'Closed'}`
    });

    res.status(200).json({
      success: true,
      message: `Job ${job.isActive ? 'activated' : 'closed'} successfully`,
      job
    });
  } catch (error) {
    console.error('Error toggling job status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating job status'
    });
  }
};

// @desc    Delete inappropriate job (Admin moderation)
// @route   DELETE /api/admin/jobs/:id
// @access  Private (Admin)
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    const jobTitle = job.title;
    const company = job.company;

    await job.deleteOne();

    await createAuditLog({
      req,
      action: 'JOB_DELETE',
      targetType: 'Job',
      targetId: req.params.id,
      details: `Admin ${req.user.email} permanently removed job posting "${jobTitle}" at "${company}"`
    });

    res.status(200).json({
      success: true,
      message: `Job posting "${jobTitle}" permanently deleted.`
    });
  } catch (error) {
    console.error('Error deleting job by admin:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting job'
    });
  }
};

// @desc    Monitor platform applications (Read-only monitoring)
// @route   GET /api/admin/applications
// @access  Private (Admin)
exports.getApplications = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const skip = (page - 1) * limit;

    const { status, search } = req.query;

    const filter = {};

    if (status && status !== 'All') {
      filter.status = status;
    }

    const totalApplications = await Application.countDocuments(filter);

    let applications = await Application.find(filter)
      .populate('job', 'title company location domain')
      .populate('student', 'fullName email')
      .populate('resume', 'atsScore detectedDomain detectedSkills')
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Filter by student or company name if search provided
    if (search && search.trim()) {
      const q = search.toLowerCase();
      applications = applications.filter(
        (a) =>
          a.student?.fullName?.toLowerCase().includes(q) ||
          a.student?.email?.toLowerCase().includes(q) ||
          a.job?.title?.toLowerCase().includes(q) ||
          a.job?.company?.toLowerCase().includes(q)
      );
    }

    res.status(200).json({
      success: true,
      count: applications.length,
      totalApplications,
      totalPages: Math.ceil(totalApplications / limit),
      currentPage: page,
      applications
    });
  } catch (error) {
    console.error('Error fetching applications for admin:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error monitoring platform applications'
    });
  }
};

// @desc    Get admin audit activity logs
// @route   GET /api/admin/logs
// @access  Private (Admin)
exports.getAdminLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const { action, targetType } = req.query;

    const filter = {};

    if (action) filter.action = action;
    if (targetType) filter.targetType = targetType;

    const totalLogs = await AdminLog.countDocuments(filter);
    const logs = await AdminLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: logs.length,
      totalLogs,
      totalPages: Math.ceil(totalLogs / limit),
      currentPage: page,
      logs
    });
  } catch (error) {
    console.error('Error fetching admin activity logs:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching activity logs'
    });
  }
};
