import Scholarship from '../models/Scholarship.js';
import Student from '../models/Student.js';
import { createNotification, createRoleNotifications } from './notificationService.js';
import { logActivity } from './activityLogService.js';

export const applyScholarship = async (scholarshipData, studentUserId) => {
  const { title, amount, type } = scholarshipData;

  const app = new Scholarship({
    studentId: studentUserId,
    title,
    amount,
    type,
    status: 'applied',
  });

  await app.save();
  await logActivity(studentUserId, 'APPLY_SCHOLARSHIP', 'Scholarship', `Applied for ${title} scholarship of amount ${amount}`);

  // Notify admin
  await createRoleNotifications(
    'admin',
    'New Scholarship Application',
    `A new scholarship application for "${title}" has been submitted.`,
    'Exam Scheduled'
  );

  return app;
};

export const getScholarships = async (user) => {
  const query = {};

  if (user.role === 'student') {
    query.studentId = user.id;
  }

  const apps = await Scholarship.find(query)
    .populate('studentId', 'name email')
    .sort({ createdAt: -1 });

  const enriched = [];
  for (const app of apps) {
    const studentProfile = await Student.findOne({ userId: app.studentId._id, isDeleted: false })
      .populate('departmentId', 'name code');
    enriched.push({
      ...app.toObject(),
      studentProfile,
    });
  }

  return enriched;
};

export const updateScholarshipStatus = async (scholarshipId, updateData, adminUserId) => {
  const app = await Scholarship.findById(scholarshipId);
  if (!app) {
    throw new Error('Scholarship application not found.');
  }

  const { status, remarks } = updateData;

  if (status) {
    app.status = status;
    if (status === 'disbursed') {
      app.disbursementDate = new Date();
    }
  }
  if (remarks !== undefined) {
    app.remarks = remarks;
  }

  await app.save();
  await logActivity(adminUserId, 'UPDATE_SCHOLARSHIP_STATUS', 'Scholarship', `Updated scholarship status for ${scholarshipId} to ${status}`);

  // Notify student
  let notifMsg = `Your scholarship application for "${app.title}" has been updated to "${status}".`;
  if (status === 'disbursed') {
    notifMsg = `Congratulations! Scholarship amount of ${app.amount} for "${app.title}" has been disbursed to your account.`;
  }
  await createNotification(app.studentId, 'Scholarship Status Update', notifMsg, 'Result Declared');

  return app;
};
