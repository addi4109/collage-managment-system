import Timetable from '../models/Timetable.js';
import Student from '../models/Student.js';

export const createTimetableEntry = async (entryData, creatorId) => {
  const {
    departmentId,
    year,
    semester,
    day,
    subjectName,
    facultyName,
    roomNumber,
    startTime,
    endTime,
  } = entryData;

  const timetableEntry = new Timetable({
    departmentId,
    year,
    semester,
    day,
    subjectName,
    facultyName,
    roomNumber,
    startTime,
    endTime,
    createdBy: creatorId,
  });

  return await timetableEntry.save();
};

export const getClassTimetable = async (departmentId, year, semester) => {
  return await Timetable.find({ departmentId, year, semester })
    .populate('departmentId', 'name code')
    .sort({ day: 1, startTime: 1 });
};

export const getFacultySchedule = async (facultyName) => {
  // Query slots where facultyName matches the faculty user's name (case-insensitive substring)
  const regex = new RegExp(facultyName, 'i');
  return await Timetable.find({ facultyName: { $regex: regex } })
    .populate('departmentId', 'name code')
    .sort({ day: 1, startTime: 1 });
};

export const getStudentTimetable = async (studentId) => {
  const student = await Student.findOne({ userId: studentId, isDeleted: false });
  if (!student) {
    // Student profile not yet created — return empty array gracefully
    return [];
  }

  return await getClassTimetable(student.departmentId, student.year, student.semester);
};

export const deleteTimetableEntry = async (id) => {
  return await Timetable.findByIdAndDelete(id);
};
