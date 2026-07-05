import mongoose from 'mongoose';

const facultySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    assignedDepartments: {
      type: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
      }],
      default: [],
    },
    assignedYears: {
      type: [String],
      enum: ['First Year', 'Second Year', 'Third Year'],
      default: [],
    },
    assignedSubjects: {
      type: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
      }],
      default: [],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
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

const Faculty = mongoose.model('Faculty', facultySchema);
export default Faculty;
