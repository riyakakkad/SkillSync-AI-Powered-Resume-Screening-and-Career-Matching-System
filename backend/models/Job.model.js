const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true
    },
    companyLogo: {
      type: String,
      default: ''
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true
    },
    salary: {
      type: String,
      default: 'Competitive'
    },
    jobType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Internship', 'Contract', 'Remote'],
      default: 'Full-time'
    },
    description: {
      type: String,
      required: [true, 'Job description is required']
    },
    requiredSkills: [{
      type: String
    }],
    preferredSkills: [{
      type: String
    }],
    experienceLevel: {
      type: String,
      default: 'Entry-level'
    },
    domain: {
      type: String,
      default: 'General',
      trim: true
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Job', JobSchema);
