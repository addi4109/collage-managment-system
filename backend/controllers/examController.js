import * as examService from '../services/examService.js';
import Exam from '../models/Exam.js';

export const createExam = async (req, res) => {
  try {
    const exam = await examService.createExam(req.body, req.user.id);
    res.status(201).json({ message: 'Exam draft created successfully.', exam });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const submitForApproval = async (req, res) => {
  try {
    const exam = await examService.submitExamForApproval(req.params.id, req.user.id);
    res.status(200).json({ message: 'Exam submitted for approval.', exam });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const listPending = async (req, res) => {
  try {
    const departmentId = req.user.role === 'hod' ? req.user.departmentId : null;
    const exams = await examService.getPendingExams(departmentId, req.user.role);
    res.status(200).json(exams);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch pending exams.' });
  }
};

export const review = async (req, res) => {
  try {
    const { approve } = req.body;
    if (approve === undefined) {
      return res.status(400).json({ message: 'Approve parameter (true/false) is required.' });
    }
    const exam = await examService.reviewExam(req.params.id, approve, req.user.id, req.user.role);
    res.status(200).json({ message: `Exam ${approve ? 'approved' : 'rejected and set to draft'}.`, exam });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const schedule = async (req, res) => {
  try {
    const exam = await examService.scheduleExam(req.params.id, req.body, req.user.id);
    res.status(200).json({ message: 'Exam scheduled successfully.', exam });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const start = async (req, res) => {
  try {
    const exam = await examService.startExam(req.params.id, req.user.id);
    res.status(200).json({ message: 'Exam is now active.', exam });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const end = async (req, res) => {
  try {
    const exam = await examService.endExam(req.params.id, req.user.id);
    res.status(200).json({ message: 'Exam ended successfully.', exam });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const listStudentExams = async (req, res) => {
  try {
    const exams = await examService.getStudentExams(req.user.id);
    res.status(200).json(exams);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const startExamAttempt = async (req, res) => {
  try {
    const attempt = await examService.startAttempt(req.user.id, req.params.id);
    res.status(200).json({ message: 'Exam attempt started.', attempt });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const logViolation = async (req, res) => {
  try {
    const { eventType, details } = req.body;
    if (!eventType) {
      return res.status(400).json({ message: 'eventType is required.' });
    }
    const result = await examService.logProctorViolation(req.user.id, req.params.id, eventType, details);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const submitAttempt = async (req, res) => {
  try {
    const { answers } = req.body;
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Answers array is required.' });
    }
    const attempt = await examService.submitExamAttempt(req.user.id, req.params.id, answers);
    res.status(200).json({ message: 'Exam attempt submitted successfully.', attempt });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getResults = async (req, res) => {
  try {
    const report = await examService.getExamAttemptsReport(req.params.id, req.user.id);
    res.status(200).json(report);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getFacultyExamsList = async (req, res) => {
  try {
    const query = { facultyId: req.user.id, isDeleted: false };
    if (req.query.departmentId) query.departmentId = req.query.departmentId;
    if (req.query.year) query.year = req.query.year;

    const exams = await Exam.find(query)
      .populate('subjectId', 'name code')
      .populate('departmentId', 'name code')
      .sort({ createdAt: -1 });
    res.status(200).json(exams);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve faculty exams.' });
  }
};
