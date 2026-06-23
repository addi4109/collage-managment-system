import mongoose from 'mongoose';

const proctorLogSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    eventType: {
      type: String,
      enum: ['tabSwitch', 'faceNotDetected', 'multipleFaces', 'cameraOff'],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const ProctorLog = mongoose.model('ProctorLog', proctorLogSchema);
export default ProctorLog;
