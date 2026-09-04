import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Department from '../models/Department.js';
import Subject from '../models/Subject.js';
import { connectDB } from '../config/database.js';

dotenv.config();

const departmentsData = [
  { name: 'Computer Engineering', code: 'CO' },
  { name: 'Information Technology', code: 'IT' },
  { name: 'Mechanical Engineering', code: 'ME' },
  { name: 'Civil Engineering', code: 'CE' },
  { name: 'Chemical Engineering', code: 'CH' },
  { name: 'Electronics Engineering', code: 'EE' },
];

const yearsList = ['First Year', 'Second Year', 'Third Year'];
const semestersMap = {
  'First Year': ['Sem 1', 'Sem 2'],
  'Second Year': ['Sem 3', 'Sem 4'],
  'Third Year': ['Sem 5', 'Sem 6'],
};

const sampleSubjects = {
  'CO': {
    'Sem 1': ['Applied Mathematics I', 'Basic Electrical', 'Applied Physics I'],
    'Sem 2': ['Applied Mathematics II', 'Programming in C', 'Engineering Drawing'],
    'Sem 3': ['Data Structures & Algorithms', 'Discrete Mathematics', 'Digital Logic Design'],
    'Sem 4': ['Java Programming', 'Database Management Systems', 'Computer Networks'],
    'Sem 5': ['Software Engineering', 'Theory of Computation', 'Operating Systems'],
    'Sem 6': ['Artificial Intelligence', 'Cloud Computing', 'Cryptography & Security'],
  },
  'IT': {
    'Sem 1': ['Applied Mathematics I', 'Fundamentals of IT', 'Basic Electrical'],
    'Sem 2': ['Applied Mathematics II', 'Web Programming I', 'Computer Organization'],
    'Sem 3': ['Object Oriented Programming', 'Database Systems', 'Principles of Communication'],
    'Sem 4': ['Python Programming', 'Software Engineering', 'Computer Network Protocols'],
    'Sem 5': ['Internet of Things', 'Information Security', 'Advanced Web Development'],
    'Sem 6': ['Mobile App Development', 'Big Data Analytics', 'Cloud Services'],
  },
  'ME': {
    'Sem 1': ['Applied Mathematics I', 'Engineering Physics', 'Basic Mechanical Eng'],
    'Sem 2': ['Applied Mathematics II', 'Engineering Chemistry', 'Engineering Mechanics'],
    'Sem 3': ['Strength of Materials', 'Thermodynamics', 'Production Processes'],
    'Sem 4': ['Fluid Mechanics', 'Theory of Machines', 'Material Science'],
    'Sem 5': ['Heat Transfer', 'Machine Design I', 'Dynamics of Machinery'],
    'Sem 6': ['Machine Design II', 'Internal Combustion Engines', 'CAD/CAM'],
  },
  'CE': {
    'Sem 1': ['Applied Mathematics I', 'Engineering Drawing', 'Applied Physics I'],
    'Sem 2': ['Applied Mathematics II', 'Basic Surveying', 'Applied Chemistry'],
    'Sem 3': ['Mechanics of Solids', 'Fluid Mechanics I', 'Concrete Technology'],
    'Sem 4': ['Structural Analysis I', 'Advanced Surveying', 'Environmental Engineering I'],
    'Sem 5': ['Structural Analysis II', 'Geotechnical Engineering I', 'Transportation Engineering I'],
    'Sem 6': ['Design of Steel Structures', 'Water Resources Engineering', 'Foundation Engineering'],
  },
  'CH': {
    'Sem 1': ['Applied Mathematics I', 'Applied Physics I', 'Introduction to Chemical Eng'],
    'Sem 2': ['Applied Mathematics II', 'Organic Chemistry', 'Engineering Drawing'],
    'Sem 3': ['Fluid Flow Operations', 'Chemical Process Calculations', 'Mechanical Operations'],
    'Sem 4': ['Heat Transfer Operations', 'Chemical Eng Thermodynamics I', 'Process Instrumentation'],
    'Sem 5': ['Mass Transfer Operations I', 'Chemical Reaction Eng I', 'Chemical Eng Thermodynamics II'],
    'Sem 6': ['Mass Transfer Operations II', 'Chemical Reaction Eng II', 'Process Dynamics & Control'],
  },
  'EE': {
    'Sem 1': ['Applied Mathematics I', 'Basic Electrical Engineering', 'Applied Physics I'],
    'Sem 2': ['Applied Mathematics II', 'Electronic Devices & Circuits', 'Engineering Drawing'],
    'Sem 3': ['Electrical Networks', 'Digital Electronics', 'Electrical Measurements'],
    'Sem 4': ['Control Systems', 'Electrical Machines I', 'Signals & Systems'],
    'Sem 5': ['Microprocessors', 'Electrical Machines II', 'Power Systems I'],
    'Sem 6': ['Power Electronics', 'Power Systems II', 'Electromagnetic Fields'],
  }
};

const seed = async () => {
  console.log('Starting College ERP database seeding...');
  await connectDB();

  try {
    const db = mongoose.connection.db;

    // Drop legacy collections to clear indices completely
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    if (collectionNames.includes('users')) {
      console.log('Dropping users collection...');
      await db.collection('users').drop();
    }
    if (collectionNames.includes('departments')) {
      console.log('Dropping departments collection...');
      await db.collection('departments').drop();
    }
    if (collectionNames.includes('subjects')) {
      console.log('Dropping subjects collection...');
      await db.collection('subjects').drop();
    }
    if (collectionNames.includes('faculties')) {
      console.log('Dropping faculties collection...');
      await db.collection('faculties').drop();
    }
    if (collectionNames.includes('students')) {
      console.log('Dropping students collection...');
      await db.collection('students').drop();
    }

    // 1. Seed Admin
    const adminEmail = 'admin@edutech.com';
    const adminUsername = 'admin';
    const adminPassword = 'admin@4109@';

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    const adminUser = new User({
      name: 'System Administrator',
      email: adminEmail,
      username: adminUsername,
      passwordHash,
      role: 'admin',
      status: 'active',
    });

    await adminUser.save();
    console.log(`Seeded default Admin: ${adminEmail} (password: ${adminPassword})`);

    // 2. Seed Departments
    console.log('Seeding departments...');
    const createdDepts = [];
    for (const d of departmentsData) {
      const dept = new Department({
        name: d.name,
        code: d.code,
        years: yearsList.map(y => ({
          name: y,
          semesters: semestersMap[y]
        }))
      });
      const savedDept = await dept.save();
      createdDepts.push(savedDept);
      console.log(`Seeded department: ${dept.name} (${dept.code})`);
    }

    // 3. Seed Subjects linked to departments
    console.log('Seeding subjects...');
    for (const dept of createdDepts) {
      const deptCode = dept.code;
      const subjectsForDept = sampleSubjects[deptCode];

      if (subjectsForDept) {
        for (const year of yearsList) {
          const sems = semestersMap[year];
          for (const sem of sems) {
            const subjectList = subjectsForDept[sem];
            if (subjectList) {
              for (let i = 0; i < subjectList.length; i++) {
                const subName = subjectList[i];
                const subCode = `${deptCode}-${sem.replace(' ', '')}-0${i + 1}`;
                
                const subject = new Subject({
                  name: subName,
                  code: subCode,
                  departmentId: dept._id,
                  year: year,
                  semester: sem,
                });
                await subject.save();
              }
            }
          }
        }
        console.log(`Seeded subjects for department: ${dept.name}`);
      }
    }

    console.log('Database seeding completed successfully!');
  } catch (err) {
    console.error('Error during database seeding:', err);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

seed();
