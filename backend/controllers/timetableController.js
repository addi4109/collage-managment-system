import * as timetableService from '../services/timetableService.js';

export const saveDaySchedule = async (req, res) => {
  try {
    if (req.user.role === 'hod') {
      req.body.departmentId = req.user.departmentId;
    }
    const timetable = await timetableService.createTimetableEntry(req.body, req.user.id);
    res.status(200).json({ message: 'Timetable entry saved successfully.', timetable });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getClassSchedule = async (req, res) => {
  try {
    if (req.user.role === 'hod') {
      req.query.departmentId = req.user.departmentId;
    }
    const { departmentId, year, semester } = req.query;
    if (!departmentId || !year || !semester) {
      return res.status(400).json({ message: 'Missing parameters departmentId, year, or semester.' });
    }
    const timetable = await timetableService.getClassTimetable(departmentId, year, semester);
    res.status(200).json(timetable);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve class schedule.' });
  }
};

export const getMySchedule = async (req, res) => {
  try {
    let schedule = [];
    if (req.user.role === 'student') {
      schedule = await timetableService.getStudentTimetable(req.user.id);
    } else if (req.user.role === 'faculty') {
      // Use case-insensitive search by faculty name string
      schedule = await timetableService.getFacultySchedule(req.user.name);
    } else {
      // Admins use the class-filtered endpoint instead
      return res.status(200).json([]);
    }
    res.status(200).json(schedule);
  } catch (err) {
    console.error('getMySchedule error:', err.message);
    res.status(200).json([]); // Return empty array so frontend shows "no entries" state
  }
};

export const deleteEntry = async (req, res) => {
  try {
    const { id } = req.params;
    await timetableService.deleteTimetableEntry(id);
    res.status(200).json({ message: 'Timetable entry deleted successfully.' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
