import Exam from '../models/Exam.js';
import Question from '../models/Question.js';
import ExamAttempt from '../models/ExamAttempt.js';
import Student from '../models/Student.js';

// --- Faculty Operations ---

export const createExam = async (req, res) => {
  const { title, courseName, duration, totalMarks, questions, submitForApproval, year, semester } = req.body;

  if (!title || !courseName || !duration || !totalMarks || !questions || !Array.isArray(questions)) {
    return res.status(400).json({ message: 'All exam details and questions are required.' });
  }

  try {
    if (req.user.role === 'faculty') {
      const assigned = req.user.assignedSubjects || [];
      if (!assigned.includes(courseName)) {
        return res.status(403).json({
          message: `Forbidden. You are not assigned to teach the subject "${courseName}".`,
        });
      }
    }

    const status = submitForApproval ? 'pending' : 'draft';
    const newExam = new Exam({
      title,
      courseName,
      duration: Number(duration),
      totalMarks: Number(totalMarks),
      createdBy: req.user.id,
      department: req.user.role === 'faculty' ? req.user.department : '',
      year: year || '',
      semester: semester || '',
      status,
    });

    const savedExam = await newExam.save();

    const questionsToInsert = questions.map((q) => ({
      examId: savedExam._id,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      marks: Number(q.marks) || 1,
    }));

    await Question.insertMany(questionsToInsert);

    res.status(201).json({
      success: true,
      message: submitForApproval ? 'Exam submitted for approval successfully.' : 'Exam draft created successfully.',
      exam: savedExam,
    });
  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({ message: 'Internal server error creating exam.' });
  }
};

export const updateExam = async (req, res) => {
  const { id } = req.params;
  const { title, courseName, duration, totalMarks, questions, submitForApproval, year, semester } = req.body;

  try {
    if (req.user.role === 'faculty') {
      const checkSubject = courseName || (await Exam.findById(id))?.courseName;
      const assigned = req.user.assignedSubjects || [];
      if (checkSubject && !assigned.includes(checkSubject)) {
        return res.status(403).json({
          message: `Forbidden. You are not assigned to teach the subject "${checkSubject}".`,
        });
      }
    }

    const exam = await Exam.findById(id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found.' });
    }

    if (exam.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. You do not own this exam.' });
    }

    if (exam.status !== 'draft' && exam.status !== 'rejected') {
      return res.status(400).json({ message: 'Cannot modify an exam that is pending, approved, or active.' });
    }

    exam.title = title || exam.title;
    exam.courseName = courseName || exam.courseName;
    exam.duration = duration ? Number(duration) : exam.duration;
    exam.totalMarks = totalMarks ? Number(totalMarks) : exam.totalMarks;
    if (year !== undefined) exam.year = year;
    if (semester !== undefined) exam.semester = semester;
    
    if (submitForApproval) {
      exam.status = 'pending';
    }

    await exam.save();

    if (questions && Array.isArray(questions)) {
      await Question.deleteMany({ examId: id });
      const questionsToInsert = questions.map((q) => ({
        examId: id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        marks: Number(q.marks) || 1,
      }));
      await Question.insertMany(questionsToInsert);
    }

    res.json({
      success: true,
      message: 'Exam updated successfully.',
      exam,
    });
  } catch (error) {
    console.error('Update exam error:', error);
    res.status(500).json({ message: 'Internal server error updating exam.' });
  }
};

