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

    // Keep existing approval fields if present, else default
    return {
      subjectCode: sub.subjectCode,
      subjectName: sub.subjectName,
      maxMarks: max,
      obtainedMarks: obtained,
      grade,
      status,
      approvalStatus: sub.approvalStatus || 'pending',
      adminRemark: sub.adminRemark || '',
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
    const studentUsers = await User.find({ role: 'student', status: 'active' }).select('name email');
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
    courseName,
    semester,
    academicYear,
    subjects,
    attendancePercentage,
    internalMarksTotal,
    practicalMarksTotal,
    theoryMarksTotal,
  } = req.body;

  if (!studentId || !studentName || !subjects || !Array.isArray(subjects) || subjects.length === 0) {
    return res.status(400).json({ message: 'Student information and subjects marks are required.' });
  }

  try {
    const newResult = new Result({
      studentId,
      studentName,
      rollNumber,
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
        approvalStatus: 'pending', // Fresh starts default to pending
        adminRemark: '',
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
    const result = await Result.findById(id);
    if (!result) {
      return res.status(404).json({ message: 'Result sheet not found.' });
    }

    if (result.status === 'declared') {
      return res.status(400).json({ message: 'Cannot modify a declared result.' });
    }

    result.courseName = courseName || result.courseName;
    result.semester = semester || result.semester;
    result.academicYear = academicYear || result.academicYear;
    result.attendancePercentage = attendancePercentage !== undefined ? Number(attendancePercentage) : result.attendancePercentage;
    result.internalMarksTotal = internalMarksTotal !== undefined ? Number(internalMarksTotal) : result.internalMarksTotal;
    result.practicalMarksTotal = practicalMarksTotal !== undefined ? Number(practicalMarksTotal) : result.practicalMarksTotal;
    result.theoryMarksTotal = theoryMarksTotal !== undefined ? Number(theoryMarksTotal) : result.theoryMarksTotal;

    if (subjects && Array.isArray(subjects)) {
      // Map and reset approval details if changed by faculty
      result.subjects = subjects.map((sub) => {
        const existingSub = result.subjects.find((e) => e.subjectCode === sub.subjectCode);
        
        let approvalStatus = 'pending';
        let adminRemark = '';

        if (existingSub) {
          const marksChanged =
            Number(existingSub.maxMarks) !== Number(sub.maxMarks) ||
            Number(existingSub.obtainedMarks) !== Number(sub.obtainedMarks);

          if (!marksChanged) {
            approvalStatus = existingSub.approvalStatus;
            adminRemark = existingSub.adminRemark;
          }
        }

        return {
          subjectCode: sub.subjectCode,
          subjectName: sub.subjectName,
          maxMarks: Number(sub.maxMarks),
          obtainedMarks: Number(sub.obtainedMarks),
          approvalStatus,
          adminRemark,
        };
      });
    }

    evaluateResultMetrics(result);

    // If re-evaluating status when correcting:
    if (result.status === 'verification_pending') {
      // Keep verification_pending, or reset to draft if edits are heavy.
      // But we will allow direct re-submission to submitted.
    }

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

    // Force reset all pending/rejected subjects to pending on fresh submission
    result.subjects = result.subjects.map((sub) => {
      if (sub.approvalStatus === 'rejected') {
        sub.approvalStatus = 'pending';
        sub.adminRemark = '';
      }
      return sub;
    });

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
    const list = await Result.find({ facultyId: req.user.id }).sort({ createdAt: -1 });
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

// 1. Fetch pending results (submitted or verification_pending)
export const getPendingResults = async (req, res) => {
  try {
    const list = await Result.find({
      status: { $in: ['submitted', 'verification_pending', 'ready_for_declaration'] },
    }).sort({ updatedAt: -1 });
    res.json(list);
  } catch (error) {
    console.error('Get pending results error:', error);
    res.status(500).json({ message: 'Internal server error fetching pending reviews.' });
  }
};

// 2. Approve single subject within a result
export const approveSubject = async (req, res) => {
  const { resultId, subjectIndex } = req.params;

  try {
    const result = await Result.findById(resultId);
    if (!result) {
      return res.status(404).json({ message: 'Result not found.' });
    }

    const idx = Number(subjectIndex);
    if (idx < 0 || idx >= result.subjects.length) {
      return res.status(400).json({ message: 'Invalid subject index.' });
    }

    result.subjects[idx].approvalStatus = 'approved';
    result.subjects[idx].adminRemark = '';

    // Re-evaluate overall result status
    const allApproved = result.subjects.every((s) => s.approvalStatus === 'approved');
    if (allApproved) {
      result.status = 'ready_for_declaration';
    } else {
      result.status = 'verification_pending';
    }

    await result.save();
    res.json({
      success: true,
      message: `Subject ${result.subjects[idx].subjectCode} approved successfully.`,
      result,
    });
  } catch (error) {
    console.error('Approve subject error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// 3. Reject single subject within a result
export const rejectSubject = async (req, res) => {
  const { resultId, subjectIndex } = req.params;
  const { remark } = req.body;

  if (!remark) {
    return res.status(400).json({ message: 'A remark/reason is required to reject a subject.' });
  }

  try {
    const result = await Result.findById(resultId);
    if (!result) {
      return res.status(404).json({ message: 'Result not found.' });
    }

    const idx = Number(subjectIndex);
    if (idx < 0 || idx >= result.subjects.length) {
      return res.status(400).json({ message: 'Invalid subject index.' });
    }

    result.subjects[idx].approvalStatus = 'rejected';
    result.subjects[idx].adminRemark = remark;
    result.status = 'verification_pending';

    await result.save();
    res.json({
      success: true,
      message: `Subject ${result.subjects[idx].subjectCode} rejected with remark.`,
      result,
    });
  } catch (error) {
    console.error('Reject subject error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// 4. Declare result officially
export const declareResult = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await Result.findById(id);
    if (!result) {
      return res.status(404).json({ message: 'Result not found.' });
    }

    const allApproved = result.subjects.every((s) => s.approvalStatus === 'approved');
    if (!allApproved) {
      return res.status(400).json({ message: 'All subjects must be approved before declaration.' });
    }

    result.status = 'declared';
    result.declaredBy = req.user.id;
    result.declaredAt = new Date();
    await result.save();

    res.json({
      success: true,
      message: 'Result officially declared and published.',
      result,
    });
  } catch (error) {
    console.error('Declare result error:', error);
    res.status(500).json({ message: 'Internal server error declaring result.' });
  }
};

// 5. Get all results (Admin reference list)
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

// 1. Get declared results for logged-in student
export const getStudentResults = async (req, res) => {
  try {
    const list = await Result.find({
      studentId: req.user.id,
      status: 'declared',
    }).sort({ semester: 1 });
    res.json(list);
  } catch (error) {
    console.error('Get student results error:', error);
    res.status(500).json({ message: 'Internal server error fetching your grades.' });
  }
};
