import * as assignmentService from '../services/assignmentService.js';

export const createAssignment = async (req, res) => {
  try {
    const assignment = await assignmentService.createAssignment(req.body, req.user.id);
    res.status(201).json(assignment);
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ message: error.message || 'Internal server error creating assignment.' });
  }
};

export const getAssignments = async (req, res) => {
  try {
    const assignments = await assignmentService.getAssignments(req.user);
    res.json(assignments);
  } catch (error) {
    console.error('Fetch assignments error:', error);
    res.status(500).json({ message: error.message || 'Internal server error fetching assignments.' });
  }
};

export const getSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const submissions = await assignmentService.getAssignmentSubmissions(assignmentId, req.user);
    res.json(submissions);
  } catch (error) {
    console.error('Fetch submissions error:', error);
    res.status(500).json({ message: error.message || 'Internal server error fetching submissions.' });
  }
};

export const submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded or invalid file type.' });
    }

    // Use relative path for downloads
    const fileUrl = `/uploads/${req.file.filename}`;
    const fileName = req.file.originalname;

    const submission = await assignmentService.submitAssignment(
      assignmentId,
      req.user.id,
      fileUrl,
      fileName
    );
    res.status(201).json(submission);
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({ message: error.message || 'Internal server error submitting assignment.' });
  }
};

export const gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { marks, remarks } = req.body;

    if (marks === undefined || marks === null) {
      return res.status(400).json({ message: 'Marks are required for grading.' });
    }

    const submission = await assignmentService.gradeSubmission(
      submissionId,
      req.user.id,
      Number(marks),
      remarks,
      req.user.role
    );
    res.json(submission);
  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({ message: error.message || 'Internal server error grading submission.' });
  }
};

export const deleteAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    await assignmentService.deleteAssignment(assignmentId, req.user.id, req.user.role);
    res.json({ message: 'Assignment deleted successfully.' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ message: error.message || 'Internal server error deleting assignment.' });
  }
};
