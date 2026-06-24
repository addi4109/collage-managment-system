import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';
import { connectDB } from '../config/database.js';
import { registerStudent, loginStudent, getProfile } from '../controllers/authController.js';
import { updateActiveDepartment, updateStudentDepartment, updateFacultyDepartments } from '../controllers/facultyController.js';

dotenv.config();

// Mock Express Request & Response helper
const mockResponse = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.jsonData = data;
    return res;
  };
  return res;
};

const runTest = async () => {
  console.log('=== Starting Department-Based Workflow Integration Tests ===');
  await connectDB();

  try {
    const studentEmail = 'test-dept-student@edutech.com';
    const studentPassword = 'password123';
    const studentName = 'Test Dept Student';
    const studentDept = 'Computer Engineering';

    const facultyEmail = 'test-dept-faculty@edutech.com';
    const facultyPassword = 'password123';
    const facultyName = 'Test Dept Faculty';

    // Cleanup old records
    const existingStudent = await User.findOne({ email: studentEmail });
    if (existingStudent) {
      await Student.deleteMany({ user: existingStudent._id });
      await User.deleteMany({ _id: existingStudent._id });
    }
    const existingFaculty = await User.findOne({ email: facultyEmail });
    if (existingFaculty) {
      await Faculty.deleteMany({ user: existingFaculty._id });
      await User.deleteMany({ _id: existingFaculty._id });
    }

    // 1. Verify Student Registration with Department
    console.log('\n--- 1. Testing Student Registration ---');
    const registerReq = {
      body: {
        name: studentName,
        email: studentEmail,
        password: studentPassword,
        department: studentDept,
      },
    };
    const registerRes = mockResponse();
    await registerStudent(registerReq, registerRes);

    if (registerRes.statusCode && registerRes.statusCode !== 201) {
      throw new Error(`Student registration failed with status code ${registerRes.statusCode}`);
    }

    const registeredStudentUser = await User.findOne({ email: studentEmail });
    if (!registeredStudentUser || registeredStudentUser.department !== studentDept) {
      throw new Error('Student User record does not have the correct department');
    }

    const registeredStudentProfile = await Student.findOne({ user: registeredStudentUser._id });
    if (!registeredStudentProfile || registeredStudentProfile.department !== studentDept) {
      throw new Error('Student Profile record does not have the correct department');
    }
    console.log('✓ Student registration with department verified successfully.');

    // 2. Testing Student Login via Email and Roll Number
    console.log('\n--- 2. Testing Student Login ---');
    
    // Set status to approved so login succeeds
    await User.findByIdAndUpdate(registeredStudentUser._id, { status: 'approved' });

    // Test Login via Email
    const loginEmailReq = {
      body: {
        email: studentEmail,
        password: studentPassword,
      },
    };
    const loginEmailRes = mockResponse();
    await loginStudent(loginEmailReq, loginEmailRes);

    if (loginEmailRes.statusCode === 401 || loginEmailRes.statusCode === 403) {
      throw new Error(`Login via Email failed: ${loginEmailRes.jsonData.message}`);
    }
    console.log('✓ Student login via Email successful.');

    // Test Login via Roll Number
    const rollNumber = registeredStudentProfile.rollNumber;
    const loginRollReq = {
      body: {
        email: rollNumber, // authController expects it in "email" body field
        password: studentPassword,
      },
    };
    const loginRollRes = mockResponse();
    await loginStudent(loginRollReq, loginRollRes);

    if (loginRollRes.statusCode === 401 || loginRollRes.statusCode === 403) {
      throw new Error(`Login via Roll Number failed: ${loginRollRes.jsonData.message}`);
    }
    console.log(`✓ Student login via Roll Number (${rollNumber}) successful.`);

    // 3. Testing Faculty Registration & Active Department
    console.log('\n--- 3. Testing Faculty Active Department Switcher ---');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(facultyPassword, salt);
    const defaultDepts = ['Computer Engineering', 'Information Technology'];

    const facultyUserDoc = new User({
      name: facultyName,
      email: facultyEmail,
      passwordHash,
      role: 'faculty',
      status: 'approved',
      departments: defaultDepts,
      activeDepartment: defaultDepts[0],
    });
    const savedFacultyUser = await facultyUserDoc.save();

    const facultyProfileDoc = new Faculty({
      user: savedFacultyUser._id,
      employeeId: 'FAC9999',
      department: defaultDepts[0],
      departments: defaultDepts,
      activeDepartment: defaultDepts[0],
    });
    await facultyProfileDoc.save();

    // Verify switching active department
    const switchDeptReq = {
      user: { id: savedFacultyUser._id.toString() },
      body: { department: 'Information Technology' },
    };
    const switchDeptRes = mockResponse();
    await updateActiveDepartment(switchDeptReq, switchDeptRes);

    if (switchDeptRes.statusCode && switchDeptRes.statusCode !== 200) {
      throw new Error(`Active department switch failed: ${switchDeptRes.jsonData.message}`);
    }

    const updatedFacultyUser = await User.findById(savedFacultyUser._id);
    if (updatedFacultyUser.activeDepartment !== 'Information Technology') {
      throw new Error('Faculty activeDepartment was not updated in User collection');
    }

    const updatedFacultyProfile = await Faculty.findOne({ user: savedFacultyUser._id });
    if (updatedFacultyProfile.activeDepartment !== 'Information Technology' || updatedFacultyProfile.department !== 'Information Technology') {
      throw new Error('Faculty activeDepartment or department was not updated in Faculty collection');
    }
    console.log('✓ Faculty switching active department verified successfully.');

    // 4. Testing Admin Department Configuration Overrides
    console.log('\n--- 4. Testing Admin Department Overrides ---');

    // Admin changes Student's department
    const overrideStudentDeptReq = {
      params: { id: registeredStudentUser._id.toString() },
      body: { department: 'Information Technology' },
    };
    const overrideStudentDeptRes = mockResponse();
    await updateStudentDepartment(overrideStudentDeptReq, overrideStudentDeptRes);

    if (overrideStudentDeptRes.statusCode && overrideStudentDeptRes.statusCode !== 200) {
      throw new Error(`Admin student department override failed: ${overrideStudentDeptRes.jsonData.message}`);
    }

    const overriddenStudentUser = await User.findById(registeredStudentUser._id);
    const overriddenStudentProfile = await Student.findOne({ user: registeredStudentUser._id });

    if (overriddenStudentUser.department !== 'Information Technology' || overriddenStudentProfile.department !== 'Information Technology') {
      throw new Error("Student's department was not correctly overridden by admin");
    }
    console.log("✓ Admin student department override successful.");

    // Admin assigns list of departments to Faculty
    const newFacultyDepts = ['Computer Engineering', 'Mechanical Engineering', 'Civil Engineering'];
    const overrideFacultyDeptsReq = {
      params: { id: savedFacultyUser._id.toString() },
      body: { departments: newFacultyDepts },
    };
    const overrideFacultyDeptsRes = mockResponse();
    await updateFacultyDepartments(overrideFacultyDeptsReq, overrideFacultyDeptsRes);

    if (overrideFacultyDeptsRes.statusCode && overrideFacultyDeptsRes.statusCode !== 200) {
      throw new Error(`Admin faculty departments override failed: ${overrideFacultyDeptsRes.jsonData.message}`);
    }

    const overriddenFacultyUser = await User.findById(savedFacultyUser._id);
    const overriddenFacultyProfile = await Faculty.findOne({ user: savedFacultyUser._id });

    if (JSON.stringify(overriddenFacultyUser.departments) !== JSON.stringify(newFacultyDepts) ||
        JSON.stringify(overriddenFacultyProfile.departments) !== JSON.stringify(newFacultyDepts)) {
      throw new Error("Faculty's departments list was not correctly overridden by admin");
    }

    // Since the previous active department (Information Technology) is not in the new list, it must have defaulted to the first one (Computer Engineering)
    if (overriddenFacultyUser.activeDepartment !== 'Computer Engineering' || overriddenFacultyProfile.activeDepartment !== 'Computer Engineering') {
      throw new Error("Faculty activeDepartment did not fallback correctly after admin override");
    }
    console.log("✓ Admin faculty departments override and fallback successful.");

    // Clean up
    await Student.deleteMany({ user: registeredStudentUser._id });
    await User.deleteMany({ _id: registeredStudentUser._id });
    await Faculty.deleteMany({ user: savedFacultyUser._id });
    await User.deleteMany({ _id: savedFacultyUser._id });

    console.log('\n=== All Department-Based Workflow Integration Tests Passed Successfully! ===');

  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

runTest();
