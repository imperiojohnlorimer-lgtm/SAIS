import Department from '../models/Department.js';

// Get all departments
export const getAllDepartments = async (req, res) => {
  try {
    const startTime = Date.now();
    console.log('📋 getAllDepartments called');
    const { isActive, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const parsedLimit = Math.min(parseInt(limit), 100);
    const parsedPage = Math.max(parseInt(page), 1);
    const skip = (parsedPage - 1) * parsedLimit;

    console.log(`🔍 Query filter:`, filter, `skip: ${skip}, limit: ${parsedLimit}`);

    const [departments, total] = await Promise.all([
      Department.find(filter)
        .skip(skip)
        .limit(parsedLimit)
        .populate('head', 'name email role')
        .lean(),
      Department.countDocuments(filter),
    ]);

    console.log(`✅ Found ${departments.length} departments in ${Date.now() - startTime}ms (total: ${total})`);

    res.status(200).json({
      success: true,
      message: 'Departments fetched successfully',
      data: departments,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    console.error('❌ Error in getAllDepartments:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching departments',
    });
  }
};

// Get department by ID
export const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const department = await Department.findById(id).populate('head', 'name email role');

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Department fetched successfully',
      data: department,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching department',
    });
  }
};

// Create new department
export const createDepartment = async (req, res) => {
  try {
    const { name, code, description, location, head } = req.body;

    console.log('📝 Creating new department:', { name, code });

    // Check if department already exists
    const existingDept = await Department.findOne({ $or: [{ name }, { code }] });
    if (existingDept) {
      return res.status(400).json({
        success: false,
        message: 'Department with this name or code already exists',
      });
    }

    const department = new Department({
      name,
      code: code.toUpperCase(),
      description,
      location,
      head: head || null,
    });

    await department.save();
    await department.populate('head', 'name email role');

    console.log('✅ Department created successfully:', department._id);

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department,
    });
  } catch (error) {
    console.error('❌ Error creating department:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating department',
    });
  }
};

// Update department
export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, location, head, isActive } = req.body;

    console.log('🔄 Updating department:', id);

    // Check if new name/code is unique (if being changed)
    const existingDept = await Department.findOne({
      $and: [
        { _id: { $ne: id } },
        { $or: [{ name }, { code }] },
      ],
    });

    if (existingDept) {
      return res.status(400).json({
        success: false,
        message: 'Department name or code already exists',
      });
    }

    const department = await Department.findByIdAndUpdate(
      id,
      {
        name,
        code: code ? code.toUpperCase() : undefined,
        description,
        location,
        head: head || null,
        isActive,
      },
      { new: true, runValidators: true }
    ).populate('head', 'name email role');

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    console.log('✅ Department updated successfully');

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: department,
    });
  } catch (error) {
    console.error('❌ Error updating department:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating department',
    });
  }
};

// Delete department
export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Deleting department:', id);

    const department = await Department.findByIdAndDelete(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    console.log('✅ Department deleted successfully');

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully',
      data: department,
    });
  } catch (error) {
    console.error('❌ Error deleting department:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting department',
    });
  }
};
