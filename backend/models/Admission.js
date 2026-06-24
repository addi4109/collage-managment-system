import mongoose from 'mongoose';

const admissionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    rollNumber: {
      type: String,
      required: true,
      trim: true,
    },
    enrollmentNumber: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: String,
      required: true,
      enum: ['First Year', 'Second Year', 'Third Year'],
    },
    semester: {
      type: String,
      required: true,
      enum: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
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
    address: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    createdByFaculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

admissionSchema.index({ username: 1 });
admissionSchema.index({ status: 1 });

const Admission = mongoose.model('Admission', admissionSchema);
export default Admission;
