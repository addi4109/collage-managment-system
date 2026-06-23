import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';

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
      const { studentId, date } = req.query;
      if (studentId) {
        filter.student = studentId;
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
