import User from '../models/User.js';
import Student from '../models/Student.js';
import { hashPassword, comparePassword } from '../utils/passwordHelper.js';
import { generateToken } from '../utils/tokenGenerator.js';

// Register
export const register = async (req, res) => {
  try {
    const { name, email, password, role, department, phone, address } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'Student Assistant',
      department,
      phone,
      address,
    });

    const savedUser = await newUser.save();

    // If registering as Student Assistant, create corresponding Student record
    if (role === 'Student Assistant' || !role) {
      const newStudent = new Student({
        userId: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        department: savedUser.department || 'Not Assigned',
        phone: savedUser.phone,
        address: savedUser.address,
        avatar: savedUser.avatar,
      });
      await newStudent.save();
    }

    // Generate token
    const token = generateToken(savedUser._id, savedUser.email, savedUser.role, savedUser.department);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        userId: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
        department: savedUser.department,
        phone: savedUser.phone || '',
        address: savedUser.address || '',
        avatar: savedUser.avatar,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error registering user',
    });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Compare passwords
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate token
    const token = generateToken(user._id, user.email, user.role, user.department);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone || '',
        address: user.address || '',
        avatar: user.avatar,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error logging in',
    });
  }
};

// Verify token (for checking if user is authenticated)
export const verifyToken = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Token is valid',
    data: req.user,
  });
};

export default { register, login, verifyToken };