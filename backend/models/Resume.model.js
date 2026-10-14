const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    originalName: {
      type: String,
      required: [true, 'Original file name is required']
    },
    fileName: {
      type: String,
      required: [true, 'Stored file name is required']
    },
    filePath: {
      type: String,
      required: [true, 'File path is required']
    },
    fileType: {
      type: String,
      required: [true, 'File type is required']
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required']
    },
    status: {
      type: String,
      enum: ['uploaded', 'processing', 'analyzed', 'failed'],
      default: 'uploaded'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    // Phase 4 Analysis Fields
    extractedText: {
      type: String,
      default: ''
    },
    parsedData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    detectedSkills: [{
      type: String
    }],
    atsScore: {
      type: Number,
      default: 0
    },
    atsBreakdown: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    analysisStatus: {
      type: String,
      enum: ['uploaded', 'processing', 'analyzed', 'failed'],
      default: 'uploaded'
    },
    analyzedAt: {
      type: Date
    },
    analysisError: {
      type: String,
      default: ''
    },
    // Multi-Domain Resume Analysis Metadata
    detectedDomain: {
      type: String,
      default: 'Unknown'
    },
    relevantDomains: [{
      type: String
    }],
    domainConfidence: {
      type: Number,
      default: 0
    },
    // Phase 5 Skill Gap Analysis Cache
    skillGaps: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Resume', ResumeSchema);
