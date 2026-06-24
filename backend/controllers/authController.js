import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';
import Admin from '../models/Admin.js';
import Department from '../models/Department.js';
import { clearUserCache } from '../middleware/authMiddleware.js';

// Cache for full profile responses (non-faculty only) to reduce DB lookups
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

// ──────────────────────────────────────────────────────────
// ADMIN: Create Faculty Account
// Only admin can create faculty accounts. No public registration.
// ──────────────────────────────────────────────────────────
export const adminCreateFaculty = async (req, res) => {
  const { name, username, email, password, department, assignedYear, assignedSubjects, employeeId, phone } = req.body;

  if (!name || !username || !password || !department) {
    return res.status(400).json({ message: 'Name, username, password, and department are required.' });
  }

  try {
    // Check username uniqueness
    const existingUsername = await User.findOne({ username: username.toLowerCase().trim() });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already taken. Please choose a different username.' });
    }

    // Check email uniqueness if provided
    if (email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingEmail) {
        return res.status(400).json({ message: 'An account with this email already exists.' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      username: username.toLowerCase().trim(),
      email: email ? email.toLowerCase().trim() : undefined,
      passwordHash,
      role: 'faculty',
      status: 'approved',
      approvedByAdmin: true,
      department,
      assignedYear: assignedYear || '',
      assignedSubjects: assignedSubjects || [],
      employeeId: employeeId || 'FAC' + Math.floor(1000 + Math.random() * 9000),
      phone: phone || '',
    });

    const savedUser = await newUser.save();

    const newFaculty = new Faculty({
      user: savedUser._id,
      employeeId: savedUser.employeeId,
      department,
      assignedSubjects: assignedSubjects || [],
      approvedByAdmin: true,
    });
    await newFaculty.save();

    res.status(201).json({
      success: true,
      message: 'Faculty account created successfully.',
      user: {
        uid: savedUser._id.toString(),
        name: savedUser.name,
        username: savedUser.username,
        email: savedUser.email,
        role: savedUser.role,
        status: savedUser.status,
        department: savedUser.department,
        assignedYear: savedUser.assignedYear,
        assignedSubjects: savedUser.assignedSubjects,
        employeeId: savedUser.employeeId,
        phone: savedUser.phone,
        createdAt: savedUser.createdAt,
      },
    });
  } catch (error) {
    console.error('Admin create faculty error:', error);
    res.status(500).json({ message: 'Internal server error creating faculty account.' });
  }
};

