import mongoose from 'mongoose';

const yearSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      enum: ['First Year', 'Second Year', 'Third Year'],
    },
    semesters: {
      type: [String],
      required: true,
    },
  },
  { _id: false }
);

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    years: {
      type: [yearSchema],
      default: [
        { name: 'First Year', semesters: ['Sem 1', 'Sem 2'] },
        { name: 'Second Year', semesters: ['Sem 3', 'Sem 4'] },
        { name: 'Third Year', semesters: ['Sem 5', 'Sem 6'] },
      ],
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Department = mongoose.model('Department', departmentSchema);
export default Department;
