import Report from '../models/Report.js';

// Get all reports
export const getAllReports = async (req, res) => {
  try {
    const { studentId, status, page = 1, limit = 10 } = req.query;
    const userRole = req.user?.role;
    const userId = req.user?.id || req.user?._id;
    
    const filter = {};
    
    // Student Assistants can only see their own reports
    if (userRole === 'Student Assistant') {
      filter.studentId = userId;
    } else if (studentId) {
      // Supervisors and Admins can filter by studentId
      filter.studentId = studentId;
    }
    
    if (status) filter.status = status;

    const parsedLimit = Math.min(parseInt(limit), 100); // Cap limit at 100
    const parsedPage = Math.max(parseInt(page), 1);
    const skip = (parsedPage - 1) * parsedLimit;
    
    // Run queries in parallel for better performance
    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate('studentId', 'name email')
        .populate('reviewedBy', 'name email')
        .skip(skip)
        .limit(parsedLimit)
        .sort({ submittedAt: -1 })
        .lean(),
      Report.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      message: 'Reports fetched successfully',
      data: reports,
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
      message: error.message || 'Error fetching reports',
    });
  }
};

// Get report by ID
export const getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await Report.findById(id)
      .populate('studentId', 'name email')
      .populate('reviewedBy', 'name email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Report fetched successfully',
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching report',
    });
  }
};

// Submit report
export const submitReport = async (req, res) => {
  try {
    const { studentId, studentName, title, content } = req.body;

    if (!studentId || !studentName || !title || !content) {
      return res.status(400).json({
        success: false,
        message: 'studentId, studentName, title, and content are required',
      });
    }

    const newReport = new Report({
      studentId,
      studentName,
      title,
      content,
      status: 'Pending',
      submittedAt: new Date(),
    });

    const savedReport = await newReport.save();
    const populatedReport = await savedReport.populate('studentId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: populatedReport,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error submitting report',
    });
  }
};

// Review report (Approve/Reject)
export const reviewReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, feedback } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be Approved or Rejected',
      });
    }

    const report = await Report.findByIdAndUpdate(
      id,
      {
        status,
        feedback: feedback || null,
        reviewedBy: req.user?.id || req.user?._id,
      },
      { new: true, runValidators: true }
    )
      .populate('studentId', 'name email')
      .populate('reviewedBy', 'name email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    res.status(200).json({
      success: true,
      message: `Report ${status.toLowerCase()} successfully`,
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error reviewing report',
    });
  }
};

export default { getAllReports, getReportById, submitReport, reviewReport };
