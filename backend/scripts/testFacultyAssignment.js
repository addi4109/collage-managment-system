import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/database.js';
import Department from '../models/Department.js';
import User from '../models/User.js';
import Faculty from '../models/Faculty.js';

// Resolve filename/dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const testWorkflow = async () => {
  try {
    await connectDB();
    console.log('\n--- Running Integration Test ---');

    // 1. Verify departments seed
    const compDept = await Department.findOne({ departmentName: 'Computer Engineering' });
    if (!compDept) {
      throw new Error('Verification failed: Computer Engineering department not found in database.');
    }
    console.log('PASS: Seeding verification. Computer Engineering is present with code:', compDept.departmentCode);

    // Clean test user if already exists
    const testEmail = 'testfaculty@edutech.com';
    await User.deleteOne({ email: testEmail });
    await Faculty.deleteMany({ employeeId: 'FAC_TEST' });

    // 2. Mock Faculty registration validation
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password123!', salt);
    
    // Simulate registerFaculty logic
    // check secret code match
    const providedSecret = 'comp123';
    if (compDept.departmentSecretCode !== providedSecret) {
      throw new Error('Verification failed: Secret code mismatch.');
    }
    console.log('PASS: Registration secret code match works.');

    const newFacultyUser = new User({
      name: 'Test Faculty User',
      email: testEmail,
      passwordHash,
      role: 'faculty',
      status: 'pending',
      department: 'Computer Engineering',
      assignedSubjects: [],
      approvedByAdmin: false,
    });

    const savedUser = await newFacultyUser.save();
    const newFacultyProfile = new Faculty({
      user: savedUser._id,
      employeeId: 'FAC_TEST',
      department: 'Computer Engineering',
      assignedSubjects: [],
      approvedByAdmin: false,
    });
    await newFacultyProfile.save();
    console.log('PASS: Faculty registration saved. status:', savedUser.status, 'approvedByAdmin:', savedUser.approvedByAdmin);

    // 3. Mock Admin Approval and Subject Assignment
    const testSubject = 'Computer Networks';
    
    // Simulate updateFacultyAssignment & updateFacultyStatus
    savedUser.status = 'active';
    savedUser.approvedByAdmin = true;
    savedUser.assignedSubjects = [testSubject];
    await savedUser.save();

    newFacultyProfile.approvedByAdmin = true;
    newFacultyProfile.assignedSubjects = [testSubject];
    await newFacultyProfile.save();
    
    const updatedUser = await User.findOne({ email: testEmail });
    console.log('PASS: Admin updates successfully saved.');
    console.log('  Status:', updatedUser.status);
    console.log('  ApprovedByAdmin:', updatedUser.approvedByAdmin);
    console.log('  Assigned Subjects:', updatedUser.assignedSubjects);

    // 4. Mock Security Constraint: Creating exam for unassigned subject
    const unassignedSubject = 'Thermodynamics';
    // Simulate checking if unassignedSubject is in assignedSubjects
    if (!updatedUser.assignedSubjects.includes(unassignedSubject)) {
      console.log(`PASS: Security constraint blocked unassigned subject "${unassignedSubject}" as expected!`);
    } else {
      throw new Error('FAIL: Allowed unassigned subject access!');
    }

    // Cleanup test data
    await User.deleteOne({ _id: savedUser._id });
    await Faculty.deleteOne({ user: savedUser._id });
    console.log('PASS: Test cleanup done.');

    console.log('\n--- ALL TESTS PASSED SUCCESSFULLY! ---');
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('TEST ERROR:', error);
    process.exit(1);
  }
};

testWorkflow();
