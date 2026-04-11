import express from 'express';
import { getAllReports, getReportById, submitReport, reviewReport } from '../controllers/reportController.js';
import { authMiddleware } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

// All report routes require authentication
router.use(authMiddleware);

// Get all reports (All roles can view - Supervisors see all, Students see their own)
router.get('/', getAllReports);

// Get report by ID
router.get('/:id', getReportById);

// Submit report (All authenticated users)
router.post('/', submitReport);

// Review report (Supervisor & Admin only)
router.patch('/:id/review', authorize('Supervisor', 'Admin'), reviewReport);

export default router;
