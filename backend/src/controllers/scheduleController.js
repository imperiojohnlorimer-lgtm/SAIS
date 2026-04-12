import Schedule from '../models/Schedule.js';
import User from '../models/User.js';

// Get schedules for a date range
export const getSchedules = async (req, res) => {
  try {
    const { startDate, endDate, studentId, userId: queryUserId } = req.query;
    const userId = req.user._id;
    const userRole = req.user.role;

    const filter = {};

    // Parse dates if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include entire end day
      filter.date = { $gte: start, $lte: end };
    }

    // Determine which schedule to view based on parameters and role
    if (studentId) {
      // Viewing student's schedule
      if (userRole === 'Supervisor' || userRole === 'Admin') {
        // Both Supervisor and Admin can view student schedules
        filter.studentId = studentId;
      } else {
        // Student Assistants cannot view student schedules
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view student schedules',
        });
      }
    } else if (queryUserId) {
      // Viewing someone else's personal schedule
      if (queryUserId === userId.toString()) {
        // Viewing own schedule
        filter.createdBy = userId;
      } else {
        // Viewing another user's schedule - check permissions
        const targetUser = await User.findById(queryUserId);
        if (!targetUser) {
          return res.status(404).json({
            success: false,
            message: 'User not found',
          });
        }

        const canViewOthersSchedule = 
          (userRole === 'Admin' && (targetUser.role === 'Supervisor' || targetUser.role === 'Student Assistant')) ||
          (userRole === 'Supervisor' && (targetUser.role === 'Admin' || targetUser.role === 'Student Assistant'));

        if (!canViewOthersSchedule) {
          return res.status(403).json({
            success: false,
            message: `You do not have permission to view ${targetUser.name}'s schedule`,
          });
        }

        filter.createdBy = queryUserId;
      }
    } else {
      // Default: show only user's own personal schedule
      filter.createdBy = userId;
    }

    const schedules = await Schedule.find(filter)
      .populate('createdBy', 'name email role')
      .populate('studentId', 'userId name')
      .sort({ date: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      message: 'Schedules retrieved successfully',
      data: schedules,
      count: schedules.length,
    });
  } catch (error) {
    console.error('Error getting schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving schedules',
      error: error.message,
    });
  }
};

// Get schedule by ID
export const getScheduleById = async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await Schedule.findById(id)
      .populate('createdBy', 'name email role')
      .populate('studentId', 'userId name');

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Schedule retrieved successfully',
      data: schedule,
    });
  } catch (error) {
    console.error('Error getting schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving schedule',
      error: error.message,
    });
  }
};

// Create new schedule
export const createSchedule = async (req, res) => {
  try {
    const { date, subject, startTime, endTime, studentId, description, createdByUserId } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Validate required fields
    if (!date || !subject || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide date, subject, startTime, and endTime',
      });
    }

    // Validate time format and logic
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({
        success: false,
        message: 'Time must be in HH:MM format (24-hour)',
      });
    }

    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: 'Start time must be before end time',
      });
    }

    // Determine who the schedule should be created for
    let scheduleCreatedBy = userId;

    // If creating for another user, validate permissions
    if (createdByUserId && createdByUserId !== userId.toString()) {
      const targetUser = await User.findById(createdByUserId);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: 'Target user not found',
        });
      }

      // Only Admin and Supervisor can create schedules for others
      const canCreateForOthers = 
        (userRole === 'Admin' && (targetUser.role === 'Supervisor' || targetUser.role === 'Student Assistant')) ||
        (userRole === 'Supervisor' && (targetUser.role === 'Admin' || targetUser.role === 'Student Assistant'));

      if (!canCreateForOthers) {
        return res.status(403).json({
          success: false,
          message: `You do not have permission to create schedules for ${targetUser.name}`,
        });
      }

      scheduleCreatedBy = createdByUserId;
    }

    const newSchedule = new Schedule({
      date: new Date(date),
      subject: subject.trim(),
      startTime,
      endTime,
      createdBy: scheduleCreatedBy,
      studentId: studentId || null,
      description: description?.trim() || '',
    });

    const savedSchedule = await newSchedule.save();
    const populatedSchedule = await savedSchedule.populate('createdBy', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Schedule created successfully',
      data: populatedSchedule,
    });
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating schedule',
      error: error.message,
    });
  }
};

// Update schedule
export const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, subject, startTime, endTime, studentId, description } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Find schedule
    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found',
      });
    }

    // Check permissions for update
    const isCreator = schedule.createdBy.toString() === userId.toString();
    
    if (!isCreator) {
      // If not creator, check role-based permissions
      const creatorUser = await User.findById(schedule.createdBy);
      
      const canUpdateOthersSchedule = 
        (userRole === 'Admin' && (creatorUser.role === 'Supervisor' || creatorUser.role === 'Student Assistant')) ||
        (userRole === 'Supervisor' && (creatorUser.role === 'Student Assistant' || schedule.studentId));

      if (!canUpdateOthersSchedule) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this schedule',
        });
      }
    }

    // Validate time if provided
    if (startTime || endTime) {
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      const start = startTime || schedule.startTime;
      const end = endTime || schedule.endTime;

      if (!timeRegex.test(start) || !timeRegex.test(end)) {
        return res.status(400).json({
          success: false,
          message: 'Time must be in HH:MM format (24-hour)',
        });
      }

      if (start >= end) {
        return res.status(400).json({
          success: false,
          message: 'Start time must be before end time',
        });
      }
    }

    // Update fields
    if (date) schedule.date = new Date(date);
    if (subject) schedule.subject = subject.trim();
    if (startTime) schedule.startTime = startTime;
    if (endTime) schedule.endTime = endTime;
    if (studentId !== undefined) schedule.studentId = studentId || null;
    if (description !== undefined) schedule.description = description?.trim() || '';

    const updatedSchedule = await schedule.save();
    const populatedSchedule = await updatedSchedule.populate('createdBy', 'name email role');

    res.status(200).json({
      success: true,
      message: 'Schedule updated successfully',
      data: populatedSchedule,
    });
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating schedule',
      error: error.message,
    });
  }
};

// Delete schedule
export const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found',
      });
    }

    // Check permissions for deletion
    const isCreator = schedule.createdBy.toString() === userId.toString();
    
    if (!isCreator) {
      // If not creator, check role-based permissions
      const creatorUser = await User.findById(schedule.createdBy);
      
      const canDeleteOthersSchedule = 
        (userRole === 'Admin' && (creatorUser.role === 'Supervisor' || creatorUser.role === 'Student Assistant')) ||
        (userRole === 'Supervisor' && (creatorUser.role === 'Student Assistant' || schedule.studentId));

      if (!canDeleteOthersSchedule) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this schedule',
        });
      }
    }

    await Schedule.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Schedule deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting schedule',
      error: error.message,
    });
  }
};
