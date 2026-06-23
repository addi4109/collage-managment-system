import Report from '../models/Report.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';

const monthMap = {
  january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
  may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7,
  sep: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11
};

const getMonthIndex = (monthStr) => {
  const normalized = monthStr.toLowerCase().trim();
  if (monthMap[normalized] !== undefined) return monthMap[normalized];
  const num = parseInt(normalized, 10);
  if (!isNaN(num) && num >= 1 && num <= 12) return num - 1;
  return null;
};

// Create a new report draft
export const createReport = async (req, res) => {
  const {
    studentId,
    courseName,
    month,
    year,
    totalClasses,
    attendedClasses,
    attendancePercentage,
    subjects,
    remarks,
    performanceGrade,
    behaviorComment,
    improvementSuggestions,
  } = req.body;

  if (
    !studentId ||
    !courseName ||
    !month ||
    !year ||
    totalClasses === undefined ||
    attendedClasses === undefined ||
    attendancePercentage === undefined ||
    !subjects ||
    !remarks ||
    !performanceGrade
  ) {
    return res.status(400).json({ message: 'All required fields must be provided.' });
  }

  try {
    const studentUser = await User.findById(studentId);
    if (!studentUser || studentUser.role !== 'student') {
      return res.status(404).json({ message: 'Student user not found.' });
    }

    // Check if report already exists for this student, month, and year to avoid unique constraint error
    const existing = await Report.findOne({ studentId, month, year });
    if (existing) {
      return res.status(400).json({ message: `A report already exists for this student for ${month} ${year}.` });
    }

    const newReport = new Report({
      studentId,
      studentName: studentUser.name,
      facultyId: req.user.id,
      facultyName: req.user.name,
      courseName,
      month,
      year: parseInt(year, 10),
      totalClasses: parseInt(totalClasses, 10),
      attendedClasses: parseInt(attendedClasses, 10),
      attendancePercentage: parseFloat(attendancePercentage),
      subjects,
      remarks,
      performanceGrade,
      behaviorComment: behaviorComment || '',
      improvementSuggestions: improvementSuggestions || '',
      status: 'draft',
      lastUpdatedAt: Date.now(),
    });

    const savedReport = await newReport.save();
    res.status(201).json(savedReport);
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ message: 'Internal server error creating report.' });
  }
};

// Edit / Update an existing report (Faculty owner only)
export const updateReport = async (req, res) => {
  const { id } = req.params;
  const updateFields = req.body;

  try {
    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    // Only owner faculty can edit
    if (report.facultyId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden. You are not the owner of this report.' });
    }

    // Map fields
    const allowedUpdates = [
      'courseName',
      'month',
      'year',
      'totalClasses',
      'attendedClasses',
      'attendancePercentage',
      'subjects',
      'remarks',
      'performanceGrade',
      'behaviorComment',
      'improvementSuggestions',
    ];

    allowedUpdates.forEach((field) => {
      if (updateFields[field] !== undefined) {
        report[field] = updateFields[field];
      }
    });

    report.lastUpdatedAt = Date.now();
    const updatedReport = await report.save();
    res.json(updatedReport);
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ message: 'Internal server error updating report.' });
  }
};

// Publish a report (Faculty owner only)
export const publishReport = async (req, res) => {
  const { id } = req.params;

  try {
    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    // Only owner faculty can publish
    if (report.facultyId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden. You are not the owner of this report.' });
    }

    report.status = 'published';
    report.lastUpdatedAt = Date.now();
    const publishedReport = await report.save();
    res.json(publishedReport);
  } catch (error) {
    console.error('Publish report error:', error);
    res.status(500).json({ message: 'Internal server error publishing report.' });
  }
};

// Fetch reports created by current faculty user
export const fetchFacultyReports = async (req, res) => {
  try {
    const reports = await Report.find({ facultyId: req.user.id }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    console.error('Fetch faculty reports error:', error);
    res.status(500).json({ message: 'Internal server error fetching reports.' });
  }
};

// Fetch a student's published reports (Student fetches own, Admin fetches all)
export const fetchStudentReport = async (req, res) => {
  const { id } = req.params;

  // Authorization check
  const isSelf = req.user.id === id;
  const isAdmin = req.user.role === 'admin';

  if (!isSelf && !isAdmin) {
    return res.status(403).json({ message: 'Forbidden. You can only view your own reports.' });
  }

  try {
    const reports = await Report.find({ studentId: id, status: 'published' }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    console.error('Fetch student report error:', error);
    res.status(500).json({ message: 'Internal server error fetching student reports.' });
  }
};

// Delete a report (Owner faculty or admin can delete)
export const deleteReport = async (req, res) => {
  const { id } = req.params;

  try {
    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    const isOwner = report.facultyId.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden. Only the owner or admin can delete this report.' });
    }

    await Report.findByIdAndDelete(id);
    res.json({ message: 'Report deleted successfully.' });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ message: 'Internal server error deleting report.' });
  }
};

// Helper: List active students for dropdown selector (Faculty/Admin only)
export const getStudentsList = async (req, res) => {
  try {
    const students = await User.find({ role: 'student', status: 'active' })
      .select('name email')
      .sort({ name: 1 });
    res.json(students);
  } catch (error) {
    console.error('Fetch student list error:', error);
    res.status(500).json({ message: 'Internal server error fetching students list.' });
  }
};

// Helper: Query dynamic attendance statistics (Faculty/Admin only)
export const calculateAttendanceStats = async (req, res) => {
  const { studentId, month, year } = req.query;

  if (!studentId || !month || !year) {
    return res.status(400).json({ message: 'studentId, month, and year are required.' });
  }

  try {
    const yearNum = parseInt(year, 10);
    const monthIndex = getMonthIndex(month);

    if (monthIndex === null || isNaN(yearNum)) {
      return res.status(400).json({ message: 'Invalid month or year format.' });
    }

    const startDate = new Date(yearNum, monthIndex, 1);
    const endDate = new Date(yearNum, monthIndex + 1, 0, 23, 59, 59, 999);

    const records = await Attendance.find({
      student: studentId,
      date: { $gte: startDate, $lte: endDate },
    });

    const totalClasses = records.length;
    const attendedClasses = records.filter((r) => r.status === 'Present').length;
    const attendancePercentage = totalClasses > 0 ? parseFloat(((attendedClasses / totalClasses) * 100).toFixed(2)) : 0;

    res.json({
      totalClasses,
      attendedClasses,
      attendancePercentage,
    });
  } catch (error) {
    console.error('Calculate attendance stats error:', error);
    res.status(500).json({ message: 'Internal server error calculating attendance stats.' });
  }
};
