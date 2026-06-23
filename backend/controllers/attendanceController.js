import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import AttendanceSession from '../models/AttendanceSession.js';

export const getStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate({
        path: 'user',
        select: 'name email status role'
      });
    
    // Filter out any student records that don't have a valid associated User profile
    const activeStudents = students.filter(s => s.user && s.user.status === 'active');
    res.json(activeStudents);
  } catch (error) {
    console.error('Fetch students error:', error);
    res.status(500).json({ message: 'Internal server error fetching students.' });
  }
};

export const markAttendance = async (req, res) => {
  const { date, records } = req.body;

  if (!date || !records || !Array.isArray(records)) {
    return res.status(400).json({ message: 'Date and student records array are required.' });
  }

  try {
    const parsedDate = new Date(date);
    // Standardize date to midnight to prevent time zone offset mismatches
    parsedDate.setUTCHours(0, 0, 0, 0);

    const bulkOps = records.map(record => ({
      updateOne: {
        filter: { student: record.studentId, date: parsedDate },
        update: {
          $set: {
            faculty: req.user.id,
            status: record.status,
          }
        },
        upsert: true
      }
    }));

    await Attendance.bulkWrite(bulkOps);
    res.json({ message: 'Attendance records saved successfully.' });
  } catch (error) {
    console.error('Save attendance error:', error);
    res.status(500).json({ message: 'Internal server error saving attendance.' });
  }
};

export const getAttendanceRecords = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === 'student') {
      filter.student = req.user.id;
    } else {
      // Faculty/Admin can optionally pass a student ID or date filter
      const { studentId, date, sessionId } = req.query;
      if (studentId) {
        filter.student = studentId;
      }
      if (sessionId) {
        filter.session = sessionId;
      }
      if (date) {
        const parsedDate = new Date(date);
        parsedDate.setUTCHours(0, 0, 0, 0);
        filter.date = parsedDate;
      }
    }

    const records = await Attendance.find(filter)
      .populate('student', 'name email')
      .populate('faculty', 'name email')
      .sort({ date: -1 });

    res.json(records);
  } catch (error) {
    console.error('Fetch attendance records error:', error);
    res.status(500).json({ message: 'Internal server error fetching attendance records.' });
  }
};

export const checkin = async (req, res) => {
  const { sessionToken } = req.body;

  if (!sessionToken) {
    return res.status(400).json({ message: 'Session token is required.' });
  }

  try {
    // Find active session by token
    const session = await AttendanceSession.findOne({ sessionToken, status: 'active' });

    if (!session) {
      return res.status(404).json({ message: 'Active check-in session not found or has been ended.' });
    }

    // Check if expired
    const now = new Date();
    if (session.expiresAt && now > new Date(session.expiresAt)) {
      // Auto transition to ended
      session.status = 'ended';
      session.sessionToken = undefined; // clear token
      await session.save();
      return res.status(410).json({ message: 'This attendance session has expired.' });
    }

    // Prevent duplicate check-ins for this student in this session
    const existingRecord = await Attendance.findOne({
      student: req.user.id,
      session: session._id,
    });

    if (existingRecord) {
      return res.status(400).json({ message: 'You have already checked in for this session.' });
    }

    // Mark student present
    const attendanceRecord = new Attendance({
      student: req.user.id,
      faculty: session.facultyId,
      date: new Date(session.date),
      status: 'Present',
      session: session._id,
    });

    await attendanceRecord.save();

    res.status(201).json({
      success: true,
      message: 'Attendance checked in successfully!',
      courseName: session.courseName,
      sessionTitle: session.sessionTitle,
    });
  } catch (error) {
    console.error('Student checkin error:', error);
    res.status(500).json({ message: 'Internal server error checking in.' });
  }
};

