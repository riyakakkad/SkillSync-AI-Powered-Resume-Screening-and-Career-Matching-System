const express = require('express');
const router = express.Router();
const {
  getJobs,
  getJobById,
  saveJob,
  unsaveJob,
  getSavedJobs,
  getRecommendedJobs,
  getSkillGaps
} = require('../controllers/job.controller');
const {
  createJob,
  updateJob,
  deleteJob,
  toggleJobStatus
} = require('../controllers/recruiter.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// AI Matching & Skill Gap Endpoints (Protected for student)
router.get('/recommendations', protect, authorize('student'), getRecommendedJobs);
router.get('/skill-gaps', protect, authorize('student'), getSkillGaps);

// Saved jobs endpoints (protected for student)
router.get('/saved', protect, authorize('student'), getSavedJobs);
router.post('/:id/save', protect, authorize('student'), saveJob);
router.delete('/:id/save', protect, authorize('student'), unsaveJob);

// Public / Protected job listing & details
router.get('/', protect, getJobs);
router.get('/:id', protect, getJobById);

// Recruiter Job Management Endpoints
router.post('/', protect, authorize('recruiter'), createJob);
router.put('/:id', protect, authorize('recruiter'), updateJob);
router.patch('/:id/status', protect, authorize('recruiter'), toggleJobStatus);
router.delete('/:id', protect, authorize('recruiter'), deleteJob);

module.exports = router;
