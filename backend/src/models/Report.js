import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
    },
    studentName: {
      type: String,
      required: [true, 'Student name is required'],
    },
    title: {
      type: String,
      required: [true, 'Report title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters long'],
    },
    content: {
      type: String,
      required: [true, 'Report content is required'],
      minlength: [10, 'Content must be at least 10 characters long'],
    },
    status: {
      type: String,
      enum: ['Pending', 'Under Review', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    feedback: {
      type: String,
      trim: true,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Report', reportSchema);
