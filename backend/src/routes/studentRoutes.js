import express from 'express';
import { getAllStudents, getMyStudent, getStudentById, createStudent, updateStudent, deleteStudent, linkStudentAssistants } from '../controllers/studentController.js';
import { authMiddleware } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

// All student routes require authentication
router.use(authMiddleware);

// IMPORTANT: Specific routes must come BEFORE generic routes like /:id
// Get current user's student record (anyone can get their own - NO authorize needed)
router.get('/me', getMyStudent);

// Get all students (Supervisor & Admin)
router.get('/', authorize('Supervisor', 'Admin'), getAllStudents);

// Link orphaned Student Assistant users to Student records (Admin only) - BEFORE :id
router.post('/link/assistants', authorize('Admin'), linkStudentAssistants);

// Generic /:id routes LAST (specific routes above take precedence)
// Get student by ID (Supervisor & Admin, or own profile)
router.get('/:id', (req, res, next) => {
  // Check if user is accessing their own data or is authorized
  const canAccess = req.user.role === 'Admin' || req.user.role === 'Supervisor';
  if (!canAccess) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  next();
}, getStudentById);

// Update student (Admin & Supervisor only)
router.put('/:id', authorize('Admin', 'Supervisor'), updateStudent);

// Delete student (Admin only)
router.delete('/:id', authorize('Admin'), deleteStudent);

export default router;
