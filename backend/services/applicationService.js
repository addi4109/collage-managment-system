import Application from '../models/Application.js';
import { logActivity } from './auditService.js';
import { createNotification } from './notificationService.js';

export const createApplication = async (appData, requestUser) => {
  const { type, description, attachments } = appData;

  const application = new Application({
    applicantId: requestUser.id,
    applicantName: requestUser.name,
    applicantRole: requestUser.role,
    type,
    description,
    departmentId: requestUser.role === 'student' ? requestUser.departmentId : requestUser.assignedDepartments[0],
    year: requestUser.role === 'student' ? requestUser.year : requestUser.assignedYears[0] || 'First Year',
    semester: requestUser.role === 'student' ? requestUser.semester : 'Sem 1',
    attachments: attachments || [],
    status: 'pending',
  });

  return await application.save();
};

export const getPendingApplications = async (departmentId = null) => {
  const query = { status: 'pending', isDeleted: false };
  if (departmentId) {
    query.departmentId = departmentId;
  }
  return await Application.find(query)
    .populate('departmentId', 'name code')
    .sort({ createdAt: -1 });
};

export const getMyApplications = async (userId) => {
  return await Application.find({ applicantId: userId, isDeleted: false })
    .populate('departmentId', 'name code')
    .sort({ createdAt: -1 });
};

export const reviewApplication = async (applicationId, status, remarks, adminId, ipAddress) => {
  const app = await Application.findOne({ _id: applicationId, status: 'pending', isDeleted: false });
  if (!app) {
    throw new Error('Pending application not found.');
  }

  app.status = status;
  app.remarks = remarks || '';
  await app.save();

  await createNotification(
    app.applicantId,
    `Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    `Your request of type [${app.type}] has been ${status}. Remarks: ${remarks || 'None'}`,
    'APPLICATION'
  );

  await logActivity({
    action: `APPLICATION_${status.toUpperCase()}`,
    performedBy: adminId,
    targetId: app.applicantId,
    details: `${status} application request of type [${app.type}] by ${app.applicantName}. Remarks: ${remarks}`,
    ipAddress,
  });

  return app;
};
