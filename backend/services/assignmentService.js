import Assignment from '../models/Assignment.js';
import AssignmentSubmission from '../models/AssignmentSubmission.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import { createNotification } from './notificationService.js';
import { logActivity } from './activityLogService.js';

export const createAssignment = async (assignmentData, creatorId) => {
  const {
    title,
    description,
    departmentId,
    year,
    semester,
    subjectId,
    dueDate,
    maxMarks,
    attachments,
    allowLateSubmission,
    latePenaltyMarks,
    published,
    maxAttempts,
  } = assignmentData;

  const assignment = new Assignment({
    title,
    description,
    departmentId,
    year,
    semester,
    subjectId,
    dueDate: new Date(dueDate),
    maxMarks: maxMarks || 20,
    attachments: attachments || [],
    createdBy: creatorId,
    allowLateSubmission: allowLateSubmission !== undefined ? allowLateSubmission : true,
    latePenaltyMarks: latePenaltyMarks || 0,
    published: published !== undefined ? published : false,
    maxAttempts: maxAttempts || 3,
  });

  await assignment.save();
  await logActivity(creatorId, 'CREATE_ASSIGNMENT', 'Assignment', `Created assignment: ${title}`);

  // Send notifications to students in that batch if published
  if (published) {
    const students = await Student.find({ departmentId, year, semester, isDeleted: false });
    for (const student of students) {
      await createNotification(
        student.userId,
        'New Assignment Published',
        `A new assignment "${title}" has been published. Due date: ${new Date(dueDate).toLocaleDateString()}`,
        'Exam Scheduled'
      );
    }
  }

  return assignment;
};

export const getAssignments = async (user) => {
  if (user.role === 'student') {
    const studentProfile = await Student.findOne({ userId: user.id, isDeleted: false });
    if (!studentProfile) {
      throw new Error('Student profile not found.');
    }

    const assignments = await Assignment.find({
      departmentId: studentProfile.departmentId,
      year: studentProfile.year,
      semester: studentProfile.semester,
      published: true,
      isDeleted: false,
    })
      .populate('createdBy', 'name email')
      .populate('subjectId', 'name code')
      .populate('departmentId', 'name code')
      .sort({ dueDate: 1 });

    // For each assignment, grab the student's submissions
    const enrichedAssignments = [];
    for (const assignment of assignments) {
      const submissions = await AssignmentSubmission.find({
        assignmentId: assignment._id,
        studentId: user.id,
      }).sort({ attemptNumber: -1 });

      enrichedAssignments.push({
        assignment,
        submissions,
        attemptsUsed: submissions.length,
        maxAttempts: assignment.maxAttempts,
      });
    }

    return enrichedAssignments;
  } else if (user.role === 'faculty') {
    const assignments = await Assignment.find({
      createdBy: user.id,
      isDeleted: false,
    })
      .populate('subjectId', 'name code')
      .populate('departmentId', 'name code')
      .sort({ createdAt: -1 });

    return assignments;
  } else {
    // Admin
    const assignments = await Assignment.find({ isDeleted: false })
      .populate('createdBy', 'name email')
      .populate('subjectId', 'name code')
      .populate('departmentId', 'name code')
      .sort({ createdAt: -1 });

    return assignments;
  }
};

export const getAssignmentSubmissions = async (assignmentId, user) => {
  const assignment = await Assignment.findOne({ _id: assignmentId, isDeleted: false });
  if (!assignment) {
    throw new Error('Assignment not found or deleted.');
  }

  // Verify authorization: admin or the faculty who created it
  if (user.role !== 'admin' && assignment.createdBy.toString() !== user.id) {
    throw new Error('Unauthorized access to assignment submissions.');
  }

  const submissions = await AssignmentSubmission.find({ assignmentId })
    .populate('studentId', 'name email')
    .sort({ submittedAt: -1 });

  // Enrich with student profile info (rollNumber, enrollmentNumber)
  const enrichedSubmissions = [];
  for (const sub of submissions) {
    const studentProfile = await Student.findOne({ userId: sub.studentId._id, isDeleted: false });
    enrichedSubmissions.push({
      ...sub.toObject(),
      studentProfile: studentProfile
        ? { rollNumber: studentProfile.rollNumber, enrollmentNumber: studentProfile.enrollmentNumber }
        : null,
    });
  }

  return enrichedSubmissions;
};

export const submitAssignment = async (assignmentId, studentUserId, fileUrl, fileName) => {
  const assignment = await Assignment.findOne({ _id: assignmentId, isDeleted: false });
  if (!assignment) {
    throw new Error('Assignment not found.');
  }

  if (!assignment.published) {
    throw new Error('Assignment is not published yet.');
  }

  const now = new Date();
  if (now > assignment.dueDate) {
    if (!assignment.allowLateSubmission) {
      throw new Error('Late submission is not allowed for this assignment.');
    }
  }

  // Check attempts
  const submissionsCount = await AssignmentSubmission.countDocuments({
    assignmentId,
    studentId: studentUserId,
  });

  if (submissionsCount >= assignment.maxAttempts) {
    throw new Error(`Maximum attempts (${assignment.maxAttempts}) reached.`);
  }

  const attemptNumber = submissionsCount + 1;

  const submission = new AssignmentSubmission({
    assignmentId,
    studentId: studentUserId,
    fileUrl,
    fileName,
    submittedAt: now,
    attemptNumber,
    status: 'submitted',
  });

  await submission.save();
  await logActivity(studentUserId, 'SUBMIT_ASSIGNMENT', 'Assignment', `Submitted attempt ${attemptNumber} for assignment: ${assignment.title}`);

  // Notify faculty who created it
  await createNotification(
    assignment.createdBy,
    'Assignment Submitted',
    `A student has submitted attempt ${attemptNumber} for "${assignment.title}".`,
    'Attendance Session Open'
  );

  return submission;
};

export const gradeSubmission = async (submissionId, facultyUserId, marks, remarks, userRole) => {
  const submission = await AssignmentSubmission.findById(submissionId).populate('assignmentId');
  if (!submission) {
    throw new Error('Submission not found.');
  }

  const assignment = submission.assignmentId;
  if (userRole !== 'admin' && assignment.createdBy.toString() !== facultyUserId) {
    throw new Error('Unauthorized to grade this assignment submission.');
  }

  if (marks < 0 || marks > assignment.maxMarks) {
    throw new Error(`Marks must be between 0 and ${assignment.maxMarks}.`);
  }

  submission.marks = marks;
  submission.remarks = remarks || '';
  submission.status = 'graded';
  await submission.save();

  await logActivity(
    facultyUserId,
    'GRADE_ASSIGNMENT',
    'Assignment',
    `Graded submission ${submissionId} with marks ${marks}`
  );

  // Notify student
  await createNotification(
    submission.studentId,
    'Assignment Graded',
    `Your submission for "${assignment.title}" has been graded. Marks: ${marks}/${assignment.maxMarks}`,
    'Result Declared'
  );

  return submission;
};

export const deleteAssignment = async (assignmentId, userId, userRole) => {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    throw new Error('Assignment not found.');
  }

  if (userRole !== 'admin' && assignment.createdBy.toString() !== userId) {
    throw new Error('Unauthorized to delete this assignment.');
  }

  assignment.isDeleted = true;
  assignment.deletedAt = new Date();
  await assignment.save();

  await logActivity(userId, 'DELETE_ASSIGNMENT', 'Assignment', `Deleted assignment: ${assignment.title}`);
  return { success: true };
};
