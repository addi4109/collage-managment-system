import MonthlyReport from '../models/MonthlyReport.js';
import Student from '../models/Student.js';
import { createNotification } from './notificationService.js';
import { logActivity } from './activityLogService.js';

export const createOrUpdateReport = async (reportData, creatorId) => {
  const {
    studentId,
    month,
    attendance,
    discipline,
    participation,
    behavior,
    punctuality,
    subjects,
    remarks,
    published,
  } = reportData;

  let report = await MonthlyReport.findOne({ studentId, month });

  if (report) {
    report.attendance = attendance;
    report.discipline = discipline || 'Good';
    report.participation = participation;
    report.behavior = behavior;
    report.punctuality = punctuality;
    report.subjects = subjects || [];
    report.remarks = remarks || '';
    if (published !== undefined) report.published = published;
  } else {
    report = new MonthlyReport({
      studentId,
      month,
      attendance,
      discipline: discipline || 'Good',
      participation,
      behavior,
      punctuality,
      subjects: subjects || [],
      remarks: remarks || '',
      createdBy: creatorId,
      published: published !== undefined ? published : false,
    });
  }

  await report.save();
  await logActivity(creatorId, 'SAVE_MONTHLY_REPORT', 'MonthlyReport', `Saved monthly report for student ${studentId} in month ${month}`);

  if (report.published) {
    await createNotification(
      studentId,
      'Monthly Report Card Published',
      `Your performance report card for ${month} has been published.`,
      'Result Declared'
    );
  }

  return report;
};

export const getReports = async (user, studentId, month) => {
  const query = {};

  if (user.role === 'student') {
    query.studentId = user.id;
    query.published = true;
  } else {
    // Faculty or Admin
    if (studentId) query.studentId = studentId;
    if (month) query.month = month;
  }

  return await MonthlyReport.find(query)
    .populate('studentId', 'name email')
    .sort({ month: -1 });
};

export const parentSignReport = async (reportId, remarks, userId) => {
  const report = await MonthlyReport.findById(reportId);
  if (!report) {
    throw new Error('Report card not found.');
  }

  // Verify this belongs to the student if the role is student (representing parent/student view)
  if (report.studentId.toString() !== userId) {
    throw new Error('Unauthorized to sign this report card.');
  }

  report.parentViewed = true;
  report.parentRemarks = remarks || '';
  await report.save();

  await logActivity(userId, 'SIGN_MONTHLY_REPORT', 'MonthlyReport', `Signed monthly report ${reportId}`);

  // Notify creator/faculty
  await createNotification(
    report.createdBy,
    'Report Card Signed',
    `A parent has signed the report card of student for ${report.month}.`,
    'Fee Due'
  );

  return report;
};

export const publishReport = async (reportId, userId, userRole) => {
  const report = await MonthlyReport.findById(reportId);
  if (!report) {
    throw new Error('Report card not found.');
  }

  if (userRole !== 'admin' && report.createdBy.toString() !== userId) {
    throw new Error('Forbidden: You can only publish reports created by yourself.');
  }

  report.published = true;
  await report.save();

  await createNotification(
    report.studentId,
    'Monthly Report Card Published',
    `Your performance report card for ${report.month} has been published.`,
    'Result Declared'
  );

  await logActivity(userId, 'PUBLISH_MONTHLY_REPORT', 'MonthlyReport', `Published report ${reportId}`);
  return report;
};
