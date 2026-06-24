import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Student from '../models/Student.js';
import { clearUserCache } from '../middleware/authMiddleware.js';
import { clearProfileCache } from './authController.js';

// ──────────────────────────────────────────────────────────
// FACULTY: Create Student
// Faculty can only create students in their own dept + year
// ──────────────────────────────────────────────────────────
export const createStudent = async (req, res) => {
  const {
    name, username, password, rollNumber, enrollmentNumber,
    semester, email, phone, parentName, parentMobile,
  } = req.body;

  if (!name || !username || !password || !rollNumber || !semester) {
    return res.status(400).json({ message: 'Name, username, password, roll number, and semester are required.' });
  }

  try {
    const faculty = await User.findById(req.user.id);
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(403).json({ message: 'Only faculty can create student accounts.' });
    }

    const department = faculty.department;
    const year = faculty.assignedYear || '';

    // Check username uniqueness
    const existingUsername = await User.findOne({ username: username.toLowerCase().trim() });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already taken. Please choose a different one.' });
    }

    // Check rollNumber uniqueness
    const existingRoll = await Student.findOne({ rollNumber: rollNumber.trim() });
    if (existingRoll) {
      return res.status(400).json({ message: 'A student with this roll number already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      username: username.toLowerCase().trim(),
      email: email ? email.toLowerCase().trim() : undefined,
      passwordHash,
      role: 'student',
      status: 'active',
      department,
      year,
      semester,
      rollNumber: rollNumber.trim(),
      phone: phone || '',
      parentName: parentName || '',
      parentMobile: parentMobile || '',
      createdByFaculty: faculty._id,
    });

    const savedUser = await newUser.save();

    const newStudent = new Student({
      user: savedUser._id,
      rollNumber: rollNumber.trim(),
      enrollmentNumber: enrollmentNumber || '',
      department,
      year,
      semester,
      phone: phone || '',
      parentName: parentName || '',
      parentMobile: parentMobile || '',
      createdByFaculty: faculty._id,
    });
    await newStudent.save();

    res.status(201).json({
      success: true,
      message: 'Student account created successfully.',
      student: {
        uid: savedUser._id.toString(),
        name: savedUser.name,
        username: savedUser.username,
        email: savedUser.email,
        rollNumber: savedUser.rollNumber,
        enrollmentNumber: newStudent.enrollmentNumber,
        department: savedUser.department,
        year: savedUser.year,
        semester: savedUser.semester,
        phone: savedUser.phone,
        parentName: savedUser.parentName,
        parentMobile: savedUser.parentMobile,
        createdAt: savedUser.createdAt,
      },
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ message: 'Internal server error creating student.' });
  }
};

// ──────────────────────────────────────────────────────────
// FACULTY: Get All Students (in faculty dept + year)
// ──────────────────────────────────────────────────────────
export const getStudents = async (req, res) => {
  try {
    const faculty = await User.findById(req.user.id);
    if (!faculty) return res.status(404).json({ message: 'Faculty not found.' });

    const filter = { role: 'student', department: faculty.department };
    if (faculty.assignedYear) {
      filter.year = faculty.assignedYear;
    }

    const students = await User.find(filter)
      .select('-passwordHash')
      .sort({ name: 1 });

    res.json(students);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// ──────────────────────────────────────────────────────────
// FACULTY: Get Single Student
// ──────────────────────────────────────────────────────────
export const getStudent = async (req, res) => {
  const { id } = req.params;
  try {
    const faculty = await User.findById(req.user.id);
    const student = await User.findById(id).select('-passwordHash');

    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // Faculty can only view students in their department
    if (faculty.department && student.department !== faculty.department) {
      return res.status(403).json({ message: 'Access denied. Student is in a different department.' });
    }

    res.json(student);
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// ──────────────────────────────────────────────────────────
// FACULTY: Update Student
// ──────────────────────────────────────────────────────────
export const updateStudent = async (req, res) => {
  const { id } = req.params;
  const { name, username, password, rollNumber, enrollmentNumber, semester, email, phone, parentName, parentMobile } = req.body;

  try {
    const faculty = await User.findById(req.user.id);
    const student = await User.findById(id);

    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // Department check
    if (faculty.department && student.department !== faculty.department) {
      return res.status(403).json({ message: 'Access denied. Student is in a different department.' });
    }

    // Username uniqueness check
    if (username && username.toLowerCase().trim() !== student.username) {
      const existing = await User.findOne({ username: username.toLowerCase().trim() });
      if (existing) return res.status(400).json({ message: 'Username already taken.' });
      student.username = username.toLowerCase().trim();
    }

    if (email && email.toLowerCase().trim() !== student.email) {
      const existing = await User.findOne({ email: email.toLowerCase().trim() });
      if (existing) return res.status(400).json({ message: 'Email already in use.' });
      student.email = email.toLowerCase().trim();
    }

    if (name) student.name = name;
    if (rollNumber) student.rollNumber = rollNumber.trim();
    if (semester) student.semester = semester;
    if (phone !== undefined) student.phone = phone;
    if (parentName !== undefined) student.parentName = parentName;
    if (parentMobile !== undefined) student.parentMobile = parentMobile;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      student.passwordHash = await bcrypt.hash(password, salt);
    }

    await student.save();

    // Update Student profile doc
    const studentProfile = await Student.findOne({ user: student._id });
    if (studentProfile) {
      if (rollNumber) studentProfile.rollNumber = rollNumber.trim();
      if (enrollmentNumber) studentProfile.enrollmentNumber = enrollmentNumber;
      if (semester) studentProfile.semester = semester;
      if (phone !== undefined) studentProfile.phone = phone;
      if (parentName !== undefined) studentProfile.parentName = parentName;
      if (parentMobile !== undefined) studentProfile.parentMobile = parentMobile;
      await studentProfile.save();
    }

    clearUserCache(student._id);
    clearProfileCache(student._id);

    res.json({
      success: true,
      message: 'Student updated successfully.',
      student: {
        uid: student._id.toString(),
        name: student.name,
        username: student.username,
        rollNumber: student.rollNumber,
        semester: student.semester,
        department: student.department,
        year: student.year,
      },
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// ──────────────────────────────────────────────────────────
// FACULTY: Delete Student
// ──────────────────────────────────────────────────────────
export const deleteStudent = async (req, res) => {
  const { id } = req.params;
  try {
    const faculty = await User.findById(req.user.id);
    const student = await User.findById(id);

    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found.' });
    }

    if (faculty.department && student.department !== faculty.department) {
      return res.status(403).json({ message: 'Access denied. Student is in a different department.' });
    }

    await Student.deleteOne({ user: student._id });
    await User.deleteOne({ _id: student._id });

    clearUserCache(student._id);
    clearProfileCache(student._id);

    res.json({ success: true, message: 'Student account deleted successfully.' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// ──────────────────────────────────────────────────────────
// ADMIN: Get All Students
// ──────────────────────────────────────────────────────────
export const adminGetStudents = async (req, res) => {
  try {
    const { department, year } = req.query;
    const filter = { role: 'student' };
    if (department) filter.department = department;
    if (year) filter.year = year;

    const students = await User.find(filter).select('-passwordHash').sort({ department: 1, name: 1 });
    res.json(students);
  } catch (error) {
    console.error('Admin get students error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