export const scheduleExam = async (req, res) => {
  const { id } = req.params;
  const { scheduledAt } = req.body;

  if (!scheduledAt) {
    return res.status(400).json({ message: 'Schedule date and time is required.' });
  }

  try {
    const exam = await Exam.findById(id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found.' });
    }

    if (exam.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    if (exam.status !== 'approved' && exam.status !== 'scheduled') {
      return res.status(400).json({ message: 'Only approved exams can be scheduled.' });
    }

    exam.status = 'scheduled';
    exam.scheduledAt = new Date(scheduledAt);
    await exam.save();

    res.json({ success: true, message: 'Exam scheduled successfully.', exam });
  } catch (error) {
    console.error('Schedule exam error:', error);
    res.status(500).json({ message: 'Internal server error scheduling exam.' });
  }
};

export const startExam = async (req, res) => {
  const { id } = req.params;

  try {
    const exam = await Exam.findById(id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found.' });
    }

    if (exam.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    if (exam.status !== 'scheduled' && exam.status !== 'approved') {
      return res.status(400).json({ message: 'Exam must be scheduled/approved to start.' });
    }

    exam.status = 'active';
    exam.startTime = new Date();
    // Expiration date
    exam.endTime = new Date(Date.now() + exam.duration * 60 * 1000);
    await exam.save();

    res.json({ success: true, message: 'Exam started successfully! Students can now check in.', exam });
  } catch (error) {
    console.error('Start exam error:', error);
    res.status(500).json({ message: 'Internal server error starting exam.' });
  }
};

export const getFacultyExams = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { createdBy: req.user.id, department: req.user.department };
    const exams = await Exam.find(filter).sort({ createdAt: -1 });
    
    // Map question counts
    const examData = await Promise.all(
      exams.map(async (exam) => {
        const count = await Question.countDocuments({ examId: exam._id });
        const obj = exam.toObject();
        obj.questionsCount = count;
        return obj;
      })
    );

    res.json(examData);
  } catch (error) {
    console.error('Get faculty exams error:', error);
    res.status(500).json({ message: 'Internal server error fetching exams.' });
  }
};

