import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Faculty from '../models/Faculty.js';
import Student from '../models/Student.js';

// In-memory cache for user auth context to optimize DB queries
const userCache = new Map();
const CACHE_TTL = 30 * 1000; // 30 seconds cache (short cache to reflect status changes quickly)

export const clearUserCache = (userId) => {
  if (userId) {
    userCache.delete(userId.toString());
  } else {
    userCache.clear();
  }
};

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'edutech_hub_jwt_secret_token_key_987654321');
    const now = Date.now();

    // Check cache
    const cachedEntry = userCache.get(decoded.id);
    if (cachedEntry && (now - cachedEntry.timestamp < CACHE_TTL)) {
      req.user = cachedEntry.user;
      return next();
    }

    // Fetch user from DB
    const user = await User.findOne({ _id: decoded.id, isDeleted: false });
    if (!user) {
      return res.status(401).json({ message: 'User not found or deleted.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'User account is suspended/inactive.' });
    }

    const requestUser = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      username: user.username,
      role: user.role,
      status: user.status,
    };

    // Load dynamic scopes based on Role
    if (user.role === 'faculty') {
      const facultyProfile = await Faculty.findOne({ userId: user._id, isDeleted: false });
      if (facultyProfile) {
        requestUser.employeeId = facultyProfile.employeeId;
        requestUser.assignedDepartments = (facultyProfile.assignedDepartments || [])
          .filter(Boolean)
          .map(id => id.toString());
        requestUser.assignedYears = facultyProfile.assignedYears || [];
        requestUser.phone = facultyProfile.phone;
      } else {
        requestUser.employeeId = '';
        requestUser.assignedDepartments = [];
        requestUser.assignedYears = [];
        requestUser.phone = '';
      }
    } else if (user.role === 'student') {
      const studentProfile = await Student.findOne({ userId: user._id, isDeleted: false });
      if (studentProfile) {
        requestUser.rollNumber = studentProfile.rollNumber;
        requestUser.enrollmentNumber = studentProfile.enrollmentNumber;
        requestUser.departmentId = studentProfile.departmentId.toString();
        requestUser.year = studentProfile.year;
        requestUser.semester = studentProfile.semester;
        requestUser.phone = studentProfile.phone;
        requestUser.parentName = studentProfile.parentName;
        requestUser.parentMobile = studentProfile.parentMobile;
        requestUser.address = studentProfile.address;
      }
    }

    // Cache user context
    userCache.set(user._id.toString(), {
      user: requestUser,
      timestamp: now,
    });

    req.user = requestUser;
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    return res.status(403).json({ message: 'Invalid or expired access token.' });
  }
};

export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden. Insufficient permissions.' });
    }
    next();
  };
};
