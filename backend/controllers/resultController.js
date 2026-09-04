import * as resultService from '../services/resultService.js';

export const getStudents = async (req, res) => {
  try {
    const { departmentId, year, semester } = req.query;
    if (!departmentId || !year || !semester) {
      return res.status(400).json({ message: 'Missing parameters departmentId, year, or semester.' });
    }
    const students = await resultService.getStudentsForGrading(departmentId, year, semester);
    res.status(200).json(students);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getDraft = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { departmentId, year, semester } = req.query;
    if (!departmentId || !year || !semester) {
      return res.status(400).json({ message: 'Missing parameters departmentId, year, or semester.' });
    }

    const draft = await resultService.getStudentDraft(studentId, departmentId, year, semester);
    res.status(200).json(draft);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const saveDraft = async (req, res) => {
  try {
    const { studentId } = req.params;
    const result = await resultService.saveStudentDraft(studentId, req.body, req.user.id);
    res.status(200).json({ message: 'Student result saved successfully.', result });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const submit = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { semester } = req.body;
    if (!semester) {
      return res.status(400).json({ message: 'Semester parameter is required for submission.' });
    }
    const result = await resultService.submitStudentResult(studentId, semester, req.user.id);
    res.status(200).json({ message: 'Student result submitted for approval.', result });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const listPending = async (req, res) => {
  try {
    const departmentId = req.user.role === 'hod' ? req.user.departmentId : null;
    const results = await resultService.getPendingResults(departmentId);
    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve pending results.' });
  }
};

export const approve = async (req, res) => {
  try {
    const result = await resultService.approveResult(req.params.id, req.user.id, req.ip);
    res.status(200).json({ message: 'Student result approved successfully.', result });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const declare = async (req, res) => {
  try {
    const result = await resultService.declareResult(req.params.id, req.user.id, req.ip);
    res.status(200).json({ message: 'Student result declared.', result });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const declareAll = async (req, res) => {
  try {
    const declaredList = await resultService.declareAllApproved(req.user.id, req.ip);
    res.status(200).json({ message: `Successfully declared ${declaredList.length} student results.`, declaredList });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getMarksheet = async (req, res) => {
  try {
    const { semester } = req.query;
    if (!semester) {
      return res.status(400).json({ message: 'Semester parameter is required.' });
    }

    const marksheet = await resultService.getStudentMarksheetData(req.user.id, semester);
    res.status(200).json(marksheet);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
