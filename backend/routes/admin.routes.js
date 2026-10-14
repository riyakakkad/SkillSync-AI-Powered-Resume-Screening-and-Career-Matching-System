const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getUsers,
  getUserById,
  toggleUserStatus,
  getJobs,
  getJobById,
  toggleJobStatus,
  deleteJob,
  getApplications,
  getAdminLogs
} = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Protect all admin routes with authentication and role check
router.use(protect);
router.use(authorize('admin'));

// Dashboard statistics
router.get('/dashboard', getAdminDashboard);

// User management
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id/status', toggleUserStatus);

// Job moderation & management
router.get('/jobs', getJobs);
router.get('/jobs/:id', getJobById);
router.patch('/jobs/:id/status', toggleJobStatus);
router.delete('/jobs/:id', deleteJob);

// Application monitoring
router.get('/applications', getApplications);

// Audit activity logs
router.get('/logs', getAdminLogs);

module.exports = router;
