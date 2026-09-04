import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import HOD from '../models/HOD.js';
import Faculty from '../models/Faculty.js';
import Student from '../models/Student.js';
import Department from '../models/Department.js';
import Librarian from '../models/Librarian.js';

export const getPrincipalStats = async (req, res) => {
  try {
    const totalDepartments = await Department.countDocuments({ isDeleted: false });
    const totalFaculty = await Faculty.countDocuments({ isDeleted: false });
    const totalStudents = await Student.countDocuments({ isDeleted: false });
    const totalHODs = await HOD.countDocuments({ isDeleted: false });

    res.status(200).json({
      totalDepartments,
      totalFaculty,
      totalStudents,
      totalHODs,
    });
  } catch (error) {
    console.error('getPrincipalStats Error:', error);
    res.status(500).json({ message: 'Failed to fetch principal stats' });
  }
};

export const createHOD = async (req, res) => {
  try {
    const { name, username, password, departmentId, phone } = req.body;

    // Validate if HOD already exists for this department
    const existingHOD = await HOD.findOne({ departmentId, isDeleted: false });
    if (existingHOD) {
      return res.status(400).json({ message: 'An HOD is already assigned to this department.' });
    }

    const email = `${username}@hod.edu`;
    const employeeId = `HOD-${username.toUpperCase()}`;

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      username,
      email,
      passwordHash,
      role: 'hod',
    });

    const savedUser = await newUser.save();

    const newHOD = new HOD({
      userId: savedUser._id,
      employeeId,
      departmentId,
      phone,
    });

    await newHOD.save();
    res.status(201).json({ message: 'HOD created successfully' });
  } catch (error) {
    console.error('createHOD Error:', error);
    if (error.code === 11000) {
       return res.status(400).json({ message: 'Username, Email or Employee ID already exists.' });
    }
    res.status(500).json({ message: 'Failed to create HOD' });
  }
};

export const getHODs = async (req, res) => {
  try {
    const hods = await HOD.find({ isDeleted: false })
      .populate('userId', 'name email status')
      .populate('departmentId', 'name code');
    res.status(200).json(hods);
  } catch (error) {
    console.error('getHODs Error:', error);
    res.status(500).json({ message: 'Failed to fetch HODs' });
  }
};

export const deleteHOD = async (req, res) => {
  try {
    const hod = await HOD.findById(req.params.id);
    if (!hod) return res.status(404).json({ message: 'HOD not found' });

    hod.isDeleted = true;
    hod.deletedAt = new Date();
    await hod.save();

    const user = await User.findById(hod.userId);
    if (user) {
      user.isDeleted = true;
      user.deletedAt = new Date();
      await user.save();
    }

    res.status(200).json({ message: 'HOD deleted successfully' });
  } catch (error) {
    console.error('deleteHOD Error:', error);
    res.status(500).json({ message: 'Failed to delete HOD' });
  }
};

export const createLibrarian = async (req, res) => {
  try {
    const { name, username, password, phone } = req.body;

    if (!name || !username || !password) {
      return res.status(400).json({ message: 'Name, username, and password are required.' });
    }

    const email = `${username}@librarian.edu`;
    const employeeId = `LIB-${username.toUpperCase()}`;

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      username,
      email,
      passwordHash,
      role: 'librarian',
    });

    const savedUser = await newUser.save();

    const newLibrarian = new Librarian({
      userId: savedUser._id,
      employeeId,
      phone: phone || '',
    });

    await newLibrarian.save();
    res.status(201).json({ message: 'Librarian created successfully' });
  } catch (error) {
    console.error('createLibrarian Error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Username, Email or Employee ID already exists.' });
    }
    res.status(500).json({ message: 'Failed to create Librarian' });
  }
};

export const getLibrarians = async (req, res) => {
  try {
    const librarians = await Librarian.find({ isDeleted: false })
      .populate('userId', 'name username email status');
    res.status(200).json(librarians);
  } catch (error) {
    console.error('getLibrarians Error:', error);
    res.status(500).json({ message: 'Failed to fetch librarians' });
  }
};

export const deleteLibrarian = async (req, res) => {
  try {
    const librarian = await Librarian.findById(req.params.id);
    if (!librarian) return res.status(404).json({ message: 'Librarian not found' });

    librarian.isDeleted = true;
    librarian.deletedAt = new Date();
    await librarian.save();

    const user = await User.findById(librarian.userId);
    if (user) {
      user.isDeleted = true;
      user.deletedAt = new Date();
      await user.save();
    }

    res.status(200).json({ message: 'Librarian deleted successfully' });
  } catch (error) {
    console.error('deleteLibrarian Error:', error);
    res.status(500).json({ message: 'Failed to delete Librarian' });
  }
};
