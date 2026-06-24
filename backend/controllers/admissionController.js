import bcrypt from 'bcryptjs';
import Admission from '../models/Admission.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import { clearUserCache } from '../middleware/authMiddleware.js';
import { clearProfileCache } from './authController.js';

// ──────────────────────────────────────────────────────────
// FACULTY: Create Admission Request
// ──────────────────────────────────────────────────────────
export const createAdmissionRequest = async (req, res) => {
  const {
    name, username, password, rollNumber, enrollmentNumber,
    department, year, semester, email, phone, parentName,
    parentMobile, address
  } = req.body;

  if (!name || !username || !password || !rollNumber || !department || !year || !semester) {
    return res.status(400).json({ message: 'Name, username, password, roll number, department, year, and semester are required.' });
  }

  try {
    const faculty = await User.findById(req.user.id);
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(403).json({ message: 'Only faculty can create admission requests.' });
    }

    // Verify faculty department matches request department
    if (faculty.department !== department) {
      return res.status(403).json({ message: 'You can only submit admissions for your own department.' });
    }

    // Check if faculty is assigned to this semester
    if (!faculty.assignedSemesters.includes(semester)) {
      return res.status(403).json({ message: `You are not assigned to manage students for ${semester}.` });
    }

    // Check if username is already taken in User model
    const existingUser = await User.findOne({ username: username.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already taken by an active student/user.' });
    }

    // Check if username is already pending in Admissions
    const existingAdmissionUser = await Admission.findOne({
      username: username.toLowerCase().trim(),
      status: 'pending'
    });
    if (existingAdmissionUser) {
      return res.status(400).json({ message: 'An admission request with this username is already pending approval.' });
    }

    // Check if roll number is already taken
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
      message: 'Admission request submitted successfully and is pending admin approval.',
      admission: newRequest,
    });
  } catch (error) {
    console.error('Create admission request error:', error);
    res.status(500).json({ message: 'Internal server error submitting request.' });
  }
};

// ──────────────────────────────────────────────────────────
// GET ADMISSION REQUESTS
// Faculty sees only their department + assigned semesters
// Admin sees all
// ──────────────────────────────────────────────────────────
export const getAdmissionRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    let filter = {};

    if (user.role === 'faculty') {
      filter = {
        department: user.department,
        semester: { $in: user.assignedSemesters }
      };
    }

    const admissions = await Admission.find(filter)
      .populate('createdByFaculty', 'name email')
      .sort({ createdAt: -1 });

    res.json(admissions);
  } catch (error) {
    console.error('Get admission requests error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// ──────────────────────────────────────────────────────────
// ADMIN: Approve Admission Request
// ──────────────────────────────────────────────────────────
export const approveAdmissionRequest = async (req, res) => {
  const { id } = req.params;

  try {
    const request = await Admission.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Admission request not found.' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: `Request is already ${request.status}.` });
    }

    // Double check username uniqueness in active users
    const existingUser = await User.findOne({ username: request.username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username is already taken by another active user.' });
    }

    // Double check roll number uniqueness
    const existingRoll = await Student.findOne({ rollNumber: request.rollNumber });
    if (existingRoll) {
      return res.status(400).json({ message: 'Roll number already in use.' });
    }

    // Create User record
    const newUser = new User({
      name: request.name,
      username: request.username,
      email: request.email,
      passwordHash: request.passwordHash,
      role: 'student',
      status: 'active',
      department: request.department,
      year: request.year,
      semester: request.semester,
      rollNumber: request.rollNumber,
      phone: request.phone,
      parentName: request.parentName,
      parentMobile: request.parentMobile,
      createdByFaculty: request.createdByFaculty,
    });

    const savedUser = await newUser.save();

    // Create Student record
    const newStudent = new Student({
      user: savedUser._id,
      rollNumber: request.rollNumber,
      enrollmentNumber: request.enrollmentNumber,
      department: request.department,
      year: request.year,
      semester: request.semester,
      phone: request.phone,
      parentName: request.parentName,
      parentMobile: request.parentMobile,
      createdByFaculty: request.createdByFaculty,
    });

    await newStudent.save();

    // Mark admission request as approved
    request.status = 'approved';
    await request.save();

    res.json({
      success: true,
      message: 'Admission request approved. Student user account has been created.',
      student: savedUser,
    });
  } catch (error) {
    console.error('Approve admission error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// ──────────────────────────────────────────────────────────
// ADMIN: Reject Admission Request
// ──────────────────────────────────────────────────────────
export const rejectAdmissionRequest = async (req, res) => {
  const { id } = req.params;

  try {
    const request = await Admission.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Admission request not found.' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: `Request is already ${request.status}.` });
    }

    request.status = 'rejected';
    await request.save();

    res.json({
      success: true,
      message: 'Admission request rejected successfully.',
      admission: request,
    });
  } catch (error) {
    console.error('Reject admission error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// ──────────────────────────────────────────────────────────
// FACULTY/ADMIN: Delete Admission Request
// ──────────────────────────────────────────────────────────
export const deleteAdmissionRequest = async (req, res) => {
  const { id } = req.params;

  try {
    const request = await Admission.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Admission request not found.' });
    }

    // Verify faculty owns it
    if (req.user.role === 'faculty' && request.createdByFaculty.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own submitted admission requests.' });
    }

    await Admission.deleteOne({ _id: id });

    res.json({
      success: true,
      message: 'Admission request deleted successfully.',
    });
  } catch (error) {
    console.error('Delete admission request error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
