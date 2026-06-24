import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    rollNumber: {
      type: String,
      default: '',
    },
    enrollmentNumber: {
      type: String,
      default: '',
    },
    department: {
      type: String,
      default: '',
    },
    year: {
      type: String,
      enum: ['First Year', 'Second Year', 'Third Year', ''],
      default: '',
    },
    semester: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    parentName: {
      type: String,
      default: '',
    },
    parentMobile: {
      type: String,
      default: '',
    },
    createdByFaculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    enrolledCourses: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Student = mongoose.model('Student', studentSchema);
export default Student;
