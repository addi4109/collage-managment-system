import Student from '../models/Student.js';
import User from '../models/User.js';
import AttendanceSession from '../models/AttendanceSession.js';
import Attendance from '../models/Attendance.js';
import ResultBatch from '../models/ResultBatch.js';
import Subject from '../models/Subject.js';

// Helper to convert arrays of objects to CSV string
const jsonToCSV = (headers, rows) => {
  const csvLines = [];
  csvLines.push(headers.join(','));

  rows.forEach(row => {
    const escapedRow = row.map(val => {
      const stringVal = val === null || val === undefined ? '' : String(val);
      // Escape double quotes and wrap in quotes if commas exist
      const cleanVal = stringVal.replace(/"/g, '""');
      return cleanVal.includes(',') || cleanVal.includes('\n') || cleanVal.includes('"')
        ? `"${cleanVal}"`
        : cleanVal;
    });
    csvLines.push(escapedRow.join(','));
  });

  return csvLines.join('\n');
};

export const exportStudentsReport = async (departmentId, year, semester, requestUser) => {
  const query = { isDeleted: false };
  if (departmentId) query.departmentId = departmentId;
  if (year) query.year = year;
  if (semester) query.semester = semester;

  // Apply Faculty scopes
  if (requestUser.role === 'faculty') {
    query.departmentId = { $in: requestUser.assignedDepartments };
    query.year = { $in: requestUser.assignedYears };
  }

  const students = await Student.find(query)
    .populate('userId', 'name email username')
    .populate('departmentId', 'name')
    .sort({ rollNumber: 1 });

  const headers = ['Roll Number', 'Enrollment Number', 'Student Name', 'Email', 'Phone', 'Parent Name', 'Parent Mobile', 'Address', 'Year', 'Semester'];
  const rows = students.map(s => [
    s.rollNumber,
    s.enrollmentNumber,
    s.userId?.name || 'N/A',
    s.userId?.email || 'N/A',
    s.phone || '',
    s.parentName || '',
    s.parentMobile || '',
    s.address || '',
    s.year,
    s.semester,
  ]);

  return jsonToCSV(headers, rows);
};

export const exportAttendanceReport = async (departmentId, year, semester, subjectId, requestUser) => {
  const query = {};
  if (departmentId) query.departmentId = departmentId;
  if (year) query.year = year;
  if (semester) query.semester = semester;
  if (subjectId) query.subjectId = subjectId;

  // Apply Faculty scopes
  if (requestUser.role === 'faculty') {
    query.departmentId = { $in: requestUser.assignedDepartments };
    query.year = { $in: requestUser.assignedYears };
  }

  const sessions = await AttendanceSession.find(query)
    .populate('subjectId', 'name code')
    .populate('departmentId', 'name')
    .sort({ date: -1 });

  const headers = ['Date', 'Start Time', 'Duration (min)', 'Department', 'Year', 'Semester', 'Subject Code', 'Subject Name', 'Present Count'];
  
  const rows = [];
  for (const s of sessions) {
    const presentCount = await Attendance.countDocuments({ sessionId: s._id });
    rows.push([
      new Date(s.date).toLocaleDateString(),
      s.startTime,
      s.duration,
      s.departmentId.name,
      s.year,
      s.semester,
      s.subjectId.code,
      s.subjectId.name,
      presentCount,
    ]);
  }

  return jsonToCSV(headers, rows);
};

export const exportPerformanceReport = async (departmentId, year, semester) => {
  const batch = await ResultBatch.findOne({ departmentId, year, semester, status: 'declared' })
    .populate('departmentId', 'name')
    .populate('results.subjectId', 'name code');

  const headers = ['Student Name', 'Roll Number', 'Subject Code', 'Subject Name', 'Internal Marks (20)', 'Practical Marks (30)', 'Theory Marks (80)', 'Total Marks (130)', 'Percentage (%)', 'Grade', 'GP', 'Status', 'Remarks'];
  
  if (!batch) {
    return jsonToCSV(headers, [['No declared result batch found for this scope.']]);
  }

  const rows = [];
  for (const r of batch.results) {
    const user = await User.findById(r.studentId);
    const student = await Student.findOne({ userId: r.studentId });

    rows.push([
      user ? user.name : 'Unknown',
      student ? student.rollNumber : 'N/A',
      r.subjectId.code,
      r.subjectId.name,
      r.internalMarks,
      r.practicalMarks,
      r.theoryMarks,
      r.totalMarks,
      r.percentage,
      r.grade,
      r.gp,
      r.pass ? 'PASS' : 'FAIL',
      r.remarks || '',
    ]);
  }

  return jsonToCSV(headers, rows);
};
