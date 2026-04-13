import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';
import Report from '../models/Report.js';
import User from '../models/User.js';

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const startTime = Date.now();

    // Get total students - only count students with valid linked User accounts
    const allStudents = await Student.find().populate({
      path: "userId",
      select: "_id role",
      match: { role: "Student Assistant" }
    }).lean();
    const totalStudents = allStudents.filter(s => s.userId !== null).length;

    // Get active students today (students with attendance records today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activeTodayRecords = await Attendance.find({
      createdAt: { $gte: today, $lt: tomorrow }
    }).populate('studentId', '_id').lean();
    const activeToday = activeTodayRecords.filter(r => r.studentId !== null).length;

    // Get pending reports (reports with status 'Pending')
    const pendingReports = await Report.countDocuments({ status: 'Pending' });

    // Get recent attendance records (last 5), only those with a valid student
    const recentAttendance = await Attendance.find()
      .populate('studentId', 'name')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // Filter out records where the student has been deleted (studentId is null after populate)
    const validRecentAttendance = recentAttendance
      .filter(record => record.studentId !== null)
      .slice(0, 5);

    // Calculate average hours per week (from completed attendance records with timeOut, valid students only)
    const attendanceRecords = await Attendance.find({ timeOut: { $exists: true, $ne: null } })
      .populate('studentId', '_id').lean();
    const validAttendanceRecords = attendanceRecords.filter(r => r.studentId !== null);
    let totalHours = 0;
    validAttendanceRecords.forEach(record => {
      if (record.timeIn && record.timeOut) {
        const inTime = new Date(record.timeIn);
        const outTime = new Date(record.timeOut);
        const hours = (outTime - inTime) / (1000 * 60 * 60);
        totalHours += hours;
      }
    });
    const averageHoursPerWeek = validAttendanceRecords.length > 0 ? (totalHours / Math.ceil(validAttendanceRecords.length / 7)).toFixed(1) : 0;

    // Get user counts by role
    const adminCount = await User.countDocuments({ role: 'Admin' });
    const supervisorCount = await User.countDocuments({ role: 'Supervisor' });
    const studentCount = await User.countDocuments({ role: 'Student Assistant' });

    const responseTime = Date.now() - startTime;

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      responseTime,
      data: {
        stats: {
          totalStudents,
          activeToday,
          pendingReports,
          averageHoursPerWeek,
        },
        recentAttendance: validRecentAttendance.map(record => ({
          id: record._id,
          studentName: record.studentId?.name || 'Unknown',
          studentId: record.studentId?._id,
          date: record.createdAt ? new Date(record.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          }) : '',
          timeIn: record.timeIn || '--:--',
          timeOut: record.timeOut || '--:--',
        })),
        userCounts: {
          admins: adminCount,
          supervisors: supervisorCount,
          students: studentCount,
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching dashboard statistics',
    });
  }
};
