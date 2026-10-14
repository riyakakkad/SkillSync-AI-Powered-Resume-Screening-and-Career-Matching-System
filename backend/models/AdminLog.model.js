const mongoose = require('mongoose');

const AdminLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    adminEmail: {
      type: String,
      required: true
    },
    action: {
      type: String,
      required: true
    },
    targetType: {
      type: String,
      enum: ['User', 'Job', 'Application', 'System'],
      required: true
    },
    targetId: {
      type: String,
      default: ''
    },
    details: {
      type: String,
      default: ''
    },
    ipAddress: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Index for performant querying of recent logs
AdminLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AdminLog', AdminLogSchema);
