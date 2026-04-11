import express from 'express';
import {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from '../controllers/scheduleController.js';
import { authMiddleware } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

// All schedule routes require authentication
router.use(authMiddleware);

// Get schedules with optional date range and student filter
router.get('/', getSchedules);

// Get schedule by ID (all authenticated users)
router.get('/:id', getScheduleById);

// Create schedule (all authenticated users can create their own)
router.post('/', createSchedule);

// Update schedule (Creator or authorized users)
router.put('/:id', updateSchedule);

// Delete schedule (Creator or authorized users)
router.delete('/:id', deleteSchedule);

export default router;
