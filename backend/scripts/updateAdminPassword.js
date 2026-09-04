import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { connectDB } from '../config/database.js';

dotenv.config();

const updateAdmin = async () => {
  console.log('Connecting to database...');
  await connectDB();

  try {
    const newUsername = 'admin';
    const newPassword = 'admin@4109@';

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    const result = await User.findOneAndUpdate(
      { role: 'admin' },
      {
        username: newUsername,
        passwordHash: passwordHash,
        status: 'active',
      },
      { new: true }
    );

    if (result) {
      console.log(`✅ Admin credentials updated successfully!`);
      console.log(`   Username: ${newUsername}`);
      console.log(`   Password: ${newPassword}`);
      console.log(`   Email: ${result.email}`);
    } else {
      console.log('❌ No admin user found. Please run seedAdmin.js first.');
    }
  } catch (err) {
    console.error('Error updating admin:', err);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

updateAdmin();