// ──────────────────────────────────────────────────────────
// ADMIN: Update Faculty Account
// ──────────────────────────────────────────────────────────
export const adminUpdateFaculty = async (req, res) => {
  const { id } = req.params;
  const { name, username, email, password, department, assignedYear, assignedSubjects, employeeId, phone, status } = req.body;

  try {
    const user = await User.findById(id);
    if (!user || user.role !== 'faculty') {
      return res.status(404).json({ message: 'Faculty account not found.' });
    }

    // Check username uniqueness if being changed
    if (username && username.toLowerCase().trim() !== user.username) {
      const existing = await User.findOne({ username: username.toLowerCase().trim() });
      if (existing) {
        return res.status(400).json({ message: 'Username already taken.' });
      }
      user.username = username.toLowerCase().trim();
    }

    if (email && email.toLowerCase().trim() !== user.email) {
      const existing = await User.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        return res.status(400).json({ message: 'Email already in use.' });
      }
      user.email = email.toLowerCase().trim();
    }

    if (name) user.name = name;
    if (department) user.department = department;
    if (assignedYear !== undefined) user.assignedYear = assignedYear;
    if (assignedSubjects) user.assignedSubjects = assignedSubjects;
    if (employeeId) user.employeeId = employeeId;
    if (phone !== undefined) user.phone = phone;
    if (status) {
      user.status = status;
      user.approvedByAdmin = (status === 'approved' || status === 'active');
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(password, salt);
    }

    await user.save();

    // Sync Faculty profile doc
    const facultyProfile = await Faculty.findOne({ user: user._id });
    if (facultyProfile) {
      if (department) facultyProfile.department = department;
      if (assignedSubjects) facultyProfile.assignedSubjects = assignedSubjects;
      if (status) facultyProfile.approvedByAdmin = user.approvedByAdmin;
      if (employeeId) facultyProfile.employeeId = employeeId;
      await facultyProfile.save();
    }

    clearUserCache(user._id);
    clearProfileCache(user._id);

    res.json({
      success: true,
      message: 'Faculty account updated.',
      user: {
        uid: user._id.toString(),
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        department: user.department,
        assignedYear: user.assignedYear,
        assignedSubjects: user.assignedSubjects,
        employeeId: user.employeeId,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error('Admin update faculty error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// ──────────────────────────────────────────────────────────
// ADMIN: Delete Faculty Account
// ──────────────────────────────────────────────────────────
export const adminDeleteFaculty = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user || user.role !== 'faculty') {
      return res.status(404).json({ message: 'Faculty account not found.' });
    }

    await Faculty.deleteOne({ user: user._id });
    await User.deleteOne({ _id: user._id });

    clearUserCache(user._id);
    clearProfileCache(user._id);

    res.json({ success: true, message: 'Faculty account deleted successfully.' });
  } catch (error) {
    console.error('Admin delete faculty error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// ──────────────────────────────────────────────────────────
// STUDENT LOGIN
// Uses username or rollNumber (no email lookup)
// ──────────────────────────────────────────────────────────
export const loginStudent = async (req, res) => {
  const { email, password } = req.body; // 'email' field holds username or rollNumber from frontend
  const identifier = email; // rename for clarity

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Please provide username and password.' });
  }

  try {
    let user;

    // Try username lookup first
    user = await User.findOne({ username: identifier.toLowerCase().trim() })
      .select('_id role passwordHash name username email status department semester rollNumber enrollmentNumber year phone');

    // Fallback: try rollNumber lookup via Student model
    if (!user) {
      const studentProfile = await Student.findOne({ rollNumber: identifier.trim() });
      if (studentProfile) {
        user = await User.findById(studentProfile.user)
          .select('_id role passwordHash name username email status department semester rollNumber enrollmentNumber year phone');
      }
    }

    if (!user || user.role !== 'student') {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({ message: 'Your account is not yet active. Contact your faculty.' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'Your account has been suspended. Contact administration.' });
    }
    if (user.status !== 'approved' && user.status !== 'active') {
      return res.status(403).json({ message: 'Your account is not active.' });
    }

    clearUserCache(user._id);
    clearProfileCache(user._id);

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        username: user.username,
        role: user.role,
        department: user.department,
        year: user.year,
        semester: user.semester,
        rollNumber: user.rollNumber,
        enrollmentNumber: user.enrollmentNumber,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// ──────────────────────────────────────────────────────────
// FACULTY LOGIN
// Uses username or email
// ──────────────────────────────────────────────────────────
export const loginFaculty = async (req, res) => {
  console.log('[DEBUG] Server: Faculty login - Request received');
  const { email, password } = req.body; // 'email' can be username or email
  const identifier = email;

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Please provide username and password.' });
  }

  try {
    // Try username lookup first, then email
    let user = await User.findOne({ username: identifier.toLowerCase().trim() })
      .select('_id role passwordHash name username email status department assignedSubjects assignedYear approvedByAdmin');

    if (!user) {
      user = await User.findOne({ email: identifier.toLowerCase().trim() })
        .select('_id role passwordHash name username email status department assignedSubjects assignedYear approvedByAdmin');
    }

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

    clearUserCache(user._id);
    clearProfileCache(user._id);

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        username: user.username,
        role: user.role,
        department: user.department,
        assignedSubjects: user.assignedSubjects || [],
        assignedYear: user.assignedYear || '',
        approvedByAdmin: user.approvedByAdmin || false,
      },
    });
  } catch (error) {
    console.error('Faculty login error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// ──────────────────────────────────────────────────────────
// ADMIN LOGIN
// ──────────────────────────────────────────────────────────
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

    if (user.status === 'pending') return res.status(403).json({ message: 'Your account is pending approval.' });
    if (user.status === 'rejected') return res.status(403).json({ message: 'Your account request has been rejected.' });
    if (user.status === 'suspended') return res.status(403).json({ message: 'Your account has been suspended.' });
    if (user.status !== 'approved' && user.status !== 'active') {
      return res.status(403).json({ message: 'Your account is not approved.' });
    }

    clearUserCache(user._id);
    clearProfileCache(user._id);

    const token = generateToken(user);
    res.json({
      token,
      user: { id: user._id.toString(), name: user.name, role: user.role },
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

// ──────────────────────────────────────────────────────────
// GET PROFILE
// ──────────────────────────────────────────────────────────
export const getProfile = async (req, res) => {
  const cacheKey = req.user.id;
  const now = Date.now();

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User profile not found.' });
    }

    // Block pending/rejected/suspended faculty from using token
    if (user.role === 'faculty' && (user.status === 'pending' || user.status === 'rejected')) {
      return res.status(403).json({
        message: user.status === 'pending'
          ? 'Your account is awaiting administrator approval.'
          : 'Your account registration has been rejected. Contact the administrator.',
      });
    }
    if (user.role === 'faculty' && user.status === 'suspended') {
      return res.status(403).json({ message: 'Your account has been suspended.' });
    }

    const profileData = {
      uid: user._id.toString(),
      id: user._id.toString(),
      email: user.email || '',
      username: user.username || '',
      role: user.role,
      name: user.name,
      status: user.status,
      department: user.department || '',
      semester: user.semester || '',
      year: user.year || '',
      rollNumber: user.rollNumber || '',
      enrollmentNumber: user.enrollmentNumber || '',
      phone: user.phone || '',
      parentName: user.parentName || '',
      parentMobile: user.parentMobile || '',
      assignedSubjects: user.assignedSubjects || [],
      assignedSemester: user.assignedSemester || null,
      assignedYear: user.assignedYear || '',
      employeeId: user.employeeId || '',
      approvedByAdmin: user.approvedByAdmin || false,
      createdByFaculty: user.createdByFaculty || null,
      createdAt: user.createdAt,
    };

    // Only cache non-faculty profiles
    if (user.role !== 'faculty') {
      profileCache.set(cacheKey, { data: profileData, timestamp: now });
    }

    res.json(profileData);
  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ message: 'Internal server error fetching profile.' });
  }
};
