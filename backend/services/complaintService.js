import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import { createNotification, createRoleNotifications } from './notificationService.js';
import { logActivity } from './activityLogService.js';

export const fileComplaint = async (complaintData, studentUserId) => {
  const { type, priority, description, attachments, targetId } = complaintData;

  const complaint = new Complaint({
    studentId: studentUserId,
    type,
    priority: priority || 'low',
    description,
    attachments: attachments || [],
    targetId: targetId || null,
    status: 'open',
  });

  await complaint.save();
  await logActivity(studentUserId, 'FILE_COMPLAINT', 'Complaint', `Filed complaint of type ${type}`);

  // Notify admin role
  await createRoleNotifications(
    'admin',
    'New Grievance Filed',
    `A new ${priority} priority ${type} complaint has been filed.`,
    'Exam Scheduled'
  );

  return complaint;
};

export const getComplaints = async (user) => {
  const query = {};

  if (user.role === 'student') {
    query.studentId = user.id;
  } else if (user.role === 'faculty') {
    // Faculty can view complaints targetted at them
    query.targetId = user.id;
  }

  return await Complaint.find(query)
    .populate('studentId', 'name email')
    .populate('targetId', 'name email')
    .sort({ createdAt: -1 });
};

export const resolveComplaint = async (complaintId, updateData, adminUserId) => {
  const complaint = await Complaint.findById(complaintId);
  if (!complaint) {
    throw new Error('Complaint not found.');
  }

  const { status, remarks } = updateData;

  if (status) {
    complaint.status = status;
    if (status === 'resolved') {
      complaint.resolvedAt = new Date();
    }
  }
  if (remarks !== undefined) {
    complaint.remarks = remarks;
  }

  await complaint.save();
  await logActivity(adminUserId, 'RESOLVE_COMPLAINT', 'Complaint', `Resolved/updated complaint: ${complaintId} status to ${status}`);

  // Notify student
  await createNotification(
    complaint.studentId,
    'Grievance Status Updated',
    `Your grievance ticket status has been updated to ${status}. Admin remarks: ${remarks || 'None'}`,
    'Result Declared'
  );

  return complaint;
};
