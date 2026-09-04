import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Application from './models/Application.js';

dotenv.config();

const migrateApplications = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const resultStudentFaculty = await Application.updateMany(
      { status: 'pending', applicantRole: { $in: ['student', 'faculty'] } },
      { $set: { status: 'pending_hod' } }
    );
    console.log(`Migrated student/faculty pending apps to pending_hod: ${resultStudentFaculty.modifiedCount}`);

    const resultHod = await Application.updateMany(
      { status: 'pending', applicantRole: 'hod' },
      { $set: { status: 'pending_principal' } }
    );
    console.log(`Migrated hod pending apps to pending_principal: ${resultHod.modifiedCount}`);

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.disconnect();
  }
};

migrateApplications();
