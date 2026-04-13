import Student from '../models/Student.js';
import User from '../models/User.js';

// Get all students
export const getAllStudents = async (req, res) => {
  try {
    const { status, department, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (department) filter.department = department;

    const parsedLimit = Math.min(parseInt(limit), 100); // Cap limit at 100 to prevent resource exhaustion
    const parsedPage = Math.max(parseInt(page), 1);
    const skip = (parsedPage - 1) * parsedLimit;
    
    // Get all students with populated user data
    const allStudents = await Student.find(filter)
      .populate({
        path: 'userId',
        select: 'name email role department phone address avatar'
      })
      .sort({ createdAt: -1 })
      .lean();
    
    // Filter out students where the referenced user doesn't exist or is not a Student Assistant
    const validStudents = allStudents.filter(s => s.userId !== null && s.userId.role === 'Student Assistant');
    
    // Apply pagination after filtering
    const total = validStudents.length;
    const paginatedStudents = validStudents.slice(skip, skip + parsedLimit);

    res.status(200).json({
      success: true,
      message: 'Students fetched successfully',
      data: paginatedStudents,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching students',
    });
  }
};

// Get current user's student record
export const getMyStudent = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(`🔍 getMyStudent called for userId: ${userId}`);
    
    let student = await Student.findOne({ userId })
      .populate({
        path: 'userId',
        select: 'name email role department phone address avatar'
      });
    
    console.log(`📋 Existing student found: ${student ? 'Yes' : 'No'}`);
    
    // If no student record exists, create one
    if (!student) {
      console.log(`📝 Creating new Student record...`);
      const user = await User.findById(userId);
      console.log(`👤 User found: ${user ? 'Yes' : 'No'}, Role: ${user?.role}`);
      
      if (!user) {
        console.log(`❌ User not found with ID: ${userId}`);
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }
      
      if (user.role !== 'Student Assistant') {
        console.log(`❌ User role is ${user.role}, not Student Assistant`);
        return res.status(400).json({
          success: false,
          message: 'Only Student Assistants can have student records',
        });
      }
      
      // Create new Student record
      student = new Student({
        userId: user._id,
        name: user.name,
        email: user.email,
        department: user.department,
        status: 'Active',
      });
      
      await student.save();
      console.log(`✅ Created Student record: ${student._id}`);
      
      // Populate user data
      await student.populate({
        path: 'userId',
        select: 'name email role department phone address avatar'
      });
      
      console.log(`✅ Auto-created Student record for user ${userId}`);
    }
    
    res.status(200).json({
      success: true,
      message: 'Student record fetched successfully',
      data: student,
    });
  } catch (error) {
    console.error('❌ Error in getMyStudent:', error.message);
    console.error('Full error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching student record',
    });
  }
};

// Get student by ID
export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id).populate({
      path: 'userId',
      select: 'name email role department phone address avatar',
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Check if the linked user still has Student Assistant role
    if (student.userId && student.userId.role !== 'Student Assistant') {
      return res.status(400).json({
        success: false,
        message: 'User is no longer a Student Assistant',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Student fetched successfully',
      data: student,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching student',
    });
  }
};

// Create student
export const createStudent = async (req, res) => {
  try {
    const { userId, name, email, department, status, totalHours, phone, address, avatar } = req.body;

    if (!userId || !name || !email || !department) {
      return res.status(400).json({
        success: false,
        message: 'userId, name, email, and department are required',
      });
    }

    const newStudent = new Student({
      userId,
      name,
      email,
      department,
      status: status || 'Active',
      totalHours: totalHours || 0,
      phone,
      address,
      avatar,
    });

    const savedStudent = await newStudent.save();
    const populatedStudent = await savedStudent.populate('userId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: populatedStudent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating student',
    });
  }
};

// Update student
export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, department, status, totalHours, phone, address, avatar } = req.body;

    const student = await Student.findByIdAndUpdate(
      id,
      {
        name,
        department,
        status,
        totalHours,
        phone,
        address,
        avatar,
      },
      { new: true, runValidators: true }
    ).populate('userId', 'name email');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: student,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating student',
    });
  }
};

// Delete student
export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByIdAndDelete(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting student',
    });
  }
};

// Auto-link Student Assistant users to Student records
export const linkStudentAssistants = async (req, res) => {
  try {
    // Find all Student Assistant users
    const studentAssistants = await User.find({ role: 'Student Assistant' });

    // Find all users who already have Student records
    const existingStudents = await Student.find().select('userId');
    const existingUserIds = new Set(existingStudents.map(s => s.userId.toString()));

    // Filter to find Student Assistants without Student records
    const orphanedUsers = studentAssistants.filter(
      user => !existingUserIds.has(user._id.toString())
    );

    if (orphanedUsers.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'All Student Assistant users are already linked to Student records',
        data: { linked: 0 },
      });
    }

    // Create Student records for orphaned users
    const newStudentRecords = orphanedUsers.map(user => ({
      userId: user._id,
      name: user.name,
      email: user.email,
      department: user.department || 'Not Assigned',
      phone: user.phone,
      address: user.address,
      avatar: user.avatar,
    }));

    await Student.insertMany(newStudentRecords);

    res.status(201).json({
      success: true,
      message: `Successfully linked ${orphanedUsers.length} Student Assistant users to Student records`,
      data: { linked: orphanedUsers.length },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error linking student assistants',
    });
  }
};

export default { getAllStudents, getMyStudent, getStudentById, createStudent, updateStudent, deleteStudent, linkStudentAssistants };