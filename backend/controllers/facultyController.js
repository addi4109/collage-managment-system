import User from '../models/User.js';
import Faculty from '../models/Faculty.js';
import Student from '../models/Student.js';
import { clearUserCache } from '../middleware/authMiddleware.js';
import { clearProfileCache } from './authController.js';

// Faculty endpoints
export const getFacultyDepartments = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('departments activeDepartment');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({
      departments: user.departments || [],
      activeDepartment: user.activeDepartment || '',
    });
  } catch (error) {
    console.error('Get faculty departments error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const updateActiveDepartment = async (req, res) => {
  const { department } = req.body;

  if (!department) {
    return res.status(400).json({ message: 'Department is required.' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Faculty user not found.' });
    }

    if (!user.departments.includes(department)) {
      return res.status(400).json({ message: 'Selected department is not assigned to you.' });
    }

    user.activeDepartment = department;
    await user.save();

    // Sync to profile if exist
    const facultyProfile = await Faculty.findOne({ user: user._id });
    if (facultyProfile) {
      facultyProfile.activeDepartment = department;
      facultyProfile.department = department; // keep profile aligned
      await facultyProfile.save();
    }

    // Invalidate caches
    clearUserCache(user._id);
    clearProfileCache(user._id);

    res.json({
      success: true,
      message: 'Active department updated successfully.',
      activeDepartment: department,
    });
  } catch (error) {
    console.error('Update active department error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Admin endpoints
export const updateStudentDepartment = async (req, res) => {
  const { id } = req.params;
  const { department } = req.body;

  if (!department) {
    return res.status(400).json({ message: 'Department is required.' });
  }

  try {
    const user = await User.findById(id);
    if (!user || user.role !== 'student') {
      return res.status(404).json({ message: 'Student account not found.' });
    }

    user.department = department;
    await user.save();

    const studentProfile = await Student.findOne({ user: user._id });
    if (studentProfile) {
      studentProfile.department = department;
      await studentProfile.save();
    }

    clearUserCache(user._id);
    clearProfileCache(user._id);

    res.json({
      success: true,
      message: "Student's department updated successfully.",
      department,
    });
  } catch (error) {
    console.error('Update student department error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const updateFacultyDepartments = async (req, res) => {
  const { id } = req.params;
  const { departments } = req.body;

  if (!departments || !Array.isArray(departments) || departments.length === 0) {
    return res.status(400).json({ message: 'Departments list array is required.' });
  }

  try {
    const user = await User.findById(id);
    if (!user || user.role !== 'faculty') {
      return res.status(404).json({ message: 'Faculty account not found.' });
    }

    user.departments = departments;
    // Update active department if previous active department is no longer in the list
    if (!departments.includes(user.activeDepartment)) {
      user.activeDepartment = departments[0];
    }
    await user.save();

    const facultyProfile = await Faculty.findOne({ user: user._id });
    if (facultyProfile) {
      facultyProfile.departments = departments;
      if (!departments.includes(facultyProfile.activeDepartment)) {
        facultyProfile.activeDepartment = departments[0];
        facultyProfile.department = departments[0];
      }
      await facultyProfile.save();
    }

    clearUserCache(user._id);
    clearProfileCache(user._id);

    res.json({
      success: true,
      message: 'Faculty assigned departments updated successfully.',
      departments,
      activeDepartment: user.activeDepartment,
    });
  } catch (error) {
    console.error('Update faculty departments error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
