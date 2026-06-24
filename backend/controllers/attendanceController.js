import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import AttendanceSession from '../models/AttendanceSession.js';

export const getStudents = async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'faculty') {
      query.department = req.user.department;
    }
    const students = await Student.find(query)
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
    } else if (req.user.role === 'faculty') {
      const { studentId, date, sessionId } = req.query;

      // Filter by department students
      const deptStudents = await Student.find({ department: req.user.department }).select('user');
      const deptStudentUserIds = deptStudents.map(s => s.user.toString());

      if (studentId) {
        if (!deptStudentUserIds.includes(studentId.toString())) {
          return res.status(403).json({ message: 'Unauthorized. Student is not in your department.' });
        }
        filter.student = studentId;
      } else {
        filter.student = { $in: deptStudentUserIds };
      }

      // Filter by session / assigned subjects
      if (sessionId) {
        const session = await AttendanceSession.findById(sessionId);
        if (!session || session.department !== req.user.department || !(req.user.assignedSubjects || []).includes(session.courseName)) {
          return res.status(403).json({ message: 'Unauthorized. Session does not match your assigned subjects.' });
        }
        filter.session = sessionId;
      } else {
        const sessions = await AttendanceSession.find({
          department: req.user.department,
          courseName: { $in: req.user.assignedSubjects || [] }
        });
        const sessionIds = sessions.map(s => s._id);
        filter.session = { $in: sessionIds };
      }

      if (date) {
        const parsedDate = new Date(date);
        parsedDate.setUTCHours(0, 0, 0, 0);
        filter.date = parsedDate;
      }
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

export const checkInStudent = async (req, res) => {
  const { sessionToken } = req.body;

  if (!sessionToken) {
    return res.status(400).json({ message: 'Session token is required.' });
  }

  try {
    // Only students can check in
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students are permitted to check in.' });
    }

    // Find active session by token
    const session = await AttendanceSession.findOne({ sessionToken, status: 'active' });

    if (!session) {
      return res.status(404).json({ message: 'Active check-in session not found or has been ended.' });
    }

    // Check student department matches session department
    if (session.department && session.department !== req.user.department) {
      return res.status(403).json({ message: `Unauthorized. This session is for the ${session.department} department.` });
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
      $or: [
        { studentId: req.user.id, sessionId: session._id },
        { student: req.user.id, session: session._id }
      ]
    });

    if (existingRecord) {
      return res.status(400).json({ message: 'You have already checked in for this session.' });
    }

    // Mark student present
    const attendanceRecord = new Attendance({
      studentId: req.user.id,
      student: req.user.id,
      studentName: req.user.name,
      facultyId: session.facultyId,
      faculty: session.facultyId,
      sessionId: session._id,
      session: session._id,
      date: new Date(session.date),
      status: 'Present',
      checkInTime: new Date(),
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

export const getFacultySessions = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { facultyId: req.user.id, department: req.user.department };
    const sessions = await AttendanceSession.find(filter).sort({ createdAt: -1 });
    res.json(sessions);
  } catch (error) {
    console.error('Fetch faculty sessions error:', error);
    res.status(500).json({ message: 'Internal server error fetching sessions.' });
  }
};

export const getSessionAttendance = async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await AttendanceSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Attendance session not found.' });
    }

    // Faculty can only access their own sessions unless admin
    if (session.facultyId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized. You do not own this session.' });
    }

    const records = await Attendance.find({
      $or: [{ sessionId }, { session: sessionId }]
    });

    // Populate student roll numbers from Student collection
    const studentUserIds = records.map(r => r.studentId || r.student);
    const studentProfiles = await Student.find({ user: { $in: studentUserIds } });

    const presentStudents = records.map(record => {
      const sId = (record.studentId || record.student).toString();
      const profile = studentProfiles.find(p => p.user.toString() === sId);
      return {
        studentId: sId,
        studentName: record.studentName || 'Unknown Student',
        rollNumber: profile ? profile.rollNumber : 'N/A',
        checkInTime: record.checkInTime || record.createdAt || new Date(),
        status: record.status,
      };
    });

    res.json({
      session,
      presentStudents,
      totalPresent: presentStudents.length,
    });
  } catch (error) {
    console.error('Get session attendance error:', error);
    res.status(500).json({ message: 'Internal server error fetching session attendance.' });
  }
};

