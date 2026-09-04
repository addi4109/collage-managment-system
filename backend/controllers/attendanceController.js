import * as attendanceService from '../services/attendanceService.js';

export const createSession = async (req, res) => {
  try {
    const session = await attendanceService.createSession(
      req.body,
      req.user.id,
      req.user.assignedDepartments || [],
      req.user.assignedYears || []
    );
    res.status(201).json({ message: 'Attendance session created successfully.', session });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const endSession = async (req, res) => {
  try {
    const session = await attendanceService.endSession(req.params.id, req.user.id);
    res.status(200).json({ message: 'Attendance session ended successfully.', session });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const checkIn = async (req, res) => {
  try {
    const { sessionToken } = req.body;
    if (!sessionToken) {
      return res.status(400).json({ message: 'Session token is required.' });
    }

    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const deviceInfo = req.headers['user-agent'] || 'Unknown Device';

    const record = await attendanceService.checkIn(req.user.id, sessionToken, ipAddress, deviceInfo);
    res.status(200).json({ message: 'Attendance marked successfully.', record });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getSessionList = async (req, res) => {
  try {
    const sessions = await attendanceService.getFacultySessions(req.user.id);
    res.status(200).json(sessions);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve sessions list.' });
  }
};

export const getSessionDetails = async (req, res) => {
  try {
    const details = await attendanceService.getSessionAttendance(req.params.id, req.user.id);
    res.status(200).json(details);
  } catch (err) {
    console.error('[getSessionDetails] Error:', err.message);
    res.status(400).json({ message: err.message });
  }
};

export const getStudentSummary = async (req, res) => {
  try {
    const summary = await attendanceService.getStudentAttendanceDetails(req.user.id);
    res.status(200).json(summary);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
