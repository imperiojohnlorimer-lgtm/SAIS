import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/departmentController.js';

const router = express.Router();

// Get all departments (public)
router.get('/', getAllDepartments);

// Get department by ID (public)
router.get('/:id', getDepartmentById);

// Create department (Admin only)
router.post('/', authMiddleware, authorize('Admin'), createDepartment);

// Update department (Admin only)
router.put('/:id', authMiddleware, authorize('Admin'), updateDepartment);

// Delete department (Admin only)
router.delete('/:id', authMiddleware, authorize('Admin'), deleteDepartment);

export default router;
