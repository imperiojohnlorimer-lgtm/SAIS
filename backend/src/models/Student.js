import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    name: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Graduated', 'On Leave'],
      default: 'Active',
    },
    totalHours: {
      type: Number,
      default: 0,
      min: [0, 'Total hours cannot be negative'],
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Add indexes for faster queries
studentSchema.index({ userId: 1 });
studentSchema.index({ department: 1 });
studentSchema.index({ status: 1 });
studentSchema.index({ email: 1 });

export default mongoose.model('Student', studentSchema);
