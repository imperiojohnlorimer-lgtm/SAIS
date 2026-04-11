import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters long'],
    },
    description: {
      type: String,
      required: [true, 'Task description is required'],
      minlength: [10, 'Description must be at least 10 characters long'],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Task must be assigned to a student'],
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task must be assigned by a supervisor'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed', 'On Hold'],
      default: 'Not Started',
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Task', taskSchema);
