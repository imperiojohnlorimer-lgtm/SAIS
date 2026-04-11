import express from 'express';
import { getAllTasks, getTaskById, createTask, updateTask, deleteTask } from '../controllers/taskController.js';
import { authMiddleware } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

// All task routes require authentication
router.use(authMiddleware);

// Get all tasks (Supervisor, Admin & Student Assistant)
router.get('/', (req, res, next) => {
  // Allow all authenticated users to view tasks
  next();
}, getAllTasks);

// Get task by ID
router.get('/:id', getTaskById);

// Create task (Supervisor & Admin only)
router.post('/', authorize('Supervisor', 'Admin'), createTask);

// Update task (Supervisor, Admin & Student Assistant can update status)
router.put('/:id', (req, res, next) => {
  // Allow Supervisors and Admins for full updates
  // Allow Student Assistants to update status only
  next();
}, updateTask);

// Delete task (Supervisor & Admin)
router.delete('/:id', authorize('Supervisor', 'Admin'), deleteTask);

export default router;
