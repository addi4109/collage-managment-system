import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true, // allows null/undefined without unique conflict for old records
      trim: true,
      lowercase: true,
      index: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
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
      trim: true,
    },
    semester: {
      type: String,
      trim: true,
    },
    // Faculty-specific
    assignedSubjects: {
      type: [String],
      default: [],
    },
    assignedSemester: {
      type: Number,
      min: 1,
      max: 8,
      default: null,
    },
    assignedYear: {
      type: String,
      enum: ['First Year', 'Second Year', 'Third Year', ''],
      default: '',
    },
    approvedByAdmin: {
      type: Boolean,
      default: function () {
        return this.role !== 'faculty';
      },
    },
    employeeId: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    // Student-specific
    rollNumber: {
      type: String,
      trim: true,
      default: '',
    },
    enrollmentNumber: {
      type: String,
      trim: true,
      default: '',
    },
    year: {
      type: String,
      enum: ['First Year', 'Second Year', 'Third Year', ''],
      default: '',
    },
    parentName: {
      type: String,
      trim: true,
      default: '',
    },
    parentMobile: {
      type: String,
      trim: true,
      default: '',
    },
    createdByFaculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Legacy fields (kept for backward compatibility)
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
