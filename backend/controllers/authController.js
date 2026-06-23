import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';
import Admin from '../models/Admin.js';

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

export const registerStudent = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide name, email, and password.' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      passwordHash,
      role: 'student',
      status: 'active',
    });

    const savedUser = await newUser.save();

    const newStudent = new Student({
      user: savedUser._id,
      rollNumber: 'STU' + Math.floor(100000 + Math.random() * 900000),
      department: 'Computer Science',
    });
    await newStudent.save();

    const token = generateToken(savedUser);

    res.status(201).json({
      token,
      user: {
        uid: savedUser._id.toString(),
        email: savedUser.email,
        name: savedUser.name,
        role: savedUser.role,
        status: savedUser.status,
        createdAt: savedUser.createdAt,
      },
    });
  } catch (error) {
    console.error('Student registration error:', error);
    res.status(500).json({ message: 'Internal server error during registration.' });
  }
};

export const registerFaculty = async (req, res) => {
  const { name, email, password, authCode } = req.body;

  if (!name || !email || !password || !authCode) {
    return res.status(400).json({ message: 'Please provide name, email, password, and secret passcode.' });
  }

  if (authCode !== 'faculty123') {
    return res.status(400).json({ message: 'Invalid secret passcode. Registration denied.' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      passwordHash,
      role: 'faculty',
      status: 'active',
    });

    const savedUser = await newUser.save();

    const newFaculty = new Faculty({
      user: savedUser._id,
      employeeId: 'FAC' + Math.floor(1000 + Math.random() * 9000),
      department: 'Engineering',
    });
    await newFaculty.save();

    const token = generateToken(savedUser);

    res.status(201).json({
      token,
      user: {
        uid: savedUser._id.toString(),
        email: savedUser.email,
        name: savedUser.name,
        role: savedUser.role,
        status: savedUser.status,
        createdAt: savedUser.createdAt,
      },
    });
  } catch (error) {
    console.error('Faculty registration error:', error);
    res.status(500).json({ message: 'Internal server error during registration.' });
  }
};

export const loginStudent = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user || user.role !== 'student') {
      return res.status(401).json({ message: 'Invalid credentials or student account not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({ message: 'Your account is pending administrator approval.' });
    }
    if (user.status === 'rejected') {
      return res.status(403).json({ message: 'Your account request has been rejected.' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'Your account has been suspended. Contact administration.' });
    }
    if (user.status !== 'approved' && user.status !== 'active') {
      return res.status(403).json({ message: 'Your account is not approved.' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        uid: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const loginFaculty = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user || user.role !== 'faculty') {
      return res.status(401).json({ message: 'Invalid credentials or faculty account not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({ message: 'Faculty account is awaiting administrator approval.' });
    }
    if (user.status === 'rejected') {
      return res.status(403).json({ message: 'Your account request has been rejected.' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'Your account has been suspended. Contact administration.' });
    }
    if (user.status !== 'approved' && user.status !== 'active') {
      return res.status(403).json({ message: 'Your account is not approved.' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        uid: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Faculty login error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user || user.role !== 'admin') {
      return res.status(401).json({ message: 'Invalid credentials or administrator account not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({ message: 'Your account is pending administrator approval.' });
    }
    if (user.status === 'rejected') {
      return res.status(403).json({ message: 'Your account request has been rejected.' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'Your account has been suspended. Contact administration.' });
    }
    if (user.status !== 'approved' && user.status !== 'active') {
      return res.status(403).json({ message: 'Your account is not approved.' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        uid: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const logout = (req, res) => {
  res.json({ message: 'Logout successful.' });
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Please provide your email address.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account with this email address exists.' });
    }
    res.json({ message: `A password reset link has been dispatched to ${email}.` });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User profile not found.' });
    }

    const profileData = {
      uid: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    };

    if (user.role === 'student') {
      const studentDoc = await Student.findOne({ user: user._id });
      if (studentDoc) {
        profileData.rollNumber = studentDoc.rollNumber;
        profileData.department = studentDoc.department;
        profileData.enrolledCourses = studentDoc.enrolledCourses;
      }
    } else if (user.role === 'faculty') {
      const facultyDoc = await Faculty.findOne({ user: user._id });
      if (facultyDoc) {
        profileData.employeeId = facultyDoc.employeeId;
        profileData.department = facultyDoc.department;
        profileData.isHOD = facultyDoc.isHOD;
      }
    }

    res.json(profileData);
  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ message: 'Internal server error fetching profile.' });
  }
};
