import Application from '../models/Application.js';
import User from '../models/User.js';
import HOD from '../models/HOD.js';
import { logActivity } from './auditService.js';
import { createNotification, createRoleNotifications } from './notificationService.js';

export const createApplication = async (appData, requestUser) => {
  const { type, description, attachments } = appData;

  const application = new Application({
    applicantId: requestUser.id,
    applicantName: requestUser.name,
    applicantRole: requestUser.role,
    type,
    description,
    departmentId: requestUser.role === 'faculty' ? requestUser.assignedDepartments[0] : requestUser.departmentId,
    year: requestUser.role === 'student' ? requestUser.year : (requestUser.assignedYears?.[0] || 'First Year'),
    semester: requestUser.role === 'student' ? requestUser.semester : 'Sem 1',
    attachments: attachments || [],
    status: requestUser.role === 'hod' ? 'pending_principal' : 'pending_hod',
  });

  const savedApplication = await application.save();

  // Notify Approver
  if (savedApplication.status === 'pending_hod') {
    const hod = await HOD.findOne({ departmentId: savedApplication.departmentId, isDeleted: false });
    if (hod) {
      await createNotification(
        hod.userId,
        'New Application Received',
        `A new ${savedApplication.type} application was submitted by ${savedApplication.applicantName} and requires your approval.`,
        'APPLICATION',
        requestUser.id
      );
    }
  } else if (savedApplication.status === 'pending_principal') {
    await createRoleNotifications(
      'principal',
      'New Application Received',
      `A new ${savedApplication.type} application was submitted by ${savedApplication.applicantName} and requires your approval.`,
      'APPLICATION',
      requestUser.id
    );
  }

  return savedApplication;
};

export const getPendingApplications = async (departmentId = null, role = 'principal') => {
  const statusFilter = role === 'hod' ? 'pending_hod' : 'pending_principal';
  const query = { status: statusFilter, isDeleted: false };
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

export const reviewApplication = async (applicationId, status, remarks, adminId, ipAddress, adminRole) => {
  const app = await Application.findOne({ 
    _id: applicationId, 
    status: { $in: ['pending_hod', 'pending_principal'] }, 
    isDeleted: false 
  });
  
  if (!app) {
    throw new Error('Pending application not found.');
  }

  let finalStatus = status; // 'approved' or 'rejected'

  if (status === 'approved' && adminRole === 'hod' && app.applicantRole === 'faculty') {
    finalStatus = 'pending_principal';
  }

  app.status = finalStatus;
  app.remarks = remarks || '';
  await app.save();

  // If forwarded to Principal, notify Principal
  if (finalStatus === 'pending_principal') {
    await createRoleNotifications(
      'principal',
      'Application Forwarded',
      `A ${app.type} application by faculty ${app.applicantName} was approved by their HOD and now requires your final approval.`,
      'APPLICATION',
      adminId
    );
  }

  // Only notify applicant if final status is reached (approved/rejected)
  if (finalStatus === 'approved' || finalStatus === 'rejected') {
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
