import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Department name must be at least 3 characters long'],
    },
    code: {
      type: String,
      required: [true, 'Department code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [10, 'Department code cannot exceed 10 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    head: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Department', departmentSchema);
