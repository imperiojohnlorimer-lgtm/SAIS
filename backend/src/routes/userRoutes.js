import express from 'express';
import User from '../models/User.js';
import { getAllUsers, getUserById, updateUser, deleteUser, updateMyProfile } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

// All user routes require authentication
router.use(authMiddleware);

// Personal profile route MUST come first (any authenticated user)
router.put('/profile/me', updateMyProfile);
router.get('/profile/me', async (req, res) => {
  try {
    const userId = req.user?.userId;
    const user = await User.findById(userId).select('-password');
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Admin and Supervisor routes
router.get('/', authorize('Admin', 'Supervisor'), getAllUsers);
router.get('/:id', authorize('Admin'), getUserById);
router.put('/:id', authorize('Admin'), updateUser);
router.delete('/:id', authorize('Admin'), deleteUser);

export default router;
