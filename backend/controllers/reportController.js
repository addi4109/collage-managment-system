import * as analyticsService from '../services/analyticsService.js';
import * as reportService from '../services/reportService.js';

export const getDashboardAnalytics = async (req, res) => {
  try {
    let stats;
    if (req.user.role === 'principal') {
      stats = await analyticsService.getAdminStats();
    } else if (req.user.role === 'faculty') {
      stats = await analyticsService.getFacultyStats(req.user.id, req.user);
    } else if (req.user.role === 'student') {
      stats = await analyticsService.getStudentStats(req.user.id);
    } else {
      return res.status(400).json({ message: 'Unknown role portal.' });
    }
    res.status(200).json(stats);
  } catch (err) {
    console.error('Analytics error:', err.message);
    res.status(500).json({ message: err.message || 'Error compiling dashboard analytics.' });
  }
};

export const downloadStudentsReport = async (req, res) => {
  try {
    const { departmentId, year, semester } = req.query;
    const csv = await reportService.exportStudentsReport(departmentId, year, semester, req.user);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=students_report.csv');
    res.status(200).send(csv);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const downloadAttendanceReport = async (req, res) => {
  try {
    const { departmentId, year, semester, subjectId } = req.query;
    const csv = await reportService.exportAttendanceReport(departmentId, year, semester, subjectId, req.user);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance_report.csv');
    res.status(200).send(csv);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const downloadPerformanceReport = async (req, res) => {
  try {
    const { departmentId, year, semester } = req.query;
    if (!departmentId || !year || !semester) {
      return res.status(400).json({ message: 'departmentId, year, and semester query parameters are required.' });
    }
    const csv = await reportService.exportPerformanceReport(departmentId, year, semester);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=performance_report.csv');
    res.status(200).send(csv);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
