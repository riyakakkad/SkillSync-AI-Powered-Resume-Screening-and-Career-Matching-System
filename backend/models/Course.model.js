const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema(
  {
    courseName: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true
    },
    platform: {
      type: String,
      required: [true, 'Platform name is required'],
      trim: true
    },
    instructor: {
      type: String,
      default: 'Industry Expert'
    },
    rating: {
      type: Number,
      default: 4.5
    },
    duration: {
      type: String,
      default: '10 hours'
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Intermediate'
    },
    skillCovered: {
      type: String,
      required: true
    },
    domain: {
      type: String,
      default: 'General',
      trim: true
    },
    progress: {
      type: Number,
      default: 0
    },
    link: {
      type: String,
      default: '#'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Course', CourseSchema);
