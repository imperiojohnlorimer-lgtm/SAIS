import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
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
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    timeIn: {
      type: String,
      required: [true, 'Time in is required'],
    },
    timeOut: {
      type: String,
      default: null,
    },
    totalHours: {
      type: Number,
      default: 0,
      min: [0, 'Total hours cannot be negative'],
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late', 'On Leave'],
      default: 'Present',
    },
  },
  { timestamps: true }
);

// Add indexes for faster queries
attendanceSchema.index({ studentId: 1 });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ studentId: 1, date: 1 });

export default mongoose.model('Attendance', attendanceSchema);
