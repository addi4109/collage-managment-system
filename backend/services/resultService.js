import Result from '../models/Result.js';
import StudentSemesterResult from '../models/StudentSemesterResult.js';
import Student from '../models/Student.js';
import Subject from '../models/Subject.js';
import { logActivity } from './auditService.js';
import { createNotification } from './notificationService.js';

// Grade point and grade calculator
const calculateGradeDetails = (internal, practical, theory) => {
  const totalMarks = Number(internal) + Number(practical) + Number(theory);
  const maxMarks = 130;
  const percentage = Math.round((totalMarks / maxMarks) * 100 * 100) / 100;
  
  // Pass criteria: Total >= 52 (40%) and theory >= 32 (40% of 80)
  const pass = totalMarks >= 52 && theory >= 32;

  let grade = 'F';
  let gp = 0;

  if (pass) {
    if (percentage >= 90) { grade = 'O'; gp = 10; }
    else if (percentage >= 80) { grade = 'A+'; gp = 9; }
    else if (percentage >= 70) { grade = 'A'; gp = 8; }
    else if (percentage >= 60) { grade = 'B+'; gp = 7; }
    else if (percentage >= 50) { grade = 'B'; gp = 6; }
    else { grade = 'C'; gp = 5; }
  }

  return { totalMarks, percentage, grade, gp, pass };
};

export const getStudentsForGrading = async (departmentId, year, semester) => {
  const students = await Student.find({ departmentId, year, semester, isDeleted: false })
    .populate('userId', 'name')
    .sort({ rollNumber: 1 });

  const results = await Result.find({ departmentId, year, semester });

  return students.map(student => {
    const existingResult = results.find(r => r.studentId.toString() === student.userId._id.toString());
    return {
      studentId: student.userId._id,
      name: student.userId.name,
      rollNumber: student.rollNumber,
      status: existingResult ? existingResult.status : 'pending',
    };
  });
};

export const getStudentDraft = async (studentId, departmentId, year, semester) => {
  const student = await Student.findOne({ userId: studentId }).populate('userId', 'name');
  if (!student) throw new Error('Student not found');

  let result = await Result.findOne({ studentId, departmentId, year, semester }).populate('subjects.subjectId', 'name code');
  
  if (!result) {
    // Scaffold new result
    const subjects = await Subject.find({ departmentId, year, semester, isDeleted: false });
    
    result = {
      studentId,
      studentName: student.userId.name,
      rollNumber: student.rollNumber,
      departmentId,
      year,
      semester,
      status: 'draft',
      subjects: subjects.map(s => ({
        subjectId: s._id,
        subjectCode: s.code,
        subjectName: s.name,
        maxMarks: 130, // 20+30+80
        obtainedMarks: 0,
        internalMarks: 0,
        practicalMarks: 0,
        theoryMarks: 0,
        attendancePercentage: 0,
      }))
    };
  }

  return result;
};

export const saveStudentDraft = async (studentId, data, facultyId) => {
  const { departmentId, year, semester, subjects } = data;

  let totalGPs = 0;
  let totalPercentages = 0;
  let allPassed = true;

  const computedSubjects = subjects.map(s => {
    const grades = calculateGradeDetails(s.internalMarks, s.practicalMarks, s.theoryMarks);
    if (!grades.pass) allPassed = false;
    totalGPs += grades.gp;
    totalPercentages += grades.percentage;

    return {
      subjectId: s.subjectId,
      subjectCode: s.subjectCode,
      subjectName: s.subjectName,
      maxMarks: 130,
      obtainedMarks: grades.totalMarks,
      internalMarks: s.internalMarks,
      practicalMarks: s.practicalMarks,
      theoryMarks: s.theoryMarks,
      attendancePercentage: s.attendancePercentage,
      grade: grades.grade,
      gp: grades.gp,
      status: grades.pass ? 'Pass' : 'Fail'
    };
  });

  const studentInfo = await Student.findOne({ userId: studentId }).populate('userId', 'name');

  const totalSubjects = computedSubjects.length;
  const sgpa = totalSubjects > 0 ? Math.round((totalGPs / totalSubjects) * 100) / 100 : 0;
  const semPercentage = totalSubjects > 0 ? Math.round((totalPercentages / totalSubjects) * 100) / 100 : 0;

  let result = await Result.findOne({ studentId, semester });
  if (result) {
    if (result.status === 'declared') throw new Error('Result already declared');
    result.subjects = computedSubjects;
    result.facultyId = facultyId;
    result.cgpa = sgpa; 
    result.percentage = semPercentage;
    result.overallResult = allPassed ? 'Pass' : 'Fail';
    result.status = 'draft';
  } else {
    result = new Result({
      studentId,
      studentName: studentInfo.userId.name,
      rollNumber: studentInfo.rollNumber,
      departmentId,
      year,
      semester,
      facultyId,
      subjects: computedSubjects,
      cgpa: sgpa,
      percentage: semPercentage,
      overallResult: allPassed ? 'Pass' : 'Fail',
      status: 'draft'
    });
  }

  await result.save();
  return result;
};

