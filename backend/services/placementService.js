import PlacementDrive from '../models/PlacementDrive.js';
import PlacementApplication from '../models/PlacementApplication.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import { createNotification } from './notificationService.js';
import { logActivity } from './activityLogService.js';

export const createPlacementDrive = async (driveData, creatorId) => {
  const { companyName, role, package: ctcPackage, eligibilityCriteria, skillsRequired, deadline, departmentIds, placementYear } = driveData;

  const drive = new PlacementDrive({
    companyName,
    role,
    package: ctcPackage,
    eligibilityCriteria: eligibilityCriteria || 0,
    skillsRequired: skillsRequired || [],
    deadline: new Date(deadline),
    departmentIds,
    placementYear: placementYear || '2027',
    createdBy: creatorId,
  });

  await drive.save();
  await logActivity(creatorId, 'CREATE_PLACEMENT_DRIVE', 'Placement', `Created drive: ${companyName} (${role})`);

  return drive;
};

export const publishDriveToDepartment = async (driveId, user) => {
  const drive = await PlacementDrive.findById(driveId);
  if (!drive) throw new Error('Placement drive not found.');

  // Check if HOD belongs to one of the assigned departments
  const hodDepartmentId = user.departmentId;
  if (!hodDepartmentId) throw new Error('You do not belong to a department.');
  
  if (!drive.departmentIds.includes(hodDepartmentId)) {
    throw new Error('This placement drive is not assigned to your department.');
  }

  if (drive.publishedByDepartments.includes(hodDepartmentId)) {
    throw new Error('Already published for your department.');
  }

  drive.publishedByDepartments.push(hodDepartmentId);
  await drive.save();

  // Notify students
  const students = await Student.find({ departmentId: hodDepartmentId, isDeleted: false });
  for (const s of students) {
    await createNotification(
      s.userId,
      'New Placement Drive Published',
      `${drive.companyName} is recruiting for the role of ${drive.role} with package ${drive.package} LPA. Apply before ${new Date(drive.deadline).toLocaleDateString()}`,
      'BusinessCenterIcon' // arbitrary notification icon
    );
  }

  return drive;
};

export const getPlacementDrives = async (user) => {
  const query = { isDeleted: false };

  if (user.role === 'student') {
    const student = await Student.findOne({ userId: user.id, isDeleted: false });
    if (!student) {
      throw new Error('Student profile not found.');
    }
    // Only show drives published to the student's department
    query.publishedByDepartments = student.departmentId;

    const drives = await PlacementDrive.find(query)
      .populate('departmentIds', 'name code')
      .populate('publishedByDepartments', 'name code')
      .sort({ deadline: 1 });

    const enrichedDrives = [];
    for (const d of drives) {
      const application = await PlacementApplication.findOne({ driveId: d._id, studentId: user.id });
      enrichedDrives.push({
        drive: d,
        application,
        isEligible: true,
        cgpaMet: true,
      });
    }
    return enrichedDrives;
  } else if (user.role === 'hod') {
    const hodDepartmentId = user.departmentId;
    if (hodDepartmentId) {
      query.departmentIds = hodDepartmentId;
    }
    return await PlacementDrive.find(query)
      .populate('departmentIds', 'name code')
      .populate('publishedByDepartments', 'name code')
      .sort({ createdAt: -1 });
  } else {
    // Principal
    return await PlacementDrive.find(query)
      .populate('departmentIds', 'name code')
      .populate('publishedByDepartments', 'name code')
      .sort({ createdAt: -1 });
  }
};

export const applyToPlacementDrive = async (driveId, studentUserId, resumeUrl, resumeFileName, cgpa) => {
  const drive = await PlacementDrive.findOne({ _id: driveId, isDeleted: false });
  if (!drive) {
    throw new Error('Placement drive not found.');
  }

  if (new Date() > drive.deadline) {
    throw new Error('Application deadline has passed.');
  }

  if (cgpa < drive.eligibilityCriteria) {
    throw new Error(`Your CGPA (${cgpa}) does not meet the minimum eligibility criteria of ${drive.eligibilityCriteria}.`);
  }

  // Check if already applied
  const existingApp = await PlacementApplication.findOne({ driveId, studentId: studentUserId });
  if (existingApp) {
    throw new Error('You have already applied to this placement drive.');
  }

  // Setup default interview rounds
  const rounds = [
    { roundName: 'Aptitude', status: 'pending' },
    { roundName: 'Technical Interview', status: 'pending' },
    { roundName: 'HR Interview', status: 'pending' },
  ];

  const application = new PlacementApplication({
    driveId,
    studentId: studentUserId,
    cgpa,
    resumeUrl,
    resumeFileName,
    status: 'applied',
    rounds,
  });

  await application.save();
  await logActivity(studentUserId, 'APPLY_PLACEMENT_DRIVE', 'Placement', `Applied to ${drive.companyName} placement drive`);

  // Notify admin/creators
  await createNotification(
    drive.createdBy,
    'Placement Application Received',
    `A new application has been submitted for ${drive.companyName} - ${drive.role}.`,
    'Attendance Session Open'
  );

  return application;
};

