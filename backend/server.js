const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { protect, authorize } = require('./middleware/auth.middleware');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

const path = require('path');

// Serve uploaded files securely
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount Routes
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const resumeRoutes = require('./routes/resume.routes');
const jobRoutes = require('./routes/job.routes');
const applicationRoutes = require('./routes/application.routes');
const courseRoutes = require('./routes/course.routes');
const notificationRoutes = require('./routes/notification.routes');
const recruiterRoutes = require('./routes/recruiter.routes');
const adminRoutes = require('./routes/admin.routes');

app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/admin', adminRoutes);

// Role Test Protected Routes for Authorization Verification
app.get('/api/test/student-only', protect, authorize('student'), (req, res) => {
  res.json({ success: true, message: 'Welcome Student! Access granted.', user: req.user });
});

app.get('/api/test/recruiter-only', protect, authorize('recruiter'), (req, res) => {
  res.json({ success: true, message: 'Welcome Recruiter! Access granted.', user: req.user });
});

app.get('/api/test/admin-only', protect, authorize('admin'), (req, res) => {
  res.json({ success: true, message: 'Welcome Admin! Access granted.', user: req.user });
});

// Root route welcome
app.get('/', (req, res) => {
  res.json({
    message: 'SkillSync API Server is operational',
    healthCheck: '/api/health',
    authEndpoints: '/api/auth'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`[Backend] SkillSync Express server running on port ${PORT}`);
});
