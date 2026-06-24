import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// In-memory cache for authenticated users to reduce MongoDB lookups on repeated requests
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const now = Date.now();
    
    // Check if the user is cached and the cache entry is still valid
    const cachedEntry = userCache.get(decoded.id);
    if (cachedEntry && (now - cachedEntry.timestamp < CACHE_TTL)) {
      req.user = cachedEntry.user;
      return next();
    }

    // Optimize DB lookup: Select only required fields
    const user = await User.findById(decoded.id).select('_id email name role status department departments activeDepartment');

    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'User account is inactive.' });
    }

    const requestUser = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      department: user.department,
      departments: user.departments,
      activeDepartment: user.activeDepartment,
    };

    // Store in cache
    userCache.set(user._id.toString(), {
      user: requestUser,
      timestamp: now,
    });

    req.user = requestUser;
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    return res.status(403).json({ message: 'Invalid or expired token.' });
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
