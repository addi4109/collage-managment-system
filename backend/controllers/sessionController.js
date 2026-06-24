import crypto from 'crypto';
import AttendanceSession from '../models/AttendanceSession.js';

// Create a new session in "created" status
export const createSession = async (req, res) => {
  const {
    facultyName,
    courseName,
    sessionTitle,
    department,
    year,
    semester,
    subject,
    date,
    startTime,
    duration,
    description,
  } = req.body;

  if (!facultyName || (!courseName && !subject) || !sessionTitle || !date || !startTime) {
    return res.status(400).json({
      message: 'Faculty name, subject/course name, session title, date, and start time are required.',
    });
  }

  try {
    const activeSubject = subject || courseName;
    if (req.user.role === 'faculty') {
      const assigned = req.user.assignedSubjects || [];
      if (!assigned.includes(activeSubject)) {
        return res.status(403).json({
          message: `Forbidden. You are not assigned to teach the subject "${activeSubject}".`,
        });
      }
    }

    const newSession = new AttendanceSession({
      facultyId: req.user.id,
      facultyName,
      courseName: activeSubject,
      subject: activeSubject,
      sessionTitle,
      department: req.user.role === 'faculty' ? req.user.department : (department || ''),
      year: year || '',
      semester: semester || '',
      date: new Date(date),
      startTime,
      duration: Number(duration) || 5,
      description: description || '',
      status: 'created',
    });

    const savedSession = await newSession.save();
    res.status(201).json(savedSession);
  } catch (error) {
    console.error('Create attendance session error:', error);
    res.status(500).json({ message: 'Internal server error creating session.' });
  }
};

// Start a session, transition status to "active", generate QR payload token
export const startSession = async (req, res) => {
  const { id } = req.params;

  try {
    const session = await AttendanceSession.findById(id);

    if (!session) {
      return res.status(404).json({ message: 'Attendance session not found.' });
    }

    // Verify ownership
    if (session.facultyId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized. You do not own this session.' });
    }

    if (session.status === 'ended') {
      return res.status(400).json({ message: 'Cannot start a session that has already ended.' });
    }

    // Generate secure token and set expiration
    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + session.duration * 60 * 1000);

    session.sessionToken = token;
    session.status = 'active';
    session.expiresAt = expiresAt;

    const updatedSession = await session.save();
    res.json(updatedSession);
  } catch (error) {
    console.error('Start attendance session error:', error);
    res.status(500).json({ message: 'Internal server error starting session.' });
  }
};

// End a session manually, transition status to "ended"
export const endSession = async (req, res) => {
  const { id } = req.params;

  try {
    const session = await AttendanceSession.findById(id);

    if (!session) {
      return res.status(404).json({ message: 'Attendance session not found.' });
    }

    // Verify ownership
    if (session.facultyId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized. You do not own this session.' });
    }

    session.status = 'ended';
    // Optionally invalidate/remove token to prevent late checkins
    session.sessionToken = undefined;

    const updatedSession = await session.save();
    res.json(updatedSession);
  } catch (error) {
    console.error('End attendance session error:', error);
    res.status(500).json({ message: 'Internal server error ending session.' });
  }
};

// Retrieve all sessions created by the logged-in faculty
export const getSessions = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { facultyId: req.user.id, department: req.user.department };
    const sessions = await AttendanceSession.find(filter).sort({ createdAt: -1 });
    res.json(sessions);
  } catch (error) {
    console.error('Fetch attendance sessions error:', error);
    res.status(500).json({ message: 'Internal server error fetching sessions.' });
  }
};
