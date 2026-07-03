import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Faculty from '../models/Faculty.js';
import Student from '../models/Student.js';
import { verifyCaptcha } from '../utils/captcha.js';

const JWT_SECRET = process.env.JWT_SECRET || 'edutech_hub_jwt_secret_token_key_987654321';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'edutech_hub_jwt_refresh_secret_token_key_123456789';

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

export const login = async ({ credential, password, role, captchaToken, captchaValue }) => {
  // 1. Verify text CAPTCHA
  const isCaptchaValid = verifyCaptcha(captchaToken, captchaValue);
  if (!isCaptchaValid) {
    throw new Error('Invalid or expired CAPTCHA challenge.');
  }

  let user;

  // 2. Find User based on role credentials
  if (role === 'student') {
    // Students log in using their enrollmentNumber
    const studentProfile = await Student.findOne({ enrollmentNumber: credential, isDeleted: false });
    if (!studentProfile) {
      throw new Error('Invalid enrollment number or password.');
    }
    user = await User.findOne({ _id: studentProfile.userId, role: 'student', isDeleted: false });
  } else if (role === 'faculty') {
    // Faculty log in using username or email
    user = await User.findOne({
      $or: [{ email: credential.toLowerCase() }, { username: credential.toLowerCase() }],
      role: 'faculty',
      isDeleted: false,
    });
  } else if (role === 'admin') {
    // Admins log in using username or email
    user = await User.findOne({
      $or: [{ email: credential.toLowerCase() }, { username: credential.toLowerCase() }],
      role: 'admin',
      isDeleted: false,
    });
  } else {
    throw new Error('Invalid login portal role.');
  }

  if (!user) {
    throw new Error('Invalid credentials.');
  }

  // 3. Verify Password
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new Error('Invalid credentials.');
  }

  if (user.status !== 'active') {
    throw new Error('Your account is inactive or suspended. Please contact Admin.');
  }

  // 4. Generate Tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Return sanitized user details
  const userData = {
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
  };

  if (user.role === 'faculty') {
    const facultyProfile = await Faculty.findOne({ userId: user._id, isDeleted: false })
      .populate('assignedDepartments', 'name code');
    if (facultyProfile) {
      userData.employeeId = facultyProfile.employeeId;
      userData.assignedDepartments = (facultyProfile.assignedDepartments || [])
        .filter(Boolean)
        .map(d => d._id.toString());
      userData.assignedDepartmentDetails = (facultyProfile.assignedDepartments || [])
        .filter(Boolean)
        .map(d => ({ id: d._id.toString(), name: d.name, code: d.code }));
      userData.assignedYears = facultyProfile.assignedYears;
      userData.phone = facultyProfile.phone;
    } else {
      userData.employeeId = '';
      userData.assignedDepartments = [];
      userData.assignedDepartmentDetails = [];
      userData.assignedYears = [];
      userData.phone = '';
    }
  } else if (user.role === 'student') {
    const studentProfile = await Student.findOne({ userId: user._id, isDeleted: false })
      .populate('departmentId', 'name code');
    if (studentProfile) {
      userData.rollNumber = studentProfile.rollNumber;
      userData.enrollmentNumber = studentProfile.enrollmentNumber;
      userData.departmentId = studentProfile.departmentId?._id?.toString() || '';
      userData.departmentName = studentProfile.departmentId?.name || '';
      userData.year = studentProfile.year;
      userData.semester = studentProfile.semester;
      userData.phone = studentProfile.phone;
      userData.parentName = studentProfile.parentName;
      userData.parentMobile = studentProfile.parentMobile;
      userData.address = studentProfile.address;
    }
  }

  return {
    user: userData,
    accessToken,
    refreshToken,
  };
};

export const refresh = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = await User.findOne({ _id: decoded.id, isDeleted: false });

    if (!user || user.status !== 'active') {
      throw new Error('Invalid session or inactive user.');
    }

    const accessToken = generateAccessToken(user);
    return { accessToken };
  } catch (err) {
    throw new Error('Session expired or invalid refresh token.');
  }
};
