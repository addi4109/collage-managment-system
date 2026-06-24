import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import Department from '../models/Department.js';

// Resolve filename/dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const departmentsToSeed = [
  {
    departmentName: 'Computer Engineering',
    departmentCode: 'CO',
    departmentSecretCode: 'comp123',
    subjects: [
      { subjectCode: 'CO301', subjectName: 'Computer Networks' },
      { subjectCode: 'CO302', subjectName: 'Database Management Systems' },
      { subjectCode: 'CO303', subjectName: 'Data Structures & Algorithms' },
      { subjectCode: 'CO304', subjectName: 'Operating Systems' },
      { subjectCode: 'CO305', subjectName: 'Software Engineering' },
    ],
    status: 'active',
  },
  {
    departmentName: 'Information Technology',
    departmentCode: 'IT',
    departmentSecretCode: 'info123',
    subjects: [
      { subjectCode: 'IT301', subjectName: 'Web Development' },
      { subjectCode: 'IT302', subjectName: 'Cloud Computing' },
      { subjectCode: 'IT303', subjectName: 'Cyber Security' },
      { subjectCode: 'IT304', subjectName: 'Artificial Intelligence' },
      { subjectCode: 'IT305', subjectName: 'Mobile Application Development' },
    ],
    status: 'active',
  },
  {
    departmentName: 'Mechanical Engineering',
    departmentCode: 'ME',
    departmentSecretCode: 'mech123',
    subjects: [
      { subjectCode: 'ME301', subjectName: 'Thermodynamics' },
      { subjectCode: 'ME302', subjectName: 'Fluid Mechanics' },
      { subjectCode: 'ME303', subjectName: 'Theory of Machines' },
      { subjectCode: 'ME304', subjectName: 'Machine Design' },
      { subjectCode: 'ME305', subjectName: 'Heat Transfer' },
    ],
    status: 'active',
  },
  {
    departmentName: 'Civil Engineering',
    departmentCode: 'CE',
    departmentSecretCode: 'civil123',
    subjects: [
      { subjectCode: 'CE301', subjectName: 'Structural Analysis' },
      { subjectCode: 'CE302', subjectName: 'Surveying' },
      { subjectCode: 'CE303', subjectName: 'Concrete Technology' },
      { subjectCode: 'CE304', subjectName: 'Geotechnical Engineering' },
      { subjectCode: 'CE305', subjectName: 'Transportation Engineering' },
    ],
    status: 'active',
  },
  {
    departmentName: 'Chemical Engineering',
    departmentCode: 'CH',
    departmentSecretCode: 'chem123',
    subjects: [
      { subjectCode: 'CH301', subjectName: 'Chemical Reaction Engineering' },
      { subjectCode: 'CH302', subjectName: 'Mass Transfer' },
      { subjectCode: 'CH303', subjectName: 'Heat Transfer Operations' },
      { subjectCode: 'CH304', subjectName: 'Process Dynamics & Control' },
      { subjectCode: 'CH305', subjectName: 'Chemical Technology' },
    ],
    status: 'active',
  },
  {
    departmentName: 'Electronics Engineering',
    departmentCode: 'EL',
    departmentSecretCode: 'elec123',
    subjects: [
      { subjectCode: 'EL301', subjectName: 'Microprocessors & Microcontrollers' },
      { subjectCode: 'EL302', subjectName: 'Digital Signal Processing' },
      { subjectCode: 'EL303', subjectName: 'VLSI Design' },
      { subjectCode: 'EL304', subjectName: 'Embedded Systems' },
      { subjectCode: 'EL305', subjectName: 'Communication Systems' },
    ],
    status: 'active',
  },
];

const seedDepartments = async () => {
  try {
    await connectDB();
    console.log('Clearing existing departments...');
    await Department.deleteMany({});
    
    console.log('Inserting departments...');
    const created = await Department.insertMany(departmentsToSeed);
    console.log(`Successfully seeded ${created.length} departments!`);
    
    mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedDepartments();
