export type UserRole = 'student' | 'faculty' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
  createdAt?: string;
  status?: string;
  department?: string;
  departments?: string[];
  activeDepartment?: string;
  enrolledCourses?: string[]; // Array of courseIds
  phoneNumber?: string;
  assignedSubjects?: string[];
  assignedSemesters?: string[];
  assignedYear?: string;
  username?: string;
  phone?: string;
  rollNumber?: string;
  enrollmentNumber?: string;
  semester?: string;
  year?: string;
}

export interface Department {
  id: string; // Document ID
  name: string;
  code: string;
  hodId: string; // UID of faculty
}

export interface Course {
  id: string; // Document ID
  name: string;
  code: string;
  departmentId: string;
  facultyId: string; // UID of faculty
}

export interface AttendanceSession {
  id: string; // Document ID
  sessionId: string;
  courseId: string;
  date: string; // ISO date string
  qrCodeHash: string;
  studentsPresent: string[]; // Array of student UIDs
}

export interface Assignment {
  id: string; // Document ID
  title: string;
  description: string;
  courseId: string;
  dueDate: string; // ISO date string
  facultyId: string; // UID of faculty
  fileUrl?: string; // Optional resource upload
}

export interface Submission {
  id: string; // Document ID
  assignmentId: string;
  studentId: string; // UID of student
  fileUrl: string;
  grade?: string; // Optional grade
  submittedAt: string; // ISO date string
}

export interface Feedback {
  id: string; // Document ID
  submissionId: string;
  facultyId: string;
  comments: string;
  createdAt: string;
}

export interface TimetableEntry {
  id: string; // Document ID
  courseId: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  startTime: string; // e.g., "09:00"
  endTime: string; // e.g., "10:00"
  room: string;
  facultyId: string;
}

export interface Notice {
  id: string; // Document ID
  title: string;
  content: string;
  targetRole: 'all' | 'student' | 'faculty';
  createdAt: string;
  expiresAt: string; // ISO date string
}

export interface LeaveRequest {
  id: string; // Document ID
  studentId: string;
  studentName?: string;
  reason: string;
  fromDate: string;
  toDate: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface FeeRecord {
  id: string; // Document ID
  studentId: string;
  amount: number;
  dueDate: string;
  paid: boolean;
  transactionId?: string;
}
