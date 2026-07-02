import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: [opts => opts.length >= 2, 'At least 2 options are required.'],
    },
    correctAnswerIndex: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
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
    duration: {
      type: Number, // in minutes
      required: true,
    },
    questions: {
      type: [questionSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'approved', 'scheduled', 'active', 'ended'],
      default: 'draft',
      required: true,
    },
    scheduleDate: {
      type: Date,
      default: null,
    },
    startTime: {
      type: String, // HH:MM
      default: null,
    },
    endTime: {
      type: String, // HH:MM
      default: null,
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

examSchema.index({ departmentId: 1, year: 1, semester: 1 });

examSchema.post('save', async function (doc) {
  if (doc.status === 'approved' || doc.status === 'scheduled') {
    try {
      const Event = mongoose.model('Event');
      const existingEvent = await Event.findOne({ description: `Exam ID: ${doc._id}`, isDeleted: false });
      if (!existingEvent) {
        let start = doc.scheduleDate || new Date();
        let end = doc.scheduleDate || new Date();
        if (doc.scheduleDate) {
          if (doc.startTime) {
            const [sh, sm] = doc.startTime.split(':');
            start = new Date(doc.scheduleDate);
            start.setHours(parseInt(sh, 10), parseInt(sm, 10), 0, 0);
          }
          if (doc.endTime) {
            const [eh, em] = doc.endTime.split(':');
            end = new Date(doc.scheduleDate);
            end.setHours(parseInt(eh, 10), parseInt(em, 10), 0, 0);
          } else if (doc.duration) {
            end = new Date(start.getTime() + doc.duration * 60 * 1000);
          }
        }

        const newEvent = new Event({
          title: `Exam: ${doc.title}`,
          description: `Exam ID: ${doc._id}`,
          eventType: 'exam',
          startDate: start,
          endDate: end,
          departmentId: doc.departmentId,
          visibility: 'department',
          color: '#d32f2f', // Red for exams
          createdBy: doc.facultyId,
        });
        await newEvent.save();
      }
    } catch (err) {
      console.error('Error auto-syncing exam event to calendar:', err.message);
    }
  }
});

const Exam = mongoose.model('Exam', examSchema);
export default Exam;
