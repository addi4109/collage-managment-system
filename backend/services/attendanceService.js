import crypto from 'crypto';
import mongoose from 'mongoose';
import AttendanceSession from '../models/AttendanceSession.js';
import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import { createBatchNotifications } from './notificationService.js';

export const createSession = async (sessionData, facultyId, assignedDepartments, assignedYears) => {
  const { subjectName, departmentId, year, semester, date, startTime, duration } = sessionData;

  // 1. Validate faculty scope
  if (!assignedDepartments.includes(departmentId) || !assignedYears.includes(year)) {
    throw new Error('Forbidden: You can only create sessions for your assigned department and year.');
  }

  // 2. Generate cryptographically secure token
  const sessionToken = crypto.randomBytes(24).toString('hex');

  // Robust Date parsing helper
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr;
    // YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) return d;
    }
    // DD/MM/YYYY or DD-MM-YYYY format
    const dmw = dateStr.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
    if (dmw) {
      const day = parseInt(dmw[1], 10);
      const month = parseInt(dmw[2], 10) - 1;
      const yr = parseInt(dmw[3], 10);
      const d = new Date(yr, month, day);
      if (!isNaN(d.getTime())) return d;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
    return null;
  };

  // Robust Time parsing helper
  const parseTime = (timeStr) => {
    if (!timeStr) return null;
    const match = timeStr.trim().match(/^(\d{1,2})[:.](\d{2})\s*(AM|PM)?$/i);
    if (match) {
      let hrs = parseInt(match[1], 10);
      const mins = parseInt(match[2], 10);
      const ampm = match[3] ? match[3].toUpperCase() : null;
      if (ampm === 'PM' && hrs < 12) hrs += 12;
      else if (ampm === 'AM' && hrs === 12) hrs = 0;
      return { hours: hrs, minutes: mins };
    }
    const simpleMatch = timeStr.trim().match(/^(\d{1,2})\s*(AM|PM)?$/i);
    if (simpleMatch) {
      let hrs = parseInt(simpleMatch[1], 10);
      const ampm = simpleMatch[2] ? simpleMatch[2].toUpperCase() : null;
      if (ampm === 'PM' && hrs < 12) hrs += 12;
      else if (ampm === 'AM' && hrs === 12) hrs = 0;
      return { hours: hrs, minutes: 0 };
    }
    return null;
  };

  const parsedDate = parseDate(date);
  if (!parsedDate) {
    throw new Error('Invalid Date format. Please use DD/MM/YYYY or YYYY-MM-DD.');
  }

  const timeParsed = parseTime(startTime);
  if (!timeParsed) {
    throw new Error('Invalid Start Time format. Please use e.g. "10:00 AM" or "14:30".');
  }

  parsedDate.setHours(timeParsed.hours, timeParsed.minutes, 0, 0);
  const expiresAt = new Date(parsedDate.getTime() + duration * 60 * 1000);

  const session = new AttendanceSession({
    facultyId,
    subjectName,
    departmentId,
    year,
    semester,
    date: parsedDate,
    startTime,
    duration,
    sessionToken,
    status: 'active',
    expiresAt,
  });

  const savedSession = await session.save();

  await createBatchNotifications(
    departmentId,
    year,
    semester,
    'Attendance Session Open',
    `Attendance check-in session opened for [${subjectName}]. Code: ${sessionToken.slice(0, 8)}`,
    'ATTENDANCE'
  );

  return savedSession;
};

export const endSession = async (sessionId, facultyId) => {
  const session = await AttendanceSession.findOne({
    _id: new mongoose.Types.ObjectId(sessionId),
    facultyId: new mongoose.Types.ObjectId(facultyId),
  });
  if (!session) {
    throw new Error('Attendance session not found.');
  }
  session.status = 'ended';
  session.expiresAt = new Date(); // Expire immediately
  return await session.save();
};

export const checkIn = async (studentId, sessionToken, ipAddress, deviceInfo) => {
  // 1. Retrieve Active Session
  const session = await AttendanceSession.findOne({ sessionToken, status: 'active' });
  if (!session) {
    throw new Error('Session is inactive, expired, or invalid.');
  }

  if (new Date() > session.expiresAt) {
    session.status = 'ended';
    await session.save();
    throw new Error('This attendance session has expired.');
  }

  // 2. Verify student matches session scope (dept, year, semester)
  const student = await Student.findOne({ userId: studentId, isDeleted: false });
  if (!student) {
    throw new Error('Student profile not found.');
  }

  if (student.departmentId.toString() !== session.departmentId.toString() ||
      student.year !== session.year ||
      student.semester !== session.semester) {
    throw new Error('Forbidden: You are not registered in this class scope.');
  }

  // 3. Duplicate Check
  const existingRecord = await Attendance.findOne({ studentId, sessionId: session._id });
  if (existingRecord) {
    throw new Error('Attendance has already been marked for this session.');
  }

  // 4. Proxy check
  const recentCheckInFromSameIp = await Attendance.findOne({
    sessionId: session._id,
    ipAddress,
    deviceInfo,
    studentId: { $ne: studentId },
    timestamp: { $gte: new Date(Date.now() - 15000) },
  });

  if (recentCheckInFromSameIp) {
    console.warn(`[Attendance Warning] Proxy scan flagged for Student: ${studentId} from IP: ${ipAddress}`);
  }

  // 5. Record Attendance
  const record = new Attendance({
    studentId,
    sessionId: session._id,
    departmentId: session.departmentId,
    year: session.year,
    semester: session.semester,
    subjectName: session.subjectName,
    ipAddress,
    deviceInfo,
  });

  return await record.save();
};

export const getSessionAttendance = async (sessionId, facultyId) => {
  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    throw new Error('Invalid session ID format.');
  }

  const session = await AttendanceSession.findOne({
    _id: new mongoose.Types.ObjectId(sessionId),
    facultyId: new mongoose.Types.ObjectId(facultyId),
  });
  if (!session) {
    throw new Error('Attendance session not found.');
  }

  const records = await Attendance.find({ sessionId: session._id })
    .populate('studentId', 'name email username')
    .sort({ createdAt: -1 });

  const enrichedRecords = [];
  for (const r of records) {
    if (!r.studentId) continue;
    const studentProfile = await Student.findOne({ userId: r.studentId._id, isDeleted: false });
    enrichedRecords.push({
      ...r.toObject(),
      studentName: r.studentId.name,
      studentEmail: r.studentId.email,
      rollNumber: studentProfile ? studentProfile.rollNumber : 'N/A',
      enrollmentNumber: studentProfile ? studentProfile.enrollmentNumber : 'N/A',
    });
  }

  return {
    session,
    records: enrichedRecords,
  };
};

export const getStudentAttendanceDetails = async (studentId) => {
  // Find all attendance records marked for the student
  const records = await Attendance.find({ studentId })
    .populate('sessionId')
    .sort({ timestamp: -1 });

  return records;
};

export const getFacultySessions = async (facultyId) => {
  return await AttendanceSession.find({ facultyId })
    .populate('departmentId', 'name code')
    .sort({ createdAt: -1 });
};
