import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Faculty from '../models/Faculty.js';
import { logActivity } from './auditService.js';

export const createFaculty = async (facultyData, adminId, ipAddress) => {
  const { name, username, password, assignedDepartments, assignedYears, assignedSubjects } = facultyData;

  const existingUser = await User.findOne({ 
    username: username.toLowerCase(),
    isDeleted: false 
  });
  if (existingUser) {
    throw new Error('Username already exists.');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Auto-generate email and employeeId if not provided
  const email = facultyData.email || `${username.toLowerCase()}@college.edu`;
  const employeeId = facultyData.employeeId || `EMP-${Date.now()}`;

  // 1. Create User
  const newUser = new User({
    name,
    email: email.toLowerCase(),
    username: username.toLowerCase(),
    passwordHash,
    role: 'faculty',
    status: 'active',
  });
  const savedUser = await newUser.save();

  // 2. Create Faculty Profile
  const newFaculty = new Faculty({
    userId: savedUser._id,
    employeeId,
    assignedDepartments,
    assignedYears,
    assignedSubjects,
  });
  await newFaculty.save();

  // 3. Log Activity
  await logActivity({
    action: 'FACULTY_CREATED',
    performedBy: adminId,
    targetId: savedUser._id,
    details: `Created faculty member: ${name} (${username})`,
    ipAddress,
  });

  return savedUser;
};

export const getFaculties = async (filters = {}) => {
  const query = { isDeleted: false };

  if (filters.departmentId) {
    query.assignedDepartments = filters.departmentId;
  }
  if (filters.year) {
    query.assignedYears = filters.year;
  }
  if (filters.search) {
    const searchRegex = new RegExp(filters.search, 'i');
    const matchingUsers = await User.find({
      name: searchRegex,
      role: 'faculty',
      isDeleted: false,
    }).select('_id');
    const userIds = matchingUsers.map(u => u._id);

    query.$or = [
      { userId: { $in: userIds } },
      { employeeId: searchRegex },
    ];
  }

  const profiles = await Faculty.find(query)
    .populate('userId', 'name email username status')
    .populate('assignedDepartments', 'name code')
    .populate('assignedSubjects', 'name code type')
    .sort({ employeeId: 1 });

  return profiles.filter(p => p.userId !== null);
};

export const updateFaculty = async (facultyId, facultyData, adminId, ipAddress) => {
  const faculty = await Faculty.findOne({ _id: facultyId, isDeleted: false });
  if (!faculty) {
    throw new Error('Faculty profile not found.');
  }

  const { name, assignedDepartments, assignedYears, assignedSubjects } = facultyData;

  // Update User account
  const user = await User.findById(faculty.userId);
  if (user) {
    if (name) user.name = name;
    if (facultyData.email) user.email = facultyData.email.toLowerCase();
    await user.save();
  }

  // Update Profile
  if (facultyData.employeeId) faculty.employeeId = facultyData.employeeId;
  if (assignedDepartments) faculty.assignedDepartments = assignedDepartments;
  if (assignedYears) faculty.assignedYears = assignedYears;
  if (assignedSubjects) faculty.assignedSubjects = assignedSubjects;
  if (facultyData.phone !== undefined) faculty.phone = facultyData.phone;

  await faculty.save();

  await logActivity({
    action: 'FACULTY_UPDATED',
    performedBy: adminId,
    targetId: faculty.userId,
    details: `Updated faculty profile: ${name || user?.name}`,
    ipAddress,
  });

  return faculty;
};

export const deleteFaculty = async (facultyId, adminId, ipAddress) => {
  const faculty = await Faculty.findOne({ _id: facultyId, isDeleted: false });
  if (!faculty) {
    throw new Error('Faculty profile not found.');
  }

  // Soft delete Faculty
  faculty.isDeleted = true;
  faculty.deletedAt = new Date();
  await faculty.save();

  // Soft delete User
  const user = await User.findById(faculty.userId);
  if (user) {
    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save();
  }

  await logActivity({
    action: 'FACULTY_DELETED',
    performedBy: adminId,
    targetId: faculty.userId,
    details: `Soft deleted faculty profile & user: (${faculty.employeeId})`,
    ipAddress,
  });

  return { success: true };
};

export const resetFacultyPassword = async (facultyId, newPassword, adminId, ipAddress) => {
  const faculty = await Faculty.findOne({ _id: facultyId, isDeleted: false });
  if (!faculty) {
    throw new Error('Faculty profile not found.');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  const user = await User.findById(faculty.userId);
  if (!user) {
    throw new Error('Associated faculty user not found.');
  }

  user.passwordHash = passwordHash;
  await user.save();

  await logActivity({
    action: 'FACULTY_PASSWORD_RESET',
    performedBy: adminId,
    targetId: faculty.userId,
    details: `Reset password for faculty: ${user.name} (${faculty.employeeId})`,
    ipAddress,
  });

  return { success: true };
};
