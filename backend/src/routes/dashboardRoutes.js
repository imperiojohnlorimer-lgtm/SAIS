import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { authMiddleware } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

// Get dashboard stats - accessible to all authenticated users
router.get('/stats', authMiddleware, getDashboardStats);

export default router;