export const getDriveApplications = async (driveId, user) => {
  const drive = await PlacementDrive.findOne({ _id: driveId, isDeleted: false });
  if (!drive) {
    throw new Error('Placement drive not found.');
  }

  if (user.role === 'hod' && !drive.departmentIds.includes(user.departmentId)) {
    throw new Error('Unauthorized to view this drive applications.');
  }

  const applications = await PlacementApplication.find({ driveId })
    .populate('studentId', 'name email')
    .sort({ uploadedAt: -1 });

  const enriched = [];
  for (const app of applications) {
    const student = await Student.findOne({ userId: app.studentId._id, isDeleted: false })
      .populate('departmentId', 'name code');
      
    if (user.role === 'hod') {
      if (student && student.departmentId && student.departmentId._id.toString() === user.departmentId) {
        enriched.push({
          application: app,
          studentDetails: student,
        });
      }
    } else {
      enriched.push({
        application: app,
        studentDetails: student,
      });
    }
  }

  return enriched;
};

export const updateApplicationStatus = async (applicationId, updateData, userId, userRole, userDept) => {
  const application = await PlacementApplication.findById(applicationId).populate('driveId');
  if (!application) {
    throw new Error('Placement application not found.');
  }

  // Security check: Only principal or the student's HOD can verify/update.
  if (userRole === 'hod') {
    const student = await Student.findOne({ userId: application.studentId, isDeleted: false });
    if (!student || student.departmentId.toString() !== userDept) {
      throw new Error('Unauthorized to modify this application status.');
    }
  }

  const { status, rounds, offerLetterUrl } = updateData;

  if (status) application.status = status;
  if (rounds) application.rounds = rounds;
  if (offerLetterUrl !== undefined) application.offerLetterUrl = offerLetterUrl;

  await application.save();

  await logActivity(
    facultyUserId,
    'UPDATE_PLACEMENT_APP',
    'Placement',
    `Updated application status for student ${application.studentId} to ${status}`
  );

  // Notify Student
  let notifMsg = `Your placement application for ${drive.companyName} status has been updated to ${status.replace('_', ' ')}.`;
  if (status === 'selected') {
    notifMsg = `Congratulations! You have been selected at ${drive.companyName} for the ${drive.role} role!`;
  }
  await createNotification(application.studentId, 'Placement Status Update', notifMsg, 'Result Declared');

  return application;
};

export const getPlacementAnalytics = async () => {
  const drives = await PlacementDrive.find({ isDeleted: false });
  const applications = await PlacementApplication.find();
  const selectedApps = await PlacementApplication.find({ status: 'selected' }).populate('driveId');

  const selectedPackages = selectedApps.map(a => a.driveId.package || 0);
  const highestPackage = selectedPackages.length > 0 ? Math.max(...selectedPackages) : 0;
  const averagePackage = selectedPackages.length > 0
    ? Number((selectedPackages.reduce((a, b) => a + b, 0) / selectedPackages.length).toFixed(2))
    : 0;

  return {
    totalDrives: drives.length,
    totalApplications: applications.length,
    placedCount: selectedApps.length,
    highestPackage,
    averagePackage,
  };
};

export const deletePlacementDrive = async (driveId, userId, userRole) => {
  const drive = await PlacementDrive.findById(driveId);
  if (!drive) {
    throw new Error('Placement drive not found.');
  }

  if (userRole !== 'admin' && drive.createdBy.toString() !== userId) {
    throw new Error('Unauthorized to delete this drive.');
  }

  drive.isDeleted = true;
  await drive.save();

  await logActivity(userId, 'DELETE_PLACEMENT_DRIVE', 'Placement', `Deleted placement drive: ${drive.companyName}`);
  return { success: true };
};
