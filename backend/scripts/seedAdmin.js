import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import { connectDB } from '../config/database.js';

dotenv.config();

const seed = async () => {
  console.log('Initializing administrator account database seeding...');
  await connectDB();

  try {
    const adminEmail = 'admin@edutech.com';
    const adminPassword = 'admin123';

    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      console.log(`Admin account ${adminEmail} already exists.`);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    const newAdminUser = new User({
      name: 'System Admin',
      email: adminEmail,
      passwordHash,
      role: 'admin',
      status: 'active',
    });

    const savedUser = await newAdminUser.save();

    const newAdminProfile = new Admin({
      user: savedUser._id,
      permissions: ['all'],
    });

    await newAdminProfile.save();
    console.log(`Successfully seeded default Admin:`);
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
  } catch (err) {
    console.error('Error seeding admin database:', err);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

seed();
