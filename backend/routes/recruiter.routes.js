const express = require('express');
const router = express.Router();
const {
  getRecruiterDashboard,
  getRecruiterJobs,
  getRecruiterJobById,
  createJob,
  updateJob,
  toggleJobStatus,
  deleteJob,
  getRecruiterApplications,
  getRecruiterApplicationById,
  updateApplicationStatus
} = require('../controllers/recruiter.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Strict Recruiter Role Authorization Middleware
router.use(protect);
router.use(authorize('recruiter'));

// Dashboard Statistics
router.get('/dashboard', getRecruiterDashboard);

// Recruiter Job Postings CRUD
router.get('/jobs', getRecruiterJobs);
router.post('/jobs', createJob);
router.get('/jobs/:id', getRecruiterJobById);
router.put('/jobs/:id', updateJob);
router.patch('/jobs/:id/status', toggleJobStatus);
router.delete('/jobs/:id', deleteJob);

// Candidate Applications & AI Matching Review
router.get('/applications', getRecruiterApplications);
router.get('/applications/:id', getRecruiterApplicationById);
router.patch('/applications/:id/status', updateApplicationStatus);
router.put('/applications/:id/status', updateApplicationStatus);

module.exports = router;
