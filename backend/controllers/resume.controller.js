const fs = require('fs');
const path = require('path');
const http = require('http');
const Resume = require('../models/Resume.model');
const User = require('../models/User.model');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// Helper to call FastAPI ML Service
function callMlService(endpoint, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint);
    const postData = JSON.stringify(body);

    const options = {
      hostname: url.hostname,
      port: url.port || 8000,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.detail || parsed.message || `ML Service returned status ${res.statusCode}`));
          }
        } catch (e) {
          reject(new Error(`ML Service invalid JSON response (status ${res.statusCode}): ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`ML Service Connection Error: ${err.message}`));
    });

    req.write(postData);
    req.end();
  });
}

// @desc    Upload resume (PDF / DOCX)
// @route   POST /api/resumes/upload
// @access  Private (Student)
exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a resume file (PDF or DOCX).'
      });
    }

    const resume = await Resume.create({
      user: req.user.id,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      status: 'uploaded',
      analysisStatus: 'uploaded'
    });

    res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully.',
      resume
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during resume upload.'
    });
  }
};

// @desc    Get user's uploaded resumes
// @route   GET /api/resumes
// @access  Private (Student)
exports.getResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: resumes.length,
      resumes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve resumes.'
    });
  }
};

// @desc    Get single resume details by ID
// @route   GET /api/resumes/:id
// @access  Private (Student)
exports.getResumeById = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found.'
      });
    }

    if (resume.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resume.'
      });
    }

    res.status(200).json({
      success: true,
      resume
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving resume details.'
    });
  }
};

// @desc    Delete resume file and record
// @route   DELETE /api/resumes/:id
// @access  Private (Student)
exports.deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found.'
      });
    }

    if (resume.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this resume.'
      });
    }

    if (fs.existsSync(resume.filePath)) {
      fs.unlinkSync(resume.filePath);
    }

    await resume.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Resume deleted successfully.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting resume.'
    });
  }
};

// @desc    Analyze resume via Python ML Service
// @route   POST /api/resumes/:id/analyze
// @access  Private (Student)
exports.analyzeResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found.'
      });
    }

    if (resume.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to analyze this resume.'
      });
    }

    // Set processing state
    resume.status = 'processing';
    resume.analysisStatus = 'processing';
    await resume.save();

    try {
      const mlResponse = await callMlService(`${ML_SERVICE_URL}/api/ml/analyze-resume`, {
        file_path: resume.filePath,
        file_type: resume.fileType
      });

      // Save ML Service results to MongoDB
      resume.extractedText = mlResponse.extractedText || '';
      resume.parsedData = mlResponse.parsedData || {};
      resume.detectedSkills = mlResponse.detectedSkills || [];
      resume.atsScore = mlResponse.atsScore || 0;
      resume.atsBreakdown = mlResponse.atsBreakdown || {};
      resume.detectedDomain = mlResponse.detectedDomain || 'Unknown';
      resume.relevantDomains = mlResponse.relevantDomains || [];
      resume.domainConfidence = mlResponse.domainConfidence || 0;
      resume.status = 'analyzed';
      resume.analysisStatus = 'analyzed';
      resume.analyzedAt = new Date();
      resume.analysisError = '';
      await resume.save();

      // Automatically update user profile skills array with newly detected skills
      if (mlResponse.detectedSkills && mlResponse.detectedSkills.length > 0) {
        const user = await User.findById(req.user.id);
        if (user) {
          const combinedSkills = Array.from(new Set([...(user.skills || []), ...mlResponse.detectedSkills]));
          user.skills = combinedSkills;
          await user.save();
        }
      }

      res.status(200).json({
        success: true,
        message: 'Resume analyzed successfully.',
        resume
      });
    } catch (mlErr) {
      resume.status = 'failed';
      resume.analysisStatus = 'failed';
      resume.analysisError = mlErr.message || 'ML Service processing error.';
      await resume.save();

      return res.status(502).json({
        success: false,
        message: `Resume analysis failed: ${mlErr.message}`,
        resume
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during resume analysis.'
    });
  }
};

// @desc    Get resume analysis and ATS score details
// @route   GET /api/resumes/:id/analysis
// @access  Private (Student)
exports.getResumeAnalysis = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found.'
      });
    }

    if (resume.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this analysis.'
      });
    }

    res.status(200).json({
      success: true,
      analysisStatus: resume.analysisStatus || resume.status,
      extractedText: resume.extractedText,
      parsedData: resume.parsedData,
      detectedSkills: resume.detectedSkills,
      atsScore: resume.atsScore,
      atsBreakdown: resume.atsBreakdown,
      detectedDomain: resume.detectedDomain || 'Unknown',
      relevantDomains: resume.relevantDomains || [],
      domainConfidence: resume.domainConfidence || 0,
      analyzedAt: resume.analyzedAt,
      analysisError: resume.analysisError,
      resume
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching resume analysis.'
    });
  }
};
