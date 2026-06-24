import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Admission from '../models/Admission.js';
import { clearUserCache } from '../middleware/authMiddleware.js';
import { clearProfileCache } from './authController.js';

// ──────────────────────────────────────────────────────────
// FACULTY: Add Student -> Creates Admission Request (Pending)
// Student accounts are only created through Admission approvals.
// ──────────────────────────────────────────────────────────
export const createStudent = async (req, res) => {
  const {
    name, username, password, rollNumber, enrollmentNumber,
    semester, email, phone, parentName, parentMobile, address,
  } = req.body;

  if (!name || !username || !password || !rollNumber || !semester) {
    return res.status(400).json({ message: 'Name, username, password, roll number, and semester are required.' });
  }

  try {
    const faculty = await User.findById(req.user.id);
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(403).json({ message: 'Only faculty can initiate student admissions.' });
    }

    const department = faculty.department;

    // Check if faculty is assigned to this semester
    if (!faculty.assignedSemesters.includes(semester)) {
      return res.status(403).json({ message: `You are not assigned to manage students for ${semester}.` });
    }

    // Determine year based on semester
    let year = '';
    if (semester === 'Sem 1' || semester === 'Sem 2') year = 'First Year';
    else if (semester === 'Sem 3' || semester === 'Sem 4') year = 'Second Year';
    else if (semester === 'Sem 5' || semester === 'Sem 6') year = 'Third Year';

    // Check username uniqueness in User
    const existingUsername = await User.findOne({ username: username.toLowerCase().trim() });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already taken by an active student.' });
    }

    // Check username uniqueness in pending admissions
    const existingAdmission = await Admission.findOne({
      username: username.toLowerCase().trim(),
      status: 'pending'
    });
    if (existingAdmission) {
      return res.status(400).json({ message: 'An admission request for this username is already pending approval.' });
    }

    // Check rollNumber uniqueness
    const existingRoll = await Student.findOne({ rollNumber: rollNumber.trim() });
    if (existingRoll) {
      return res.status(400).json({ message: 'A student with this roll number already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newRequest = new Admission({
      name,
      username: username.toLowerCase().trim(),
      passwordHash,
      rollNumber: rollNumber.trim(),
      enrollmentNumber: enrollmentNumber || '',
      department,
      year,
      semester,
      email: email ? email.toLowerCase().trim() : undefined,
      phone: phone || '',
      parentName: parentName || '',
      parentMobile: parentMobile || '',
      address: address || '',
      status: 'pending',
      createdByFaculty: faculty._id,
    });

    await newRequest.save();

    res.status(201).json({
      success: true,
      message: 'Admission request created successfully and is pending admin approval.',
      admission: newRequest,
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ message: 'Internal server error creating student.' });
  }
};

// ──────────────────────────────────────────────────────────
// FACULTY: Get All Students (in faculty dept + assigned semesters)
// ──────────────────────────────────────────────────────────
export const getStudents = async (req, res) => {
  try {
    const faculty = await User.findById(req.user.id);
    if (!faculty) return res.status(404).json({ message: 'Faculty not found.' });

    let filter = { role: 'student' };

    if (faculty.role === 'faculty') {
      filter.department = faculty.department;
      filter.semester = { $in: faculty.assignedSemesters };
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

    // Faculty can only view students in their department & assigned semesters
    if (faculty.role === 'faculty') {
      if (student.department !== faculty.department) {
        return res.status(403).json({ message: 'Access denied. Student is in a different department.' });
      }
      if (!faculty.assignedSemesters.includes(student.semester)) {
        return res.status(403).json({ message: 'Access denied. Student is not in your assigned semesters.' });
      }
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

    // Faculty can only update students in their department & assigned semesters
    if (faculty.role === 'faculty') {
      if (student.department !== faculty.department) {
        return res.status(403).json({ message: 'Access denied. Student is in a different department.' });
      }
      if (!faculty.assignedSemesters.includes(student.semester)) {
        return res.status(403).json({ message: 'Access denied. Student is not in your assigned semesters.' });
      }
      // If updating semester, check if new semester is also in faculty's assigned semesters
      if (semester && !faculty.assignedSemesters.includes(semester)) {
        return res.status(403).json({ message: 'Access denied. Cannot move student to a semester not assigned to you.' });
      }
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
    if (semester) {
      student.semester = semester;
      // Update year based on semester
      let year = '';
      if (semester === 'Sem 1' || semester === 'Sem 2') year = 'First Year';
      else if (semester === 'Sem 3' || semester === 'Sem 4') year = 'Second Year';
      else if (semester === 'Sem 5' || semester === 'Sem 6') year = 'Third Year';
      student.year = year;
    }
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
      if (semester) {
        studentProfile.semester = semester;
        let year = '';
        if (semester === 'Sem 1' || semester === 'Sem 2') year = 'First Year';
        else if (semester === 'Sem 3' || semester === 'Sem 4') year = 'Second Year';
        else if (semester === 'Sem 5' || semester === 'Sem 6') year = 'Third Year';
        studentProfile.year = year;
      }
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

    if (faculty.role === 'faculty') {
      if (student.department !== faculty.department) {
        return res.status(403).json({ message: 'Access denied. Student is in a different department.' });
      }
      if (!faculty.assignedSemesters.includes(student.semester)) {
        return res.status(403).json({ message: 'Access denied. Student is not in your assigned semesters.' });
      }
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
    const { department, year, semester } = req.query;
    const filter = { role: 'student' };
    if (department) filter.department = department;
    if (year) filter.year = year;
    if (semester) filter.semester = semester;

    const students = await User.find(filter).select('-passwordHash').sort({ department: 1, name: 1 });
    res.json(students);
  } catch (error) {
    console.error('Admin get students error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
