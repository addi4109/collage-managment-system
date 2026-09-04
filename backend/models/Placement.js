import mongoose from 'mongoose';

const placementSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    jobProfile: {
      type: String,
      required: true,
      trim: true,
    },
    ctcPackage: {
      type: String, // e.g. "12 LPA"
      required: true,
      trim: true,
    },
    driveDate: {
      type: Date,
      required: true,
    },
    eligibilityCriteria: {
      type: String, // e.g. "CGPA > 7.5, No active backlogs"
      trim: true,
    },
    eligibleStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    selectedStudents: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        studentName: String,
        rollNumber: String,
        packageOffered: String,
      },
    ],
    department: {
      type: String, // e.g. "Computer Engineering"
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
    },
  },
  {
    timestamps: true,
  }
);

const Placement = mongoose.model('Placement', placementSchema);
export default Placement;