export const getExamResultSummary = async (req, res) => {
  const { id } = req.params;

  try {
    const exam = await Exam.findById(id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found.' });
    }

    if (exam.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const attempts = await ExamAttempt.find({ examId: id })
      .populate('studentId', 'name email')
      .sort({ score: -1 });

    res.json({
      exam,
      attempts,
    });
  } catch (error) {
    console.error('Get exam summary error:', error);
    res.status(500).json({ message: 'Internal server error fetching results summary.' });
  }
};

export const publishExamResults = async (req, res) => {
  const { id } = req.params;

  try {
    const exam = await Exam.findById(id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found.' });
    }

    if (exam.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    exam.resultsPublished = true;
    if (exam.status === 'active') {
      exam.status = 'completed';
    }
    await exam.save();

    res.json({ success: true, message: 'Exam results published successfully.', exam });
  } catch (error) {
    console.error('Publish exam results error:', error);
    res.status(500).json({ message: 'Internal server error publishing results.' });
  }
};

// --- Admin Operations ---

export const getPendingExams = async (req, res) => {
  try {
    const exams = await Exam.find({ status: 'pending' })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(exams);
  } catch (error) {
    console.error('Get pending exams error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const approveExam = async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;

  try {
    const exam = await Exam.findById(id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found.' });
    }

    exam.status = 'approved';
    exam.approvalComment = comment || 'Approved by administrator';
    await exam.save();

    res.json({ success: true, message: 'Exam approved successfully.', exam });
  } catch (error) {
    console.error('Approve exam error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const rejectExam = async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;

  if (!comment) {
    return res.status(400).json({ message: 'Rejection comments/feedback are required.' });
  }

  try {
    const exam = await Exam.findById(id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found.' });
    }

    exam.status = 'rejected';
    exam.approvalComment = comment;
    await exam.save();

    res.json({ success: true, message: 'Exam paper rejected.', exam });
  } catch (error) {
    console.error('Reject exam error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// --- Student Operations ---

export const getAvailableExams = async (req, res) => {
  try {
    // Return all scheduled, active, or completed exams that match student department or global
    const filter = {
      status: { $in: ['scheduled', 'active', 'completed'] },
      department: req.user.department,
      year: req.user.year,
      semester: req.user.semester,
    };
    const exams = await Exam.find(filter).sort({ scheduledAt: 1 });

    // Attach student attempts status if it exists
    const examStatuses = await Promise.all(
      exams.map(async (exam) => {
        const attempt = await ExamAttempt.findOne({ examId: exam._id, studentId: req.user.id });
        const examObj = exam.toObject();
        examObj.attemptStatus = attempt ? attempt.status : 'not_started';
        examObj.attemptScore = (attempt && exam.resultsPublished) ? attempt.score : null;
        examObj.attemptId = attempt ? attempt._id : null;
        return examObj;
      })
    );

    res.json(examStatuses);
  } catch (error) {
    console.error('Get available exams error:', error);
    res.status(500).json({ message: 'Internal server error fetching available exams.' });
  }
};

export const startExamAttempt = async (req, res) => {
  const { id } = req.params;

  try {
    const exam = await Exam.findById(id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found.' });
    }

    if (exam.status !== 'active') {
      return res.status(400).json({ message: 'This exam is not active.' });
    }

    // Check if duplicate attempt
    let attempt = await ExamAttempt.findOne({ examId: id, studentId: req.user.id });
    if (attempt) {
      if (attempt.status === 'submitted') {
        return res.status(400).json({ message: 'You have already submitted this exam attempt.' });
      }
      if (attempt.status === 'blocked') {
        return res.status(403).json({ message: 'You have been blocked from this exam due to proctor violations.' });
      }
      // Return existing active attempt to resume
      const questions = await Question.find({ examId: id }).select('-correctAnswer');
      return res.status(200).json({ attempt, questions, exam });
    }

    // Create new attempt
    attempt = new ExamAttempt({
      examId: id,
      studentId: req.user.id,
      status: 'active',
      warnings: 0,
      startTime: new Date(),
    });

    await attempt.save();

    const questions = await Question.find({ examId: id }).select('-correctAnswer');
    res.status(201).json({ attempt, questions, exam });
  } catch (error) {
    console.error('Start attempt error:', error);
    res.status(500).json({ message: 'Internal server error starting attempt.' });
  }
};

export const submitExamAttempt = async (req, res) => {
  const { id } = req.params; // examId
  const { answers } = req.body; // Array of { questionId, selectedAnswer }

  try {
    const exam = await Exam.findById(id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found.' });
    }

    const attempt = await ExamAttempt.findOne({ examId: id, studentId: req.user.id });
    if (!attempt) {
      return res.status(404).json({ message: 'No active attempt found for this exam.' });
    }

    if (attempt.status === 'submitted') {
      return res.status(400).json({ message: 'Attempt already submitted.' });
    }
    if (attempt.status === 'blocked') {
      return res.status(403).json({ message: 'Cannot submit a blocked attempt.' });
    }

    // Auto Evaluation
    const questions = await Question.find({ examId: id });
    let score = 0;
    
    const formattedAnswers = (answers || []).map((ans) => {
      const question = questions.find((q) => q._id.toString() === ans.questionId);
      if (question && question.correctAnswer.trim().toLowerCase() === ans.selectedAnswer.trim().toLowerCase()) {
        score += question.marks;
      }
      return {
        questionId: ans.questionId,
        selectedAnswer: ans.selectedAnswer,
      };
    });

    attempt.answers = formattedAnswers;
    attempt.score = score;
    attempt.status = 'submitted';
    attempt.endTime = new Date();
    await attempt.save();

    res.json({
      success: true,
      message: 'Exam submitted successfully.',
      score,
      totalMarks: exam.totalMarks,
    });
  } catch (error) {
    console.error('Submit attempt error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const getStudentResult = async (req, res) => {
  const { id } = req.params; // examId

  try {
    const exam = await Exam.findById(id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found.' });
    }

    if (!exam.resultsPublished) {
      return res.status(403).json({ message: 'Exam results have not been published by faculty yet.' });
    }

    const attempt = await ExamAttempt.findOne({ examId: id, studentId: req.user.id });
    if (!attempt) {
      return res.status(404).json({ message: 'No attempt record found for this exam.' });
    }

    const questions = await Question.find({ examId: id });

    res.json({
      exam,
      attempt,
      questions,
    });
  } catch (error) {
    console.error('Get result error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
