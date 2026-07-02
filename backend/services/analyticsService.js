import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';
import Admission from '../models/Admission.js';
import AttendanceSession from '../models/AttendanceSession.js';
import Attendance from '../models/Attendance.js';
import Application from '../models/Application.js';
import Exam from '../models/Exam.js';
import Result from '../models/Result.js';
import { getBillingAnalytics, getStudentFeeDetails } from './feeService.js';
import { getStudentAttendanceDetails } from './attendanceService.js';
import { getStudentExams } from './examService.js';
import { getNotices } from './noticeService.js';

export const getAdminStats = async () => {
  const totalStudents = await Student.countDocuments({ isDeleted: false });
  const totalFaculty = await Faculty.countDocuments({ isDeleted: false });
  const pendingApplications = await Application.countDocuments({ status: 'pending', isDeleted: false });

  // 1. Attendance Analytics
  const totalSessions = await AttendanceSession.countDocuments();
  const totalCheckIns = await Attendance.countDocuments();
  let averageAttendance = 100;
  if (totalSessions > 0 && totalStudents > 0) {
    const maxPossibleCheckins = totalSessions * totalStudents;
    averageAttendance = Math.min(100, Math.round((totalCheckIns / maxPossibleCheckins) * 100 * 100) / 100);
  }

  // 2. Billing Analytics
  const billing = await getBillingAnalytics();

  // 3. Exam Stats
  const exams = await Exam.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const examStats = { draft: 0, pending_approval: 0, approved: 0, scheduled: 0, active: 0, ended: 0 };
  exams.forEach(item => {
    if (examStats[item._id] !== undefined) {
      examStats[item._id] = item.count;
    }
  });

  // 4. Result Batch Stats
  const results = await Result.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const resultStats = { draft: 0, submitted: 0, approved: 0, declared: 0 };
  results.forEach(item => {
    if (resultStats[item._id] !== undefined) {
      resultStats[item._id] = item.count;
    }
  });

  return {
    totalStudents,
    totalFaculty,
    pendingApplications,
    averageAttendance,
    billing,
    examStats,
    resultStats,
  };
};

export const getFacultyStats = async (facultyId, requestUser) => {
  const assignedDepts = requestUser.assignedDepartments || [];
  const assignedYears = requestUser.assignedYears || [];

  // Scoped students count
  const myStudents = await Student.countDocuments({
    departmentId: { $in: assignedDepts },
    year: { $in: assignedYears },
    isDeleted: false,
  });

  // Active attendance session count today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activeSessions = await AttendanceSession.find({
    facultyId,
    date: { $gte: today },
    status: 'active',
  });

  const activeSessionsList = [];
  for (const s of activeSessions) {
    const checkinCount = await Attendance.countDocuments({ sessionId: s._id });
    activeSessionsList.push({
      sessionId: s._id,
      subjectName: s.subjectName,
      subjectCode: s.subjectName,
      startTime: s.startTime,
      duration: s.duration,
      checkinCount,
    });
  }

  // Pending admissions requested by this faculty
  const pendingAdmissions = await Admission.countDocuments({
    createdByFaculty: facultyId,
    status: 'pending',
    isDeleted: false,
  });

  // Upcoming scheduled exams created by this faculty
  const upcomingExams = await Exam.find({
    facultyId,
    status: 'scheduled',
    isDeleted: false,
  })
    .populate('subjectId', 'name code')
    .limit(5);

  return {
    myStudents,
    activeSessions: activeSessionsList,
    pendingAdmissions,
    upcomingExams,
  };
};

export const getStudentStats = async (studentId) => {
  const student = await Student.findOne({ userId: studentId, isDeleted: false });
  if (!student) throw new Error('Student profile not found.');

  // 1. Attendance Summary
  const attendance = await getStudentAttendanceDetails(studentId);
  const totalSubjects = attendance.length;
  const avgAttendance = totalSubjects > 0
    ? Math.round(attendance.reduce((acc, curr) => acc + curr.percentage, 0) / totalSubjects)
    : 100;

  // 2. Fees Due Summary
  const feeDetailsList = await getStudentFeeDetails(studentId);
  const feesDue = feeDetailsList.reduce((acc, curr) => acc + (curr.feeDetails.remainingAmount || 0), 0);

  // 3. Upcoming Exams
  const exams = await getStudentExams(studentId);
  const upcomingExams = exams.filter(e => e.exam.status === 'scheduled' || e.exam.status === 'active').slice(0, 5);

  // 4. Recent Notices
  const notices = await getNotices({}, student);
  const recentNotices = notices.slice(0, 5).map(n => ({
    id: n._id,
    title: n.title,
    content: n.content,
    createdAt: n.createdAt,
    facultyName: n.createdBy.name,
  }));

  return {
    attendancePercentage: avgAttendance,
    feesDue,
    upcomingExamsCount: upcomingExams.length,
    upcomingExams,
    recentNotices,
  };
};
