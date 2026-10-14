const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true
    },
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume'
    },
    status: {
      type: String,
      enum: [
        'Applied',
        'Under Review',
        'Shortlisted',
        'Interview Scheduled',
        'Interview',
        'Rejected',
        'Selected',
        'Hired'
      ],
      default: 'Applied'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    interviewDate: {
      type: Date
    },
    notes: {
      type: String,
      default: ''
    },
    timeline: [
      {
        status: { type: String, required: true },
        date: { type: Date, default: Date.now },
        notes: { type: String, default: '' }
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Application', ApplicationSchema);
