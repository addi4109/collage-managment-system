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

  // Dispatch notifications to students in matching departments
  const students = await Student.find({ departmentId: { $in: departmentIds }, isDeleted: false });
  for (const s of students) {
    await createNotification(
      s.userId,
      'New Placement Drive',
      `${companyName} is recruiting for the role of ${role} with package ${ctcPackage} LPA. Apply before ${new Date(deadline).toLocaleDateString()}`,
      'Exam Scheduled'
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
    // Only show drives targeted at the student's department
    query.departmentIds = student.departmentId;

    const drives = await PlacementDrive.find(query)
      .populate('departmentIds', 'name code')
      .sort({ deadline: 1 });

    const enrichedDrives = [];
    for (const d of drives) {
      const application = await PlacementApplication.findOne({ driveId: d._id, studentId: user.id });
      enrichedDrives.push({
        drive: d,
        application,
        isEligible: student.userId ? true : false, // We'll double-check CGPA on submit, but show indicator
        cgpaMet: student.userId ? true : false, // Mock check or placeholder
      });
    }
    return enrichedDrives;
  } else {
    // Admin / Faculty
    return await PlacementDrive.find(query)
      .populate('departmentIds', 'name code')
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

  if (user.role !== 'admin' && drive.createdBy.toString() !== user.id) {
    throw new Error('Unauthorized to view this drive applications.');
  }

  const applications = await PlacementApplication.find({ driveId })
    .populate('studentId', 'name email')
    .sort({ uploadedAt: -1 });

  const enriched = [];
  for (const app of applications) {
    const student = await Student.findOne({ userId: app.studentId._id, isDeleted: false })
      .populate('departmentId', 'name code');
    enriched.push({
      application: app,
      studentDetails: student,
    });
  }

  return enriched;
};

export const updateApplicationStatus = async (applicationId, updateData, facultyUserId, userRole) => {
  const application = await PlacementApplication.findById(applicationId).populate('driveId');
  if (!application) {
    throw new Error('Placement application not found.');
  }

  const drive = application.driveId;
  if (userRole !== 'admin' && drive.createdBy.toString() !== facultyUserId) {
    throw new Error('Unauthorized to modify this application status.');
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
