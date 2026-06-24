import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';
import Admin from '../models/Admin.js';
import Department from '../models/Department.js';
import { clearUserCache } from '../middleware/authMiddleware.js';

// Cache for full profile responses to reduce database lookups
const profileCache = new Map();
const PROFILE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const clearProfileCache = (userId) => {
  if (userId) {
    profileCache.delete(userId.toString());
  } else {
    profileCache.clear();
  }
};

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, userId: user._id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

export const registerStudent = async (req, res) => {
  const { name, email, password, department, semester } = req.body;

  if (!name || !email || !password || !department || !semester) {
    return res.status(400).json({ message: 'Please provide name, email, password, department, and semester.' });
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
      department,
      semester,
    });

    const savedUser = await newUser.save();

    const newStudent = new Student({
      user: savedUser._id,
      rollNumber: 'STU' + Math.floor(100000 + Math.random() * 900000),
      department,
      semester,
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
        department: savedUser.department,
        semester: savedUser.semester,
        createdAt: savedUser.createdAt,
      },
    });
  } catch (error) {
    console.error('Student registration error:', error);
    res.status(500).json({ message: 'Internal server error during registration.' });
  }
};
export const registerFaculty = async (req, res) => {
  const { name, email, password, department, departmentSecretCode } = req.body;

  if (!name || !email || !password || !department || !departmentSecretCode) {
    return res.status(400).json({ message: 'Please provide name, email, password, department, and department secret code.' });
  }

  try {
    const dept = await Department.findOne({ departmentName: department, status: 'active' });
    if (!dept) {
      return res.status(400).json({ message: 'Selected department is not active or does not exist.' });
    }
    if (dept.departmentSecretCode !== departmentSecretCode) {
      return res.status(400).json({ message: 'Invalid secret code for selected department. Registration denied.' });
    }

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
      status: 'pending',
      department,
      assignedSubjects: [],
      approvedByAdmin: false,
    });

    const savedUser = await newUser.save();

    const newFaculty = new Faculty({
      user: savedUser._id,
      employeeId: 'FAC' + Math.floor(1000 + Math.random() * 9000),
      department,
      assignedSubjects: [],
      approvedByAdmin: false,
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
        department: savedUser.department,
        assignedSubjects: savedUser.assignedSubjects,
        approvedByAdmin: savedUser.approvedByAdmin,
        createdAt: savedUser.createdAt,
      },
    });
  } catch (error) {
    console.error('Faculty registration error:', error);
    res.status(500).json({ message: 'Internal server error during registration.' });
  }
};
export const loginStudent = async (req, res) => {
  const { email, password } = req.body; // email field holds rollNumber or email
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide roll number/email and password.' });
  }

  try {
    let query = {};
    if (email.includes('@')) {
      query = { email: email.toLowerCase() };
    } else {
      // Find Student with this rollNumber
      const studentProfile = await Student.findOne({ rollNumber: email.trim() });
      if (!studentProfile) {
        return res.status(401).json({ message: 'Invalid credentials or student roll number not found.' });
      }
      query = { _id: studentProfile.user };
    }

    const user = await User.findOne(query).select('_id role passwordHash name email status department semester');
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

    // Invalidate caches
    clearUserCache(user._id);
    clearProfileCache(user._id);

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        role: user.role,
        department: user.department,
        semester: user.semester,
      },
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
export const loginFaculty = async (req, res) => {
  console.log('[DEBUG] Server: Faculty login - Request received');
  const { email, password } = req.body;
  if (!email || !password) {
    console.log('[DEBUG] Server: Faculty login - Missing email or password');
    return res.status(400).json({ message: 'Please provide email and password.' });
  }

  try {
    const user = await User.findOne({ email }).select('_id role passwordHash name email status department assignedSubjects approvedByAdmin');
    if (!user || user.role !== 'faculty') {
      console.log('[DEBUG] Server: Faculty login - User not found or role mismatch');
      return res.status(401).json({ message: 'Invalid credentials or faculty account not found.' });
    }
    console.log('[DEBUG] Server: Faculty login - User found');

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      console.log('[DEBUG] Server: Faculty login - Password verification failed');
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    console.log('[DEBUG] Server: Faculty login - Password verified');

    if (user.status === 'pending') {
      console.log('[DEBUG] Server: Faculty login - Status is pending');
      return res.status(403).json({ message: 'Faculty account is awaiting administrator approval.' });
    }
    if (user.status === 'rejected') {
      console.log('[DEBUG] Server: Faculty login - Status is rejected');
      return res.status(403).json({ message: 'Your account request has been rejected.' });
    }
    if (user.status === 'suspended') {
      console.log('[DEBUG] Server: Faculty login - Status is suspended');
      return res.status(403).json({ message: 'Your account has been suspended. Contact administration.' });
    }
    if (user.status !== 'approved' && user.status !== 'active') {
      console.log('[DEBUG] Server: Faculty login - Status is not approved/active');
      return res.status(403).json({ message: 'Your account is not approved.' });
    }

    clearUserCache(user._id);
    clearProfileCache(user._id);

    const token = generateToken(user);
    console.log('[DEBUG] Server: Faculty login - Token generated');

    console.log('[DEBUG] Server: Faculty login - Response sent');
    res.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        role: user.role,
        department: user.department,
        assignedSubjects: user.assignedSubjects || [],
        approvedByAdmin: user.approvedByAdmin || false,
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
    const user = await User.findOne({ email }).select('_id role passwordHash name email status');
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

    clearUserCache(user._id);
    clearProfileCache(user._id);

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        role: user.role,
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
  const cacheKey = req.user.id;
  const now = Date.now();
  
  const cachedProfile = profileCache.get(cacheKey);
  if (cachedProfile && (now - cachedProfile.timestamp < PROFILE_CACHE_TTL)) {
    return res.json(cachedProfile.data);
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User profile not found.' });
    }
    const profileData = {
      uid: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      status: user.status,
      department: user.department,
      semester: user.semester,
      assignedSubjects: user.assignedSubjects || [],
      approvedByAdmin: user.approvedByAdmin || false,
      createdAt: user.createdAt,
    };

    profileCache.set(cacheKey, {
      data: profileData,
      timestamp: now,
    });

    res.json(profileData);
  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ message: 'Internal server error fetching profile.' });
  }
};
