import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'Schedule date is required'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      minlength: [2, 'Subject must be at least 2 characters long'],
      maxlength: [100, 'Subject cannot exceed 100 characters'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Schedule must be created by a user'],
    },
    // Optional: for student-specific schedules
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      default: null,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
  },
  { timestamps: true }
);

// Index for faster queries
scheduleSchema.index({ date: 1 });
scheduleSchema.index({ studentId: 1, date: 1 });
scheduleSchema.index({ createdBy: 1 });

export default mongoose.model('Schedule', scheduleSchema);
