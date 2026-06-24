import Result from '../models/Result.js';
import User from '../models/User.js';
import Student from '../models/Student.js';

// --- Grade & Totals Calculator Helper ---
const evaluateResultMetrics = (resultDoc) => {
  let totalMax = 0;
  let totalObtained = 0;
  let allPassed = true;

  const subjects = resultDoc.subjects.map((sub) => {
    const max = Number(sub.maxMarks) || 100;
    const obtained = Number(sub.obtainedMarks) || 0;
    const subPercent = max > 0 ? (obtained / max) * 100 : 0;

    let grade = 'F';
    let status = 'Fail';

    if (subPercent >= 90) grade = 'O';
    else if (subPercent >= 80) grade = 'A';
    else if (subPercent >= 70) grade = 'B';
    else if (subPercent >= 60) grade = 'C';
    else if (subPercent >= 50) grade = 'D';
    else if (subPercent >= 40) grade = 'E';

    if (subPercent >= 40) {
      status = 'Pass';
    } else {
      allPassed = false;
    }

    return {
      subjectCode: sub.subjectCode,
      subjectName: sub.subjectName,
      maxMarks: max,
      obtainedMarks: obtained,
      grade,
      status,
    };
  });

  subjects.forEach((s) => {
    totalMax += s.maxMarks;
    totalObtained += s.obtainedMarks;
  });

  const overallPercent = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
  const cgpa = Number((overallPercent / 10).toFixed(2));

  let overallGrade = 'F';
  if (overallPercent >= 90) overallGrade = 'O';
  else if (overallPercent >= 80) overallGrade = 'A';
  else if (overallPercent >= 70) overallGrade = 'B';
  else if (overallPercent >= 60) overallGrade = 'C';
  else if (overallPercent >= 50) overallGrade = 'D';
  else if (overallPercent >= 40) overallGrade = 'E';

  const overallResult = allPassed ? 'Pass' : 'Fail';

  resultDoc.subjects = subjects;
  resultDoc.totalMarks = totalMax;
  resultDoc.obtainedMarks = totalObtained;
  resultDoc.percentage = Number(overallPercent.toFixed(2));
  resultDoc.cgpa = cgpa;
  resultDoc.overallGrade = overallGrade;
  resultDoc.overallResult = overallResult;
};

// --- Faculty Services ---

// 1. Get Students List for dropdown
export const getStudentList = async (req, res) => {
  try {
    const userQuery = { role: 'student', status: 'active' };
    if (req.user.role === 'faculty') {
      userQuery.department = req.user.department;
    }
    const studentUsers = await User.find(userQuery).select('name email');
    const list = await Promise.all(
      studentUsers.map(async (u) => {
        const profile = await Student.findOne({ user: u._id }).select('rollNumber department');
        return {
          studentId: u._id,
          studentName: u.name,
          studentEmail: u.email,
          rollNumber: profile ? profile.rollNumber : 'N/A',
          department: profile ? profile.department : 'N/A',
        };
      })
    );
    res.json(list);
  } catch (error) {
    console.error('Get students list error:', error);
    res.status(500).json({ message: 'Internal server error listing students.' });
  }
};

// 2. Create Result
export const createResult = async (req, res) => {
  const {
    studentId,
    studentName,
    rollNumber,
    department,
    courseName,
    semester,
    academicYear,
    subjects,
    attendancePercentage,
    internalMarksTotal,
    practicalMarksTotal,
    theoryMarksTotal,
  } = req.body;

  if (!studentId || !studentName || !department || !subjects || !Array.isArray(subjects) || subjects.length === 0) {
    return res.status(400).json({ message: 'Student information, department, and subjects marks are required.' });
  }

  if (req.user.role === 'faculty') {
    if (department !== req.user.department) {
      return res.status(403).json({ message: 'Unauthorized. You can only create results for your department.' });
    }
    const assigned = req.user.assignedSubjects || [];
    for (const sub of subjects) {
      if (!assigned.includes(sub.subjectName) && !assigned.includes(sub.subjectCode)) {
        return res.status(403).json({
          message: `Forbidden. You are not assigned to manage grades for the subject "${sub.subjectName}".`,
        });
      }
    }
  }

  try {
    const newResult = new Result({
      studentId,
      studentName,
      rollNumber,
      department,
      courseName,
      semester,
      academicYear,
      facultyId: req.user.id,
      facultyName: req.user.name,
      subjects: subjects.map((s) => ({
        subjectCode: s.subjectCode,
        subjectName: s.subjectName,
        maxMarks: Number(s.maxMarks),
        obtainedMarks: Number(s.obtainedMarks),
      })),
      attendancePercentage: attendancePercentage ? Number(attendancePercentage) : undefined,
      internalMarksTotal: internalMarksTotal ? Number(internalMarksTotal) : undefined,
      practicalMarksTotal: practicalMarksTotal ? Number(practicalMarksTotal) : undefined,
      theoryMarksTotal: theoryMarksTotal ? Number(theoryMarksTotal) : undefined,
      status: 'draft',
    });

    evaluateResultMetrics(newResult);
    const saved = await newResult.save();

    res.status(201).json({
      success: true,
      message: 'Result draft created successfully.',
      result: saved,
    });
  } catch (error) {
    console.error('Create result error:', error);
    res.status(500).json({ message: 'Internal server error creating result.' });
  }
};

