import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    departmentName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    departmentCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    departmentSecretCode: {
      type: String,
      required: true,
    },
    subjects: [
      {
        subjectCode: { type: String, required: true },
        subjectName: { type: String, required: true },
      },
    ],
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

const Department = mongoose.model('Department', departmentSchema);
export default Department;
