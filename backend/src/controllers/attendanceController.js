import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';

// Get current user's attendance records (Student Assistants see their own)
export const getMyAttendance = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(`🔍 getMyAttendance called for userId: ${userId}`);
    
    // Find the student record for this user
    const student = await Student.findOne({ userId });
    console.log(`📋 Student found: ${student ? 'Yes' : 'No'}`);
    
    if (!student) {
      console.log(`⚠️ No student record found for user ${userId}`);
      return res.status(200).json({
        success: true,
        message: 'No attendance records',
        data: [],
      });
    }
    
    console.log(`✅ Student ID (ObjectId): ${student._id}`);
    console.log(`✅ Student ID type: ${typeof student._id}`);
    
    const { page = 1, limit = 100 } = req.query;
    const parsedLimit = Math.min(parseInt(limit), 100); // Cap limit at 100
    const parsedPage = Math.max(parseInt(page), 1);
    const skip = (parsedPage - 1) * parsedLimit;
    
    // Find attendance records with exact logging
    console.log(`🔎 Query: { studentId: "${student._id}" }`);
    
    // Run queries in parallel for better performance
    const [attendance, total] = await Promise.all([
      Attendance.find({ studentId: student._id })
        .sort({ date: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .lean(),
      Attendance.countDocuments({ studentId: student._id })
    ]);
    
    console.log(`📊 Found ${attendance.length} attendance records (total: ${total})`);
    if (attendance.length > 0) {
      attendance.forEach((rec, i) => {
        console.log(`  Record ${i}: studentId=${rec.studentId}, timeIn=${rec.timeIn}, timeOut=${rec.timeOut}`);
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Attendance records fetched successfully',
      data: attendance,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    console.error('❌ Error in getMyAttendance:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching attendance',
    });
  }
};

// Get all attendance records
export const getAllAttendance = async (req, res) => {
  try {
    const { studentId, date, status, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (studentId) filter.studentId = studentId;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      filter.date = { $gte: startDate, $lte: endDate };
    }
    if (status) filter.status = status;

    const parsedLimit = Math.min(parseInt(limit), 100); // Cap limit at 100
    const parsedPage = Math.max(parseInt(page), 1);
    const skip = (parsedPage - 1) * parsedLimit;
    
    // Run queries in parallel for better performance
    const [attendance, total] = await Promise.all([
      Attendance.find(filter)
        .populate('studentId', 'name email')
        .skip(skip)
        .limit(parsedLimit)
        .sort({ date: -1 })
        .lean(),  // Use lean() for faster read-only queries
      Attendance.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      message: 'Attendance records fetched successfully',
      data: attendance,
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
      message: error.message || 'Error fetching attendance',
    });
  }
};

// Get attendance by ID
export const getAttendanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const attendance = await Attendance.findById(id).populate('studentId', 'name email');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Attendance record fetched successfully',
      data: attendance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching attendance',
    });
  }
};

// Clock in
export const clockIn = async (req, res) => {
  try {
    const { studentId, studentName, timeIn } = req.body;
    
    console.log(`⏱️ Clock-in request received:`, { studentId, studentName, timeIn });

    if (!studentId || !studentName || !timeIn) {
      return res.status(400).json({
        success: false,
        message: 'studentId, studentName, and timeIn are required',
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already clocked in today
    const existingRecord = await Attendance.findOne({
      studentId,
      date: { $gte: today },
    });

    if (existingRecord) {
      console.log(`⚠️ Already clocked in today:`, existingRecord._id);
      return res.status(409).json({
        success: false,
        message: 'Student already clocked in today',
      });
    }

    const newAttendance = new Attendance({
      studentId,
      studentName,
      date: new Date(),
      timeIn,
      status: 'Present',
    });

    console.log(`💾 Saving attendance record with studentId: ${studentId}`);
    const savedAttendance = await newAttendance.save();
    console.log(`✅ Saved successfully, ID: ${savedAttendance._id}`);
    
    const populatedAttendance = await savedAttendance.populate('studentId', 'name email');
    console.log(`✅ Populated attendance:`, populatedAttendance);

    res.status(201).json({
      success: true,
      message: 'Clock in successful',
      data: populatedAttendance,
    });
  } catch (error) {
    console.error('❌ Error in clockIn:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Error clocking in',
    });
  }
};

// Clock out and calculate hours
export const clockOut = async (req, res) => {
  try {
    const { id } = req.params;
    const { timeOut } = req.body;

    if (!timeOut) {
      return res.status(400).json({
        success: false,
        message: 'timeOut is required',
      });
    }

    const attendance = await Attendance.findById(id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      });
    }

    if (attendance.timeOut) {
      return res.status(409).json({
        success: false,
        message: 'Student already clocked out',
      });
    }

    // Calculate hours - handle both ISO format and HH:MM AM/PM format
    const parseTimeToHour = (timeStr) => {
      // Check if ISO format (contains T)
      if (timeStr.includes('T')) {
        const date = new Date(timeStr);
        return date.getHours();
      }
      // Handle HH:MM AM/PM format
      const [time, period] = timeStr.split(' ');
      let [hour] = time.split(':').map(Number);
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      return hour;
    };

    const inHour = parseTimeToHour(attendance.timeIn);
    const outHour = parseTimeToHour(timeOut);

    let totalHours = outHour - inHour;
    if (totalHours < 0) totalHours += 24; // Handle overnight shifts

    attendance.timeOut = timeOut;
    attendance.totalHours = Math.max(totalHours, 0);

    const updatedAttendance = await attendance.save();
    const populatedAttendance = await updatedAttendance.populate('studentId', 'name email');

    res.status(200).json({
      success: true,
      message: 'Clock out successful',
      data: populatedAttendance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error clocking out',
    });
  }
};

// Delete attendance record (Supervisor/Admin only)
export const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const attendance = await Attendance.findById(id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      });
    }

    await Attendance.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Attendance record deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting attendance',
    });
  }
};

export default { getMyAttendance, getAllAttendance, getAttendanceById, clockIn, clockOut, deleteAttendance };
