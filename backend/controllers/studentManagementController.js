import * as studentService from '../services/studentService.js';

export const listStudents = async (req, res) => {
  try {
    const filters = {
      departmentId: req.query.departmentId,
      year: req.query.year,
      semester: req.query.semester,
      search: req.query.search,
    };
    const students = await studentService.getStudents(filters, req.user);
    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve students list.' });
  }
};

export const addStudent = async (req, res) => {
  try {
    const student = await studentService.createStudent(req.body, req.user.id, req.ip);
    res.status(201).json({ message: 'Student created successfully.', student });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const editStudent = async (req, res) => {
  try {
    const student = await studentService.updateStudent(req.params.id, req.body, req.user, req.ip);
    res.status(200).json({ message: 'Student profile updated successfully.', student });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const removeStudent = async (req, res) => {
  try {
    await studentService.deleteStudent(req.params.id, req.user, req.ip);
    res.status(200).json({ message: 'Student profile soft-deleted successfully.' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const resetStudentPass = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Password is required.' });
    }
    await studentService.resetPassword(req.params.id, password, req.user, req.ip);
    res.status(200).json({ message: 'Student password reset successfully.' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
