import * as facultyService from '../services/facultyService.js';
import Faculty from '../models/Faculty.js';

export const createFaculty = async (req, res) => {
  try {
    const faculty = await facultyService.createFaculty(req.body, req.user.id, req.ip);
    res.status(201).json({ message: 'Faculty created successfully.', faculty });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getFacultyList = async (req, res) => {
  try {
    const filters = {
      departmentId: req.query.departmentId,
      year: req.query.year,
      search: req.query.search,
    };
    const faculties = await facultyService.getFaculties(filters);
    res.status(200).json(faculties);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve faculty list.' });
  }
};

export const getFacultyDetails = async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ _id: req.params.id, isDeleted: false })
      .populate('userId', 'name email username status')
      .populate('assignedDepartments', 'name code');

    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found.' });
    }
    res.status(200).json(faculty);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving faculty details.' });
  }
};

export const updateFaculty = async (req, res) => {
  try {
    const faculty = await facultyService.updateFaculty(req.params.id, req.body, req.user.id, req.ip);
    res.status(200).json({ message: 'Faculty profile updated successfully.', faculty });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Password is required.' });
    }
    await facultyService.resetFacultyPassword(req.params.id, password, req.user.id, req.ip);
    res.status(200).json({ message: 'Faculty password reset successfully.' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateFacultyStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['active', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Valid status required.' });
    }
    const faculty = await Faculty.findOne({ _id: req.params.id, isDeleted: false });
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found.' });
    }
    const user = await faculty.populate('userId');
    if (user.userId) {
      user.userId.status = status;
      await user.userId.save();
    }
    res.status(200).json({ message: `Faculty status updated to ${status}.` });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteFaculty = async (req, res) => {
  try {
    await facultyService.deleteFaculty(req.params.id, req.user.id, req.ip);
    res.status(200).json({ message: 'Faculty profile soft-deleted successfully.' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
