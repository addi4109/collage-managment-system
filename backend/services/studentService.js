import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Subject from '../models/Subject.js';
import StudentSubject from '../models/StudentSubject.js';
import { logActivity } from './auditService.js';

export const createStudent = async (studentData, creatorId, ipAddress) => {
  const { name, username, password, rollNumber, enrollmentNumber, departmentId, year, semester, email, phone, parentName, parentMobile, address } = studentData;

  // Verify unique
  const existingStudent = await Student.findOne({ enrollmentNumber, isDeleted: false });
  if (existingStudent) {
    throw new Error('Student with this enrollment number already exists.');
  }

  const existingUser = await User.findOne({ 
    $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
    isDeleted: false 
  });
  if (existingUser) {
    throw new Error('Username or email already exists.');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // 1. Create User
  const newUser = new User({
    name,
    email: email.toLowerCase(),
    username: username.toLowerCase(),
    passwordHash,
    role: 'student',
    status: 'active',
  });
  const savedUser = await newUser.save();

  // 2. Create Student Profile
  const newStudent = new Student({
    userId: savedUser._id,
    rollNumber,
    enrollmentNumber,
    departmentId,
    year,
    semester,
    phone,
    parentName,
    parentMobile,
    address,
  });
  await newStudent.save();

  // 3. Auto-enroll into subjects
  const subjects = await Subject.find({
    departmentId,
    year,
    semester,
    isDeleted: false,
  });

  const academicYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
  for (const subject of subjects) {
    const enrollment = new StudentSubject({
      studentId: savedUser._id,
      subjectId: subject._id,
      academicYear,
    });
    await enrollment.save().catch(() => {});
  }

  // 4. Log
  await logActivity({
    action: 'STUDENT_CREATED',
    performedBy: creatorId,
    targetId: savedUser._id,
    details: `Created student account: ${name} (${enrollmentNumber})`,
    ipAddress,
  });

  return savedUser;
};

export const getStudents = async (filters = {}, requestUser) => {
  const query = { isDeleted: false };

  // Apply Faculty scopes if not Admin
  if (requestUser.role === 'faculty') {
    query.departmentId = { $in: requestUser.assignedDepartments };
    query.year = { $in: requestUser.assignedYears };
  }

  // Dynamic search filters
  if (filters.departmentId) query.departmentId = filters.departmentId;
  if (filters.year) query.year = filters.year;
  if (filters.semester) query.semester = filters.semester;

  // Roll / Enrollment search
  if (filters.search) {
    const searchRegex = new RegExp(filters.search, 'i');
    const matchingUsers = await User.find({
      name: searchRegex,
      role: 'student',
      isDeleted: false,
    }).select('_id');
    const userIds = matchingUsers.map(u => u._id);

    query.$or = [
      { userId: { $in: userIds } },
      { rollNumber: searchRegex },
      { enrollmentNumber: searchRegex },
    ];
  }

  const profiles = await Student.find(query)
    .populate('userId', 'name email username status')
    .populate('departmentId', 'name code')
    .sort({ rollNumber: 1 });

  return profiles.filter(p => p.userId !== null); // Ensure user isn't null due to inconsistency
};

export const updateStudent = async (studentId, studentData, requestUser, ipAddress) => {
  const student = await Student.findOne({ _id: studentId, isDeleted: false });
  if (!student) {
    throw new Error('Student profile not found.');
  }

  // Verification of Faculty scope
  if (requestUser.role === 'faculty') {
    if (!requestUser.assignedDepartments.includes(student.departmentId.toString()) ||
        !requestUser.assignedYears.includes(student.year)) {
      throw new Error('Forbidden: Student is outside your assigned department/year scope.');
    }
  }

  const {
    name,
    rollNumber,
    enrollmentNumber,
    departmentId,
    email,
    phone,
    parentName,
    parentMobile,
    address,
    semester,
    year
  } = studentData;

  // Update User Account
  const user = await User.findById(student.userId);
  if (user) {
    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    await user.save();
  }

  // Update Profile
  if (rollNumber) student.rollNumber = rollNumber;
  if (enrollmentNumber) student.enrollmentNumber = enrollmentNumber;
  if (departmentId) student.departmentId = departmentId;
  if (phone !== undefined) student.phone = phone;
  if (parentName !== undefined) student.parentName = parentName;
  if (parentMobile !== undefined) student.parentMobile = parentMobile;
  if (address !== undefined) student.address = address;

  // Handle Semester, Year, or Department changes
  const semChanged = semester && student.semester !== semester;
  const yearChanged = year && student.year !== year;
  const deptChanged = departmentId && student.departmentId.toString() !== departmentId.toString();

  if (semester) student.semester = semester;
  if (year) student.year = year;
  if (departmentId) student.departmentId = departmentId;

  await student.save();

  // If year/semester/department changes, re-enroll student in matching subjects
  if (semChanged || yearChanged || deptChanged) {
    const subjects = await Subject.find({
      departmentId: student.departmentId,
      year: student.year,
      semester: student.semester,
      isDeleted: false,
    });

    const academicYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
    for (const subject of subjects) {
      const enrollment = new StudentSubject({
        studentId: student.userId,
        subjectId: subject._id,
        academicYear,
      });
      await enrollment.save().catch(() => {});
    }
  }

  await logActivity({
    action: 'STUDENT_UPDATED',
    performedBy: requestUser.id,
    targetId: student.userId,
    details: `Updated student profile: ${name || user?.name} (${student.enrollmentNumber})`,
    ipAddress,
  });

  return student;
};

export const deleteStudent = async (studentId, requestUser, ipAddress) => {
  const student = await Student.findOne({ _id: studentId, isDeleted: false });
  if (!student) {
    throw new Error('Student profile not found.');
  }

  if (requestUser.role === 'faculty') {
    if (!requestUser.assignedDepartments.includes(student.departmentId.toString()) ||
        !requestUser.assignedYears.includes(student.year)) {
      throw new Error('Forbidden: Student is outside your assigned department/year scope.');
    }
  }

  // Soft delete Student
  student.isDeleted = true;
  student.deletedAt = new Date();
  await student.save();

  // Soft delete User
  const user = await User.findById(student.userId);
  if (user) {
    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save();
  }

  await logActivity({
    action: 'STUDENT_DELETED',
    performedBy: requestUser.id,
    targetId: student.userId,
    details: `Soft deleted student profile & user: (${student.enrollmentNumber})`,
    ipAddress,
  });

  return { success: true };
};

export const resetPassword = async (studentId, newPassword, requestUser, ipAddress) => {
  const student = await Student.findOne({ _id: studentId, isDeleted: false });
  if (!student) {
    throw new Error('Student profile not found.');
  }

  if (requestUser.role === 'faculty') {
    if (!requestUser.assignedDepartments.includes(student.departmentId.toString()) ||
        !requestUser.assignedYears.includes(student.year)) {
      throw new Error('Forbidden: Student is outside your assigned department/year scope.');
    }
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  const user = await User.findById(student.userId);
  if (!user) {
    throw new Error('Associated student user not found.');
  }

  user.passwordHash = passwordHash;
  await user.save();

  await logActivity({
    action: 'STUDENT_PASSWORD_RESET',
    performedBy: requestUser.id,
    targetId: student.userId,
    details: `Reset password for student: ${user.name} (${student.enrollmentNumber})`,
    ipAddress,
  });

  return { success: true };
};