export const submitStudentResult = async (studentId, semester, facultyId) => {
  const result = await Result.findOne({ studentId, semester });
  if (!result) throw new Error('Draft not found.');
  if (result.status === 'declared') throw new Error('Already declared.');

  result.status = 'submitted';
  result.facultyId = facultyId;
  await result.save();
  return result;
};

export const getPendingResults = async () => {
  return await Result.find({ status: 'submitted' })
    .populate('departmentId', 'name code')
    .populate('facultyId', 'name email')
    .sort({ updatedAt: -1 });
};

export const approveResult = async (resultId, adminId, ipAddress) => {
  const result = await Result.findOne({ _id: resultId, status: 'submitted' });
  if (!result) throw new Error('Submitted result not found.');

  result.status = 'verified';
  result.verifiedBy = adminId;
  result.verifiedAt = new Date();
  await result.save();

  await logActivity({
    action: 'RESULT_APPROVED',
    performedBy: adminId,
    details: `Approved result for student ${result.studentName} (${result.semester})`,
    ipAddress,
  });

  return result;
};

export const declareResult = async (resultId, adminId, ipAddress) => {
  const result = await Result.findOne({ _id: resultId, status: 'verified' });
  if (!result) throw new Error('Verified result not found.');

  result.status = 'declared';
  result.declaredBy = adminId;
  result.declaredAt = new Date();
  await result.save();

  // Handle SGPA/CGPA
  const priorSemesterResults = await StudentSemesterResult.find({
    studentId: result.studentId,
    semester: { $ne: result.semester },
  });

  const allSGPAs = priorSemesterResults.map(psr => psr.sgpa);
  allSGPAs.push(result.cgpa); // result.cgpa stores SGPA temporarily for this sem
  const finalCgpa = allSGPAs.length > 0 ? Math.round((allSGPAs.reduce((a, b) => a + b, 0) / allSGPAs.length) * 100) / 100 : 0;

  await StudentSemesterResult.findOneAndUpdate(
    { studentId: result.studentId, semester: result.semester },
    {
      sgpa: result.cgpa,
      cgpa: finalCgpa,
      percentage: result.percentage,
      declaredDate: new Date(),
    },
    { upsert: true, new: true }
  );

  await createNotification(
    result.studentId,
    'Result Declared',
    `Your semester examination results for ${result.semester} have been declared.`,
    'RESULT'
  );

  await logActivity({
    action: 'RESULT_DECLARED',
    performedBy: adminId,
    details: `Declared result for student ${result.studentName} (${result.semester})`,
    ipAddress,
  });

  return result;
};

export const declareAllApproved = async (adminId, ipAddress) => {
  const submittedResults = await Result.find({ status: 'submitted' });
  const declaredList = [];

  for (const res of submittedResults) {
    await approveResult(res._id, adminId, ipAddress);
    const declared = await declareResult(res._id, adminId, ipAddress);
    declaredList.push(declared);
  }

  return declaredList;
};

export const getStudentMarksheetData = async (studentId, semester) => {
  const student = await Student.findOne({ userId: studentId, isDeleted: false })
    .populate('departmentId', 'name code');
  if (!student) throw new Error('Student profile not found.');

  const result = await Result.findOne({
    studentId,
    semester,
    status: 'declared',
  }).populate('subjects.subjectId', 'name code');

  if (!result) {
    throw new Error(`Results for semester ${semester} have not been declared yet.`);
  }

  const semSummary = await StudentSemesterResult.findOne({ studentId, semester });

  return {
    student: {
      name: student.name,
      rollNumber: student.rollNumber,
      departmentName: student.departmentId.name,
      year: student.year,
      semester: semester,
    },
    subjects: result.subjects,
    summary: {
      totalObtained: result.subjects.reduce((sum, s) => sum + s.obtainedMarks, 0),
      totalMax: result.subjects.length * 130,
      percentage: semSummary ? semSummary.percentage : result.percentage,
      sgpa: semSummary ? semSummary.sgpa : result.cgpa,
      cgpa: semSummary ? semSummary.cgpa : 0,
      overallResult: result.overallResult,
    }
  };
};