// 3. Edit Result
export const updateResult = async (req, res) => {
  const { id } = req.params;
  const {
    department,
    courseName,
    semester,
    academicYear,
    subjects,
    attendancePercentage,
    internalMarksTotal,
    practicalMarksTotal,
    theoryMarksTotal,
  } = req.body;

  try {
    if (req.user.role === 'faculty' && subjects && Array.isArray(subjects)) {
      const assigned = req.user.assignedSubjects || [];
      for (const sub of subjects) {
        if (!assigned.includes(sub.subjectName) && !assigned.includes(sub.subjectCode)) {
          return res.status(403).json({
            message: `Forbidden. You are not assigned to manage grades for the subject "${sub.subjectName}".`,
          });
        }
      }
    }

    const result = await Result.findById(id);
    if (!result) {
      return res.status(404).json({ message: 'Result sheet not found.' });
    }

    if (result.status === 'declared') {
      return res.status(400).json({ message: 'Cannot modify a declared result.' });
    }

    result.department = department || result.department;
    result.courseName = courseName || result.courseName;
    result.semester = semester || result.semester;
    result.academicYear = academicYear || result.academicYear;
    result.attendancePercentage = attendancePercentage !== undefined ? Number(attendancePercentage) : result.attendancePercentage;
    result.internalMarksTotal = internalMarksTotal !== undefined ? Number(internalMarksTotal) : result.internalMarksTotal;
    result.practicalMarksTotal = practicalMarksTotal !== undefined ? Number(practicalMarksTotal) : result.practicalMarksTotal;
    result.theoryMarksTotal = theoryMarksTotal !== undefined ? Number(theoryMarksTotal) : result.theoryMarksTotal;

    if (subjects && Array.isArray(subjects)) {
      result.subjects = subjects.map((sub) => ({
        subjectCode: sub.subjectCode,
        subjectName: sub.subjectName,
        maxMarks: Number(sub.maxMarks),
        obtainedMarks: Number(sub.obtainedMarks),
      }));
    }

    evaluateResultMetrics(result);

    const saved = await result.save();
    res.json({
      success: true,
      message: 'Result sheet updated successfully.',
      result: saved,
    });
  } catch (error) {
    console.error('Update result error:', error);
    res.status(500).json({ message: 'Internal server error updating result.' });
  }
};

// 4. Submit Result
export const submitResult = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await Result.findById(id);
    if (!result) {
      return res.status(404).json({ message: 'Result not found.' });
    }

    if (result.status === 'declared') {
      return res.status(400).json({ message: 'Result is already declared.' });
    }

    result.status = 'submitted';
    await result.save();

    res.json({
      success: true,
      message: 'Result submitted for administrator review.',
      result,
    });
  } catch (error) {
    console.error('Submit result error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// 5. List Faculty submissions
export const getFacultyResults = async (req, res) => {
  try {
    const list = await Result.find({ facultyId: req.user.id, department: req.user.department }).sort({ createdAt: -1 });
    res.json(list);
  } catch (error) {
    console.error('Get faculty results error:', error);
    res.status(500).json({ message: 'Internal server error fetching results.' });
  }
};

// 6. Get single result details
export const getResultById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await Result.findById(id);
    if (!result) {
      return res.status(404).json({ message: 'Result not found.' });
    }

    // Restrict student access if not declared
    if (req.user.role === 'student') {
      if (result.studentId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied. You do not own this result.' });
      }
      if (result.status !== 'declared') {
        return res.status(403).json({ message: 'Access denied. Result not declared yet.' });
      }
    }

    res.json(result);
  } catch (error) {
    console.error('Get result error:', error);
    res.status(500).json({ message: 'Internal server error fetching result details.' });
  }
};

