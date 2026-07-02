import mongoose from 'mongoose';

const placementDriveSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    package: {
      type: Number, // in LPA, e.g. 12
      required: true,
    },
    eligibilityCriteria: {
      type: Number, // minimum CGPA, e.g. 7.5
      default: 0,
    },
    skillsRequired: {
      type: [String],
      default: [],
    },
    deadline: {
      type: Date,
      required: true,
    },
    departmentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true,
      },
    ],
    placementYear: {
      type: String,
      required: true,
      default: '2027',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

placementDriveSchema.index({ deadline: 1 });
placementDriveSchema.index({ placementYear: 1 });

const PlacementDrive = mongoose.model('PlacementDrive', placementDriveSchema);
export default PlacementDrive;
