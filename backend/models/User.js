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
        return this.role === 'student' || this.role === 'faculty';
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
    assignedSubjects: {
      type: [String],
      default: [],
    },
    approvedByAdmin: {
      type: Boolean,
      default: function () {
        // Default to true for admin and student, but false for faculty (needs manual approval)
        return this.role !== 'faculty';
      },
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
