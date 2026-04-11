import express from 'express';
import { getMyAttendance, getAllAttendance, getAttendanceById, clockIn, clockOut, deleteAttendance } from '../controllers/attendanceController.js';
import { authMiddleware } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

// All attendance routes require authentication
router.use(authMiddleware);

// IMPORTANT: Specific routes must come BEFORE routes with :id parameter

// Get current user's own attendance records (all authenticated users)
router.get('/me', getMyAttendance);

// Clock in (Authenticated users)
router.post('/clock-in', clockIn);

// Clock out (Authenticated users)
router.put('/:id/clock-out', clockOut);

// Get all attendance (Supervisor & Admin only) - AFTER /me
router.get('/', authorize('Supervisor', 'Admin'), getAllAttendance);

// Get attendance by ID (Supervisor & Admin)
router.get('/:id', authorize('Supervisor', 'Admin'), getAttendanceById);

// Delete attendance (Supervisor & Admin only)
router.delete('/:id', authorize('Supervisor', 'Admin'), deleteAttendance);

export default router;
