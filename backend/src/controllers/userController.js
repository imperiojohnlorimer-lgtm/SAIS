import User from '../models/User.js';
import Student from '../models/Student.js';

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const startTime = Date.now();
    console.log('📋 getAllUsers called');
    const { role, department, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (role) filter.role = role;
    if (department) filter.department = department;

    const parsedLimit = Math.min(parseInt(limit), 100); // Cap limit at 100
    const parsedPage = Math.max(parseInt(page), 1);
    const skip = (parsedPage - 1) * parsedLimit;
    
    console.log(`🔍 Query filter:`, filter, `skip: ${skip}, limit: ${parsedLimit}`);
    console.log(`⏳ Starting database find query...`);
    
    // Run queries in parallel for better performance
    const [users, total] = await Promise.all([
      User.find(filter)
        .skip(skip)
        .limit(parsedLimit)
        .select('-password')
        .lean(), // Use lean() for faster queries
      User.countDocuments(filter)
    ]);
    
    console.log(`✅ Found ${users.length} users in ${Date.now() - startTime}ms (total: ${total})`);

    res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      data: users,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    console.error('❌ Error in getAllUsers:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching users',
    });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User fetched successfully',
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching user',
    });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, department, phone, address, avatar, role } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      {
        name,
        department,
        phone,
        address,
        avatar,
        role,
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // If role is changed to Student Assistant, create or update Student record
    if (role === 'Student Assistant') {
      const existingStudent = await Student.findOne({ userId: user._id });
      
      if (!existingStudent) {
        // Create new Student record
        const newStudent = new Student({
          userId: user._id,
          name: user.name,
          email: user.email,
          department: user.department || 'Not Assigned',
          phone: user.phone,
          address: user.address,
          avatar: user.avatar,
        });
        await newStudent.save();
        console.log(`Created Student record for user ${user._id}`);
      } else {
        // Update existing Student record
        await Student.findByIdAndUpdate(existingStudent._id, {
          name: user.name,
          email: user.email,
          department: user.department,
          phone: user.phone,
          address: user.address,
          avatar: user.avatar,
        });
        console.log(`Updated Student record for user ${user._id}`);
      }
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating user',
    });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting user',
    });
  }
};

// Update own profile (authenticated users)
export const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user?.userId; // Get user ID from auth middleware
    console.log('Update profile request:', { userId, body: req.body });
    
    if (!userId) {
      console.log('No userId in token');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { name, phone, address, avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        name,
        phone,
        address,
        avatar,
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    console.log('Profile updated successfully');
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating profile',
    });
  }
};

export default { getAllUsers, getUserById, updateUser, deleteUser, updateMyProfile };
