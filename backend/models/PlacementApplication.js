import mongoose from 'mongoose';

const placementApplicationSchema = new mongoose.Schema(
  {
    driveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlacementDrive',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cgpa: {
      type: Number,
      required: true,
    },
    resumeUrl: {
      type: String,
      required: true,
    },
    resumeFileName: {
      type: String,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['applied', 'shortlisted', 'interview_scheduled', 'selected', 'rejected'],
      default: 'applied',
    },
    rounds: [
      {
        roundName: { type: String, required: true },
        status: { type: String, enum: ['pending', 'qualified', 'failed'], default: 'pending' },
      },
    ],
    offerLetterUrl: {
      type: String,
      default: null, // set when status is 'selected'
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index constraint
placementApplicationSchema.index({ driveId: 1, studentId: 1 }, { unique: true });

const PlacementApplication = mongoose.model('PlacementApplication', placementApplicationSchema);
export default PlacementApplication;