// --- Admin Services ---

// 1. Fetch all department result summaries (aggregate state)
export const getDepartmentSummaries = async (req, res) => {
  try {
    const summaries = await Result.aggregate([
      {
        $group: {
          _id: {
            department: '$department',
            semester: '$semester',
            academicYear: '$academicYear',
          },
          total: { $sum: 1 },
          submittedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] },
          },
          verifiedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] },
          },
          declaredCount: {
            $sum: { $cond: [{ $eq: ['$status', 'declared'] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          department: '$_id.department',
          semester: '$_id.semester',
          academicYear: '$_id.academicYear',
          totalStudents: '$total',
          submittedCount: 1,
          verifiedCount: 1,
          declaredCount: 1,
        },
      },
      {
        $sort: { department: 1, semester: 1, academicYear: 1 },
      },
    ]);
    res.json(summaries);
  } catch (error) {
    console.error('Get summaries error:', error);
    res.status(500).json({ message: 'Internal server error fetching department summaries.' });
  }
};

// 2. Fetch result sheets matching a department filter
export const getDepartmentDetails = async (req, res) => {
  const { department, semester, academicYear } = req.query;

  if (!department || !semester || !academicYear) {
    return res.status(400).json({ message: 'Department, semester, and academicYear are required parameters.' });
  }

  try {
    const list = await Result.find({
      department,
      semester,
      academicYear,
    }).sort({ rollNumber: 1 });
    res.json(list);
  } catch (error) {
    console.error('Get department details error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// 3. Verify all submitted results for a department
export const verifyDepartment = async (req, res) => {
  const { department, semester, academicYear } = req.body;

  if (!department || !semester || !academicYear) {
    return res.status(400).json({ message: 'Department, semester, and academic year are required.' });
  }

  try {
    const filter = {
      department,
      semester,
      academicYear,
      status: 'submitted',
    };

    const update = {
      status: 'verified',
      verifiedBy: req.user.id,
      verifiedAt: new Date(),
    };

    const response = await Result.updateMany(filter, update);

    res.json({
      success: true,
      message: `Successfully verified ${response.modifiedCount} submitted results for ${department}.`,
      modifiedCount: response.modifiedCount,
    });
  } catch (error) {
    console.error('Verify department error:', error);
    res.status(500).json({ message: 'Internal server error verifying department results.' });
  }
};

// 4. Declare all verified results for a department
export const declareDepartment = async (req, res) => {
  const { department, semester, academicYear } = req.body;

  if (!department || !semester || !academicYear) {
    return res.status(400).json({ message: 'Department, semester, and academic year are required.' });
  }

  try {
    const filter = {
      department,
      semester,
      academicYear,
      status: 'verified',
    };

    const update = {
      status: 'declared',
      declaredBy: req.user.id,
      declaredAt: new Date(),
    };

    const response = await Result.updateMany(filter, update);

    res.json({
      success: true,
      message: `Successfully declared ${response.modifiedCount} verified results for ${department}.`,
      modifiedCount: response.modifiedCount,
    });
  } catch (error) {
    console.error('Declare department error:', error);
    res.status(500).json({ message: 'Internal server error declaring department results.' });
  }
};

// 5. Get all results list (Reference)
export const getAllResults = async (req, res) => {
  try {
    const list = await Result.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (error) {
    console.error('Get all results error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// --- Student Services ---

// 1. Get declared results for student
export const getStudentResults = async (req, res) => {
  try {
    const list = await Result.find({
      studentId: req.user.id,
      status: 'declared',
    }).sort({ semester: 1 });
    res.json(list);
  } catch (error) {
    console.error('Get student results error:', error);
    res.status(500).json({ message: 'Internal server error fetching results.' });
  }
};
