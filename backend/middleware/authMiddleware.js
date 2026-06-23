import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'User account is inactive.' });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    };
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
