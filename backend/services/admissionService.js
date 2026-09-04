import bcrypt from 'bcryptjs';
import Admission from '../models/Admission.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Subject from '../models/Subject.js';
import StudentSubject from '../models/StudentSubject.js';
import { logActivity } from './auditService.js'; // We'll stub this or use auditLogs

export const createAdmissionRequest = async (admissionData, facultyId) => {
  const { name, username, password, rollNumber, enrollmentNumber, departmentId, year, semester, email, phone, parentName, parentMobile, address } = admissionData;

  // Check unique constraints
  const existingAdmission = await Admission.findOne({ enrollmentNumber, isDeleted: false });
  if (existingAdmission) {
    throw new Error('An admission request with this enrollment number already exists.');
  }

  const existingUser = await User.findOne({ 
    $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
    isDeleted: false 
  });
  if (existingUser) {
    throw new Error('A user with this username or email already exists.');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const admission = new Admission({
    name,
    username: username.toLowerCase(),
    passwordHash,
    rollNumber,
    enrollmentNumber,
    departmentId,
    year,
    semester,
    email: email.toLowerCase(),
    phone,
    parentName,
    parentMobile,
    address,
    status: 'pending',
    createdByFaculty: facultyId,
  });

  return await admission.save();
};

export const getPendingAdmissions = async () => {
  return await Admission.find({ status: 'pending', isDeleted: false })
    .populate('departmentId', 'name code')
    .populate('createdByFaculty', 'name email');
};

export const approveAdmission = async (admissionId, adminId, ipAddress) => {
  const admission = await Admission.findOne({ _id: admissionId, status: 'pending', isDeleted: false });
  if (!admission) {
    throw new Error('Pending admission request not found.');
  }

  // Double check user accounts
  const existingUser = await User.findOne({ 
    $or: [{ username: admission.username }, { email: admission.email }],
    isDeleted: false 
  });
  if (existingUser) {
    throw new Error('A user account with this username or email already exists.');
  }

  // 1. Create User
  const newUser = new User({
    name: admission.name,
    email: admission.email,
    username: admission.username,
    passwordHash: admission.passwordHash,
    role: 'student',
    status: 'active',
  });
  const savedUser = await newUser.save();

  // 2. Create Student Profile
  const newStudent = new Student({
    userId: savedUser._id,
    rollNumber: admission.rollNumber,
    enrollmentNumber: admission.enrollmentNumber,
    departmentId: admission.departmentId,
    year: admission.year,
    semester: admission.semester,
    phone: admission.phone,
    parentName: admission.parentName,
    parentMobile: admission.parentMobile,
    address: admission.address,
  });
  await newStudent.save();

  // 3. Auto-enroll student into all subjects belonging to this Dept + Year + Sem
  const subjects = await Subject.find({
    departmentId: admission.departmentId,
    year: admission.year,
    semester: admission.semester,
    isDeleted: false,
  });

  const academicYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
  for (const subject of subjects) {
    const enrollment = new StudentSubject({
      studentId: savedUser._id,
      subjectId: subject._id,
      academicYear,
    });
    await enrollment.save().catch(() => {
      // Ignore duplicate errors just in case
    });
  }

  // 4. Update Admission Status
  admission.status = 'approved';
  await admission.save();

  // 5. Audit Log
  await logActivity({
    action: 'ADMISSION_APPROVED',
    performedBy: adminId,
    targetId: savedUser._id,
    details: `Approved student admission request: ${admission.name} (${admission.enrollmentNumber})`,
    ipAddress,
  });

  return savedUser;
};

export const rejectAdmission = async (admissionId, adminId, ipAddress) => {
  const admission = await Admission.findOne({ _id: admissionId, status: 'pending', isDeleted: false });
  if (!admission) {
    throw new Error('Pending admission request not found.');
  }

  admission.status = 'rejected';
  await admission.save();

  // Audit Log
  await logActivity({
    action: 'ADMISSION_REJECTED',
    performedBy: adminId,
    details: `Rejected student admission request: ${admission.name} (${admission.enrollmentNumber})`,
    ipAddress,
  });

  return admission;
};
