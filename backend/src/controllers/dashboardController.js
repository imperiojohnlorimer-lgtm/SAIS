import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';
import Report from '../models/Report.js';
import User from '../models/User.js';

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const startTime = Date.now();

    // Get total students (with Student Assistant role)
    const totalStudents = await Student.countDocuments();

    // Get active students today (students with attendance records today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activeToday = await Attendance.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });

    // Get pending reports (reports with status 'Pending')
    const pendingReports = await Report.countDocuments({ status: 'Pending' });

    // Get recent attendance records (last 5)
    const recentAttendance = await Attendance.find()
      .populate('studentId', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Calculate average hours per week (from completed attendance records with timeOut)
    const attendanceRecords = await Attendance.find({ timeOut: { $exists: true, $ne: null } });
    let totalHours = 0;
    attendanceRecords.forEach(record => {
      if (record.timeIn && record.timeOut) {
        const inTime = new Date(record.timeIn);
        const outTime = new Date(record.timeOut);
        const hours = (outTime - inTime) / (1000 * 60 * 60);
        totalHours += hours;
      }
    });
    const averageHoursPerWeek = attendanceRecords.length > 0 ? (totalHours / Math.ceil(attendanceRecords.length / 7)).toFixed(1) : 0;

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
        recentAttendance: recentAttendance.map(record => ({
          id: record._id,
          studentName: record.studentId?.name || 'Unknown',
          studentId: record.studentId?._id,
          date: record.createdAt ? new Date(record.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          }) : '',
          timeIn: record.timeIn ? new Date(record.timeIn).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          }) : '--:--',
          timeOut: record.timeOut ? new Date(record.timeOut).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          }) : '--:--',
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
