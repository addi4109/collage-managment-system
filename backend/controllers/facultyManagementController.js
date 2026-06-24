import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Faculty from '../models/Faculty.js';
import { clearUserCache } from '../middleware/authMiddleware.js';

export const createFaculty = async (req, res) => {
  const { name, username, password, email, phone, department, assignedSubjects, assignedSemesters, employeeId } = req.body;

  if (!name || !username || !password || !department) {
    return res.status(400).json({ message: 'Name, username, password, and department are required.' });
  }

  try {
    const existingUsername = await User.findOne({ username: username.toLowerCase().trim() });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username is already taken.' });
    }

    if (email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email is already in use.' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const sems = assignedSemesters || [];
    let calculatedYear = '';
    if (sems.includes('Sem 1') || sems.includes('Sem 2')) calculatedYear = 'First Year';
    else if (sems.includes('Sem 3') || sems.includes('Sem 4')) calculatedYear = 'Second Year';
    else if (sems.includes('Sem 5') || sems.includes('Sem 6')) calculatedYear = 'Third Year';

    const empId = employeeId || 'FAC' + Math.floor(1000 + Math.random() * 9000);

    const newUser = new User({
      name,
      username: username.toLowerCase().trim(),
      email: email ? email.toLowerCase().trim() : undefined,
      passwordHash,
      role: 'faculty',
      status: 'active', // default status active
      department,
      assignedSemesters: sems,
      assignedYear: calculatedYear,
      assignedSubjects: assignedSubjects || [],
      employeeId: empId,
      phone: phone || '',
    });

    const savedUser = await newUser.save();

    const newFacultyProfile = new Faculty({
      user: savedUser._id,
      employeeId: empId,
      department,
      assignedSemesters: sems,
      assignedSubjects: assignedSubjects || [],
    });
    await newFacultyProfile.save();

    res.status(201).json({
      success: true,
      message: 'Faculty account created successfully.',
      user: {
        _id: savedUser._id.toString(),
        uid: savedUser._id.toString(),
        name: savedUser.name,
        username: savedUser.username,
        email: savedUser.email,
        role: savedUser.role,
        status: savedUser.status,
        department: savedUser.department,
        assignedSemesters: savedUser.assignedSemesters,
        assignedSubjects: savedUser.assignedSubjects,
        employeeId: savedUser.employeeId,
        phone: savedUser.phone,
        createdAt: savedUser.createdAt,
      },
    });
  } catch (error) {
    console.error('Create faculty error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const getFacultyList = async (req, res) => {
  try {
    const list = await User.find({ role: 'faculty' }).select('-passwordHash').sort({ createdAt: -1 });
    res.json(list);
  } catch (error) {
    console.error('Get faculty list error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const getFacultyDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ _id: id, role: 'faculty' }).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'Faculty user not found.' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get faculty details error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const updateFaculty = async (req, res) => {
  const { id } = req.params;
  const { name, username, email, department, assignedSemesters, assignedSubjects, employeeId, phone } = req.body;

  try {
    const user = await User.findOne({ _id: id, role: 'faculty' });
    if (!user) {
      return res.status(404).json({ message: 'Faculty account not found.' });
    }

    if (username && username.toLowerCase().trim() !== user.username) {
      const existing = await User.findOne({ username: username.toLowerCase().trim() });
      if (existing) {
        return res.status(400).json({ message: 'Username is already taken.' });
      }
      user.username = username.toLowerCase().trim();
    }

    if (email && email.toLowerCase().trim() !== user.email) {
      const existing = await User.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        return res.status(400).json({ message: 'Email is already in use.' });
      }
      user.email = email.toLowerCase().trim();
    }

    if (name) user.name = name;
    if (department) user.department = department;
    if (assignedSemesters !== undefined) {
      user.assignedSemesters = assignedSemesters;
      let calculatedYear = '';
      if (assignedSemesters.includes('Sem 1') || assignedSemesters.includes('Sem 2')) calculatedYear = 'First Year';
      else if (assignedSemesters.includes('Sem 3') || assignedSemesters.includes('Sem 4')) calculatedYear = 'Second Year';
      else if (assignedSemesters.includes('Sem 5') || assignedSemesters.includes('Sem 6')) calculatedYear = 'Third Year';
      user.assignedYear = calculatedYear;
    }
    if (assignedSubjects) user.assignedSubjects = assignedSubjects;
    if (employeeId) user.employeeId = employeeId;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    // Sync profile
    const profile = await Faculty.findOne({ user: user._id });
    if (profile) {
      if (department) profile.department = department;
      if (assignedSemesters) profile.assignedSemesters = assignedSemesters;
      if (assignedSubjects) profile.assignedSubjects = assignedSubjects;
      if (employeeId) profile.employeeId = employeeId;
      await profile.save();
    }

    clearUserCache(user._id);

    res.json({
      success: true,
      message: 'Faculty account updated successfully.',
      user,
    });
  } catch (error) {
    console.error('Update faculty error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const resetPassword = async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: 'New password is required.' });
  }

  try {
    const user = await User.findOne({ _id: id, role: 'faculty' });
    if (!user) {
      return res.status(404).json({ message: 'Faculty account not found.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(password, salt);
    await user.save();

    clearUserCache(user._id);

    res.json({ success: true, message: 'Faculty password reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const updateFacultyStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['active', 'suspended', 'inactive'].includes(status)) {
    return res.status(400).json({ message: 'Status must be active, suspended, or inactive.' });
  }

  try {
    const user = await User.findOne({ _id: id, role: 'faculty' });
    if (!user) {
      return res.status(404).json({ message: 'Faculty account not found.' });
    }

    user.status = status;
    await user.save();

    clearUserCache(user._id);

    res.json({ success: true, message: `Faculty status updated to ${status}.`, user });
  } catch (error) {
    console.error('Update faculty status error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const deleteFaculty = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findOne({ _id: id, role: 'faculty' });
    if (!user) {
      return res.status(404).json({ message: 'Faculty account not found.' });
    }

    await User.deleteOne({ _id: id });
    await Faculty.deleteOne({ user: id });

    clearUserCache(id);

    res.json({ success: true, message: 'Faculty account deleted successfully.' });
  } catch (error) {
    console.error('Delete faculty error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
