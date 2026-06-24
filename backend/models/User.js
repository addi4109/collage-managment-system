import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['student', 'faculty', 'admin'],
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'rejected', 'active', 'suspended'],
      default: 'active',
    },
    department: {
      type: String,
      required: function () {
        return this.role === 'student';
      },
      trim: true,
    },
    semester: {
      type: String,
      required: function () {
        return this.role === 'student';
      },
      trim: true,
    },
    departments: {
      type: [String],
      default: [],
    },
    activeDepartment: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);
export default User;
