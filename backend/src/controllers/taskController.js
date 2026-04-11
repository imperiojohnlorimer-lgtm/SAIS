import Task from '../models/Task.js';
import Student from '../models/Student.js';
import User from '../models/User.js';

// Get all tasks
export const getAllTasks = async (req, res) => {
  try {
    const { assignedTo, status, priority, page = 1, limit = 10 } = req.query;
    const userId = req.user._id;
    const userRole = req.user.role;
    const userDepartment = req.user.department;
    
    const parsedLimit = Math.min(parseInt(limit), 100); // Cap limit at 100
    const parsedPage = Math.max(parseInt(page), 1);
    const skip = (parsedPage - 1) * parsedLimit;
    
    const filter = {};
    if (assignedTo) filter.assignedTo = assignedTo;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    console.log(`Getting tasks for user: ${userId}, role: ${userRole}, department: ${userDepartment}`);

    // Filter tasks based on user role
    if (userRole === 'Student Assistant') {
      // Student Assistants only see tasks assigned to them
      const student = await Student.findOne({ userId });
      console.log(`Found student for userId ${userId}:`, student);
      
      if (student) {
        filter.assignedTo = student._id;
      } else {
        // No student record found - return empty list
        return res.status(200).json({
          success: true,
          message: 'No tasks found - student record not found',
          data: [],
          pagination: {
            total: 0,
            page: parsedPage,
            limit: parsedLimit,
            pages: 0,
          },
        });
      }
    } else if (userRole === 'Supervisor') {
      // Supervisors see tasks for students in their department OR tasks they assigned
      // Use aggregation pipeline for better performance on larger datasets
      const tasks = await Task.aggregate([
        {
          $lookup: {
            from: 'students',
            localField: 'assignedTo',
            foreignField: '_id',
            as: 'studentData'
          }
        },
        {
          $match: {
            $or: [
              { assignedBy: userId }, // Tasks the supervisor assigned
              { 'studentData.department': userDepartment } // Tasks for students in their dept
            ]
          }
        },
        { $sort: { dueDate: 1 } },
        { $skip: skip },
        { $limit: parsedLimit }
      ]);

      // Get total count using aggregation
      const countResult = await Task.aggregate([
        {
          $lookup: {
            from: 'students',
            localField: 'assignedTo',
            foreignField: '_id',
            as: 'studentData'
          }
        },
        {
          $match: {
            $or: [
              { assignedBy: userId },
              { 'studentData.department': userDepartment }
            ]
          }
        },
        {
          $count: 'total'
        }
      ]);

      const total = countResult.length > 0 ? countResult[0].total : 0;

      return res.status(200).json({
        success: true,
        message: 'Tasks fetched successfully',
        data: tasks,
        pagination: {
          total,
          page: parsedPage,
          limit: parsedLimit,
          pages: Math.ceil(total / parsedLimit),
        },
      });
    }
    // Admins see all tasks (no additional filter)

    console.log('Task filter:', filter);

    // Run queries in parallel for better performance
    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('assignedTo', 'name email userId')
        .populate('assignedBy', 'name email')
        .skip(skip)
        .limit(parsedLimit)
        .sort({ dueDate: 1 })
        .lean(),
      Task.countDocuments(filter)
    ]);

    console.log(`Found ${tasks.length} tasks`);

    res.status(200).json({
      success: true,
      message: 'Tasks fetched successfully',
      data: tasks,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching tasks',
    });
  }
};

// Get task by ID
export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id)
      .populate('assignedTo', 'name email userId')
      .populate('assignedBy', 'name email');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task fetched successfully',
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching task',
    });
  }
};

// Create task
export const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, assignedBy, dueDate, priority, status } = req.body;

    console.log('=== CREATE TASK REQUEST ===');
    console.log('Body:', { title, description, assignedTo, assignedBy, dueDate, priority, status });

    if (!title || !description || !assignedTo || !assignedBy || !dueDate) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'title, description, assignedTo, assignedBy, and dueDate are required',
      });
    }

    console.log('✅ All required fields present');

    const newTask = new Task({
      title,
      description,
      assignedTo,
      assignedBy,
      dueDate,
      priority: priority || 'Medium',
      status: status || 'Not Started',
    });

    console.log('Saving task to database...');
    const savedTask = await newTask.save();
    console.log('✅ Task saved with ID:', savedTask._id);
    
    // Fetch and populate the saved task
    console.log('Populating task...');
    const populatedTask = await Task.findById(savedTask._id)
      .populate('assignedTo', 'name email userId')
      .populate('assignedBy', 'name email');

    console.log('✅ Task populated successfully');
    console.log('Task data:', populatedTask);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: populatedTask,
    });
  } catch (error) {
    console.error('❌ ERROR CREATING TASK:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating task',
      error: error.message,
    });
  }
};

// Update task
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;
    const { title, description, status, priority, dueDate, completedAt } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Check permissions based on role
    if (userRole === 'Student Assistant') {
      // Student Assistants can only update status
      // Verify the task is assigned to them
      const student = await Student.findOne({ userId });
      if (!student || task.assignedTo.toString() !== student._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only update tasks assigned to you',
        });
      }
      
      // Only allow status updates
      task.status = status || task.status;
      if (status === 'Completed') {
        task.completedAt = completedAt || new Date();
      }
    } else if (userRole === 'Supervisor' || userRole === 'Admin') {
      // Supervisors and Admins can update all fields
      if (title) task.title = title;
      if (description) task.description = description;
      if (status) task.status = status;
      if (priority) task.priority = priority;
      if (dueDate) task.dueDate = dueDate;
      if (status === 'Completed') {
        task.completedAt = completedAt || new Date();
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update tasks',
      });
    }

    const updatedTask = await task.save();
    
    // Fetch and populate the updated task
    const populatedTask = await Task.findById(updatedTask._id)
      .populate('assignedTo', 'name email userId')
      .populate('assignedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: populatedTask,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating task',
    });
  }
};

// Delete task
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const task = await Task.findById(id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Check permissions
    if (userRole === 'Supervisor') {
      // Supervisors can only delete tasks they created
      if (task.assignedBy.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete tasks you created',
        });
      }
    }
    // Admins can delete any task (no additional check needed)

    await Task.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting task',
    });
  }
};

export default { getAllTasks, getTaskById, createTask, updateTask, deleteTask };
