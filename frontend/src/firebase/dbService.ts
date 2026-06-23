import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  setDoc,
  orderBy,
} from 'firebase/firestore';
import { db, isPlaceholder, storage } from './config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { LOCAL_KEYS } from './dbSeeder';
import {
  TimetableEntry,
  Notice,
  LeaveRequest,
  FeeRecord,
  Course,
  UserProfile,
} from '../types';

// Helper to get local data
const getLocalData = (key: string): any[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

// Helper to write local data
const setLocalData = (key: string, data: any[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// ==========================================
// 1. Timetable Services
// ==========================================
export const getTimetable = async (
  userId: string,
  role: 'student' | 'faculty'
): Promise<(TimetableEntry & { courseName: string; courseCode: string })[]> => {
  if (isPlaceholder) {
    const localTimetable = getLocalData(LOCAL_KEYS.TIMETABLE) as TimetableEntry[];
    const localCourses = getLocalData(LOCAL_KEYS.COURSES) as Course[];
    const localUsers = getLocalData(LOCAL_KEYS.USERS) as UserProfile[];

    const courseMap = new Map(localCourses.map((c) => [c.id, c]));

    if (role === 'student') {
      const student = localUsers.find((u) => u.uid === userId);
      const enrolled = student?.enrolledCourses || [];
      const studentTimetable = localTimetable.filter((t) => enrolled.includes(t.courseId));
      
      return studentTimetable.map((t) => {
        const c = courseMap.get(t.courseId);
        return {
          ...t,
          courseName: c?.name || 'Unknown Course',
          courseCode: c?.code || 'UNK',
        };
      });
    } else {
      // Faculty timetable
      const facultyTimetable = localTimetable.filter((t) => t.facultyId === userId);
      return facultyTimetable.map((t) => {
        const c = courseMap.get(t.courseId);
        return {
          ...t,
          courseName: c?.name || 'Unknown Course',
          courseCode: c?.code || 'UNK',
        };
      });
    }
  }

  // Cloud Firestore Mode
  try {
    const coursesSnap = await getDocs(collection(db, 'courses'));
    const coursesList = coursesSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Course[];
    const courseMap = new Map(coursesList.map((c) => [c.id, c]));

    let q;
    if (role === 'student') {
      const userSnap = await getDoc(doc(db, 'users', userId));
      const userData = userSnap.data() as UserProfile | undefined;
      const enrolled = userData?.enrolledCourses || [];
      if (enrolled.length === 0) return [];
      
      q = query(collection(db, 'timetable'), where('courseId', 'in', enrolled));
    } else {
      q = query(collection(db, 'timetable'), where('facultyId', '==', userId));
    }

    const timetableSnap = await getDocs(q);
    return timetableSnap.docs.map((d) => {
      const t = { id: d.id, ...d.data() } as TimetableEntry;
      const c = courseMap.get(t.courseId);
      return {
        ...t,
        courseName: c?.name || 'Unknown Course',
        courseCode: c?.code || 'UNK',
      };
    });
  } catch (err) {
    console.error('Error fetching cloud timetable:', err);
    return [];
  }
};

// ==========================================
// 2. Notices Services
// ==========================================
export const getNotices = async (role: 'student' | 'faculty' | 'admin'): Promise<Notice[]> => {
  if (isPlaceholder) {
    const localNotices = getLocalData(LOCAL_KEYS.NOTICES) as Notice[];
    const now = new Date().toISOString();
    return localNotices
      .filter((n) => (n.targetRole === 'all' || n.targetRole === role) && n.expiresAt > now)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  // Cloud Firestore Mode
  try {
    const now = new Date().toISOString();
    const q = query(
      collection(db, 'notices'),
      orderBy('createdAt', 'desc')
    );
    const noticesSnap = await getDocs(q);
    return noticesSnap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Notice))
      .filter((n) => (n.targetRole === 'all' || n.targetRole === role) && n.expiresAt > now);
  } catch (err) {
    console.error('Error fetching cloud notices:', err);
    return [];
  }
};

// ==========================================
// 3. Attendance Analytics Services
// ==========================================
export interface AttendanceStats {
  courseId: string;
  courseCode: string;
  courseName: string;
  presentCount: number;
  totalCount: number;
  percentage: number;
}

export const getStudentAttendanceStats = async (studentId: string): Promise<AttendanceStats[]> => {
  if (isPlaceholder) {
    const localCourses = getLocalData(LOCAL_KEYS.COURSES) as Course[];
    const localUsers = getLocalData(LOCAL_KEYS.USERS) as UserProfile[];
    
    const student = localUsers.find((u) => u.uid === studentId);
    const enrolled = student?.enrolledCourses || [];
    
    // Simulate attendance sessions
    // Let's create dummy sessions where student attended some and missed some
    const stats: AttendanceStats[] = [];
    
    enrolled.forEach((courseId, index) => {
      const course = localCourses.find((c) => c.id === courseId);
      if (!course) return;
      
      // Seed dummy attendance details per course
      const totalSessions = 12 + (index * 3);
      const presentSessions = index === 0 ? totalSessions - 1 : index === 1 ? Math.floor(totalSessions * 0.85) : Math.floor(totalSessions * 0.65);
      
      stats.push({
        courseId,
        courseCode: course.code,
        courseName: course.name,
        presentCount: presentSessions,
        totalCount: totalSessions,
        percentage: Math.round((presentSessions / totalSessions) * 100),
      });
    });
    
    return stats;
  }

  // Cloud Firestore Mode
  try {
    const userSnap = await getDoc(doc(db, 'users', studentId));
    const userData = userSnap.data() as UserProfile | undefined;
    const enrolled = userData?.enrolledCourses || [];
    if (enrolled.length === 0) return [];

    const coursesSnap = await getDocs(collection(db, 'courses'));
    const coursesList = coursesSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Course[];
    
    // Query attendance sessions for enrolled courses
    const attendanceSnap = await getDocs(
      query(collection(db, 'attendance'), where('courseId', 'in', enrolled))
    );
    const sessions = attendanceSnap.docs.map((d) => d.data());

    return enrolled.map((courseId) => {
      const course = coursesList.find((c) => c.id === courseId);
      const courseSessions = sessions.filter((s) => s.courseId === courseId);
      const totalCount = courseSessions.length;
      const presentCount = courseSessions.filter((s) => s.studentsPresent?.includes(studentId)).length;
      
      return {
        courseId,
        courseCode: course?.code || 'UNK',
        courseName: course?.name || 'Unknown Course',
        presentCount,
        totalCount: totalCount || 1, // prevent division by zero, default to 1 session
        percentage: totalCount ? Math.round((presentCount / totalCount) * 100) : 100,
      };
    });
  } catch (err) {
    console.error('Error fetching cloud attendance stats:', err);
    return [];
  }
};

// ==========================================
// 4. Leave Request Services
// ==========================================
export const getPendingLeaves = async (): Promise<LeaveRequest[]> => {
  if (isPlaceholder) {
    const leaves = getLocalData(LOCAL_KEYS.LEAVES) as LeaveRequest[];
    return leaves.filter((l) => l.status === 'pending');
  }

  try {
    const q = query(collection(db, 'leaves'), where('status', '==', 'pending'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as LeaveRequest));
  } catch (err) {
    console.error('Error fetching pending leaves:', err);
    return [];
  }
};

export const getStudentLeaves = async (studentId: string): Promise<LeaveRequest[]> => {
  if (isPlaceholder) {
    const leaves = getLocalData(LOCAL_KEYS.LEAVES) as LeaveRequest[];
    return leaves.filter((l) => l.studentId === studentId);
  }

  try {
    const q = query(collection(db, 'leaves'), where('studentId', '==', studentId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as LeaveRequest));
  } catch (err) {
    console.error('Error fetching student leaves:', err);
    return [];
  }
};

export const createLeaveRequest = async (leaveData: Omit<LeaveRequest, 'id' | 'createdAt'>): Promise<void> => {
  const newLeave = {
    ...leaveData,
    createdAt: new Date().toISOString(),
  };

  if (isPlaceholder) {
    const leaves = getLocalData(LOCAL_KEYS.LEAVES);
    const id = 'leave_' + Date.now();
    leaves.push({ id, ...newLeave });
    setLocalData(LOCAL_KEYS.LEAVES, leaves);
    return;
  }

  try {
    const newDocRef = doc(collection(db, 'leaves'));
    await setDoc(newDocRef, newLeave);
  } catch (err) {
    console.error('Error creating leave request:', err);
    throw err;
  }
};

export const updateLeaveStatus = async (leaveId: string, status: 'approved' | 'rejected'): Promise<void> => {
  if (isPlaceholder) {
    const leaves = getLocalData(LOCAL_KEYS.LEAVES) as LeaveRequest[];
    const updated = leaves.map((l) => (l.id === leaveId ? { ...l, status } : l));
    setLocalData(LOCAL_KEYS.LEAVES, updated);
    return;
  }

  try {
    const docRef = doc(db, 'leaves', leaveId);
    await updateDoc(docRef, { status });
  } catch (err) {
    console.error('Error updating leave status:', err);
    throw err;
  }
};

// ==========================================
// 5. Assignment Stats Services
// ==========================================
export interface AssignmentStats {
  assignmentId: string;
  title: string;
  courseCode: string;
  submittedCount: number;
  totalStudents: number;
}

export const getFacultyAssignmentStats = async (facultyId: string): Promise<AssignmentStats[]> => {
  if (isPlaceholder) {
    const assignments = getLocalData(LOCAL_KEYS.ASSIGNMENTS);
    const submissions = getLocalData(LOCAL_KEYS.SUBMISSIONS);
    const courses = getLocalData(LOCAL_KEYS.COURSES) as Course[];
    const facultyCourses = courses.filter((c) => c.facultyId === facultyId || facultyId === 'demo_faculty_uid_123');
    const courseIds = facultyCourses.map((c) => c.id);
    const courseMap = new Map(courses.map((c) => [c.id, c]));

    const facultyAssignments = assignments.filter((a: any) => courseIds.includes(a.courseId) || a.facultyId === facultyId);

    return facultyAssignments.map((a: any) => {
      const assignmentSubmissions = submissions.filter((s: any) => s.assignmentId === a.id);
      const c = courseMap.get(a.courseId);
      return {
        assignmentId: a.id,
        title: a.title,
        courseCode: c?.code || 'UNK',
        submittedCount: assignmentSubmissions.length,
        totalStudents: 15, // Mock course size
      };
    });
  }

  try {
    const assignmentsSnap = await getDocs(
      query(collection(db, 'assignments'), where('facultyId', '==', facultyId))
    );
    const assignmentsList = assignmentsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const coursesSnap = await getDocs(collection(db, 'courses'));
    const coursesList = coursesSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Course[];
    const courseMap = new Map(coursesList.map((c) => [c.id, c]));

    const statsList: AssignmentStats[] = [];

    for (const a of assignmentsList) {
      const subsSnap = await getDocs(
        query(collection(db, 'submissions'), where('assignmentId', '==', a.id))
      );
      const c = courseMap.get((a as any).courseId);

      statsList.push({
        assignmentId: a.id,
        title: (a as any).title,
        courseCode: c?.code || 'UNK',
        submittedCount: subsSnap.size,
        totalStudents: 15, // Arbitrary standard size
      });
    }

    return statsList;
  } catch (err) {
    console.error('Error fetching assignment stats:', err);
    return [];
  }
};

// ==========================================
// 6. Admin Control Panel Services
// ==========================================
export interface AdminMetrics {
  totalStudents: number;
  totalFaculty: number;
  totalCourses: number;
  totalDepartments: number;
  paidFeesCount: number;
  pendingFeesCount: number;
  totalFeeAmount: number;
}

export const getAdminMetrics = async (): Promise<AdminMetrics> => {
  if (isPlaceholder) {
    const users = getLocalData(LOCAL_KEYS.USERS) as UserProfile[];
    const courses = getLocalData(LOCAL_KEYS.COURSES);
    const departments = getLocalData(LOCAL_KEYS.DEPARTMENTS);
    const feeRecords = getLocalData(LOCAL_KEYS.FEE_RECORDS) as FeeRecord[];

    const students = users.filter((u) => u.role === 'student');
    const faculty = users.filter((u) => u.role === 'faculty');

    const paid = feeRecords.filter((f) => f.paid);
    const pending = feeRecords.filter((f) => !f.paid);
    const totalAmount = feeRecords.reduce((sum, f) => sum + f.amount, 0);

    return {
      totalStudents: students.length > 0 ? students.length : 24, // Fallback mock numbers if empty
      totalFaculty: faculty.length > 0 ? faculty.length : 8,
      totalCourses: courses.length > 0 ? courses.length : 4,
      totalDepartments: departments.length > 0 ? departments.length : 3,
      paidFeesCount: paid.length,
      pendingFeesCount: pending.length,
      totalFeeAmount: totalAmount,
    };
  }

  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    const users = usersSnap.docs.map((d) => d.data() as UserProfile);

    const coursesSnap = await getDocs(collection(db, 'courses'));
    const departmentsSnap = await getDocs(collection(db, 'departments'));
    const feesSnap = await getDocs(collection(db, 'fee_records'));
    const fees = feesSnap.docs.map((d) => d.data() as FeeRecord);

    const students = users.filter((u) => u.role === 'student');
    const faculty = users.filter((u) => u.role === 'faculty');
    const paid = fees.filter((f) => f.paid);
    const pending = fees.filter((f) => !f.paid);
    const totalAmount = fees.reduce((sum, f) => sum + f.amount, 0);

    return {
      totalStudents: students.length,
      totalFaculty: faculty.length,
      totalCourses: coursesSnap.size,
      totalDepartments: departmentsSnap.size,
      paidFeesCount: paid.length,
      pendingFeesCount: pending.length,
      totalFeeAmount: totalAmount,
    };
  } catch (err) {
    console.error('Error fetching admin metrics:', err);
    return {
      totalStudents: 0,
      totalFaculty: 0,
      totalCourses: 0,
      totalDepartments: 0,
      paidFeesCount: 0,
      pendingFeesCount: 0,
      totalFeeAmount: 0,
    };
  }
};

// ==========================================
// 7. Student Fee Records Services
// ==========================================
export const getStudentFeeRecords = async (studentId: string): Promise<FeeRecord[]> => {
  if (isPlaceholder) {
    const fees = getLocalData(LOCAL_KEYS.FEE_RECORDS) as FeeRecord[];
    return fees.filter((f) => f.studentId === studentId);
  }

  try {
    const snap = await getDocs(
      query(collection(db, 'fee_records'), where('studentId', '==', studentId))
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FeeRecord));
  } catch (err) {
    console.error('Error fetching fee records:', err);
    return [];
  }
};

// ==========================================
// 8. QR Attendance & Check-In Services
// ==========================================
export interface AttendanceSessionData {
  id: string;
  sessionId: string;
  courseId: string;
  date: string;
  qrCodeHash: string;
  studentsPresent: string[];
  facultyId?: string;
}

// Faculty: Get all courses assigned to them
export const getFacultyCourses = async (facultyId: string): Promise<Course[]> => {
  if (isPlaceholder) {
    const courses = getLocalData(LOCAL_KEYS.COURSES) as Course[];
    return courses.filter((c) => c.facultyId === facultyId || facultyId === 'demo_faculty_uid_123');
  }

  try {
    const q = query(collection(db, 'courses'), where('facultyId', '==', facultyId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Course));
  } catch (err) {
    console.error('Error fetching faculty courses:', err);
    return [];
  }
};

// Faculty: Create a new attendance QR session
export const createAttendanceSession = async (
  courseId: string,
  facultyId: string
): Promise<AttendanceSessionData> => {
  const sessionId = 'session_' + Date.now();
  const date = new Date().toISOString();
  // Encode info into token: sessionId|courseId|timestamp
  const qrCodeHash = `${sessionId}|${courseId}|${Date.now()}`;
  
  const newSession: AttendanceSessionData = {
    id: sessionId,
    sessionId,
    courseId,
    date,
    qrCodeHash,
    studentsPresent: [],
    facultyId,
  };

  if (isPlaceholder) {
    const sessions = localStorage.getItem('eh_attendance')
      ? JSON.parse(localStorage.getItem('eh_attendance')!)
      : [];
    sessions.push(newSession);
    localStorage.setItem('eh_attendance', JSON.stringify(sessions));
    return newSession;
  }

  try {
    await setDoc(doc(db, 'attendance', sessionId), newSession);
    return newSession;
  } catch (err) {
    console.error('Error creating attendance session in Firestore:', err);
    throw err;
  }
};

// Student: Scan and mark attendance
export const markStudentPresent = async (
  qrToken: string,
  studentId: string
): Promise<{ success: boolean; courseCode: string; courseName: string }> => {
  // 1. Parse token
  const parts = qrToken.split('|');
  if (parts.length !== 3) {
    throw new Error('Invalid QR Code format.');
  }

  const [sessionId, courseId, timestampStr] = parts;
  const timestamp = parseInt(timestampStr, 10);

  // 2. Validate token is less than 5 minutes old (300,000 milliseconds)
  const now = Date.now();
  if (now - timestamp > 5 * 60 * 1000) {
    throw new Error('This attendance QR Code has expired. QR Codes are only valid for 5 minutes.');
  }

  // 3. Retrieve Course details to show in success message
  let courseCode = 'UNK';
  let courseName = 'Unknown Course';

  if (isPlaceholder) {
    const courses = getLocalData(LOCAL_KEYS.COURSES) as Course[];
    const course = courses.find((c) => c.id === courseId);
    if (course) {
      courseCode = course.code;
      courseName = course.name;
    }

    const sessions = localStorage.getItem('eh_attendance')
      ? JSON.parse(localStorage.getItem('eh_attendance')!)
      : [];
    const sessionIdx = sessions.findIndex((s: any) => s.sessionId === sessionId);
    
    if (sessionIdx === -1) {
      throw new Error('Attendance session not found or has been deleted.');
    }

    if (!sessions[sessionIdx].studentsPresent.includes(studentId)) {
      sessions[sessionIdx].studentsPresent.push(studentId);
      localStorage.setItem('eh_attendance', JSON.stringify(sessions));
    }

    return { success: true, courseCode, courseName };
  }

  // Cloud Firestore Mode
  try {
    const courseSnap = await getDoc(doc(db, 'courses', courseId));
    if (courseSnap.exists()) {
      const c = courseSnap.data() as Course;
      courseCode = c.code;
      courseName = c.name;
    }

    const sessionRef = doc(db, 'attendance', sessionId);
    const sessionSnap = await getDoc(sessionRef);
    
    if (!sessionSnap.exists()) {
      throw new Error('Attendance session not found in Firestore.');
    }

    const sessionData = sessionSnap.data() as AttendanceSessionData;
    const studentsPresent = sessionData.studentsPresent || [];

    if (!studentsPresent.includes(studentId)) {
      studentsPresent.push(studentId);
      await updateDoc(sessionRef, { studentsPresent });
    }

    return { success: true, courseCode, courseName };
  } catch (err: any) {
    console.error('Error marking attendance in cloud:', err);
    throw new Error(err.message || 'Firestore update failed.');
  }
};

// Faculty/Student: Get all attendance sessions for a course
export const getCourseSessions = async (courseId: string): Promise<AttendanceSessionData[]> => {
  if (isPlaceholder) {
    const sessions = localStorage.getItem('eh_attendance')
      ? (JSON.parse(localStorage.getItem('eh_attendance')!) as AttendanceSessionData[])
      : [];
    return sessions.filter((s) => s.courseId === courseId);
  }

  try {
    const q = query(collection(db, 'attendance'), where('courseId', '==', courseId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AttendanceSessionData));
  } catch (err) {
    console.error('Error fetching course sessions:', err);
    return [];
  }
};

// ==========================================
// 9. Firebase Storage & Assignment Library Services
// ==========================================

// Upload file helper
export const uploadFileToStorage = async (path: string, file: File): Promise<string> => {
  if (isPlaceholder) {
    // Generate a temporary browser ObjectURL so the file is interactively viewable/downloadable
    try {
      return URL.createObjectURL(file);
    } catch (e) {
      return `https://example.com/mock-storage/${Date.now()}_${file.name}`;
    }
  }

  try {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  } catch (err) {
    console.error('Error uploading file to Firebase Storage:', err);
    throw err;
  }
};

// Create a new Assignment
export const createAssignment = async (
  assignmentData: {
    title: string;
    description: string;
    courseId: string;
    dueDate: string;
    facultyId: string;
  },
  file?: File
): Promise<any> => {
  const assignmentId = 'asg_' + Date.now();
  let fileUrl = '';

  if (file) {
    fileUrl = await uploadFileToStorage(`assignments/${assignmentData.courseId}/${Date.now()}_${file.name}`, file);
  }

  const newAssignment = {
    id: assignmentId,
    ...assignmentData,
    fileUrl,
    createdAt: new Date().toISOString(),
  };

  if (isPlaceholder) {
    const assignments = getLocalData(LOCAL_KEYS.ASSIGNMENTS);
    assignments.push(newAssignment);
    setLocalData(LOCAL_KEYS.ASSIGNMENTS, assignments);
    return newAssignment;
  }

  try {
    await setDoc(doc(db, 'assignments', assignmentId), newAssignment);
    return newAssignment;
  } catch (err) {
    console.error('Error creating assignment in Firestore:', err);
    throw err;
  }
};

// Student: Submit Assignment homework
export const submitAssignment = async (
  assignmentId: string,
  studentId: string,
  file: File
): Promise<any> => {
  const submissionId = 'sub_' + Date.now();
  const fileUrl = await uploadFileToStorage(`submissions/${assignmentId}/${studentId}/${Date.now()}_${file.name}`, file);

  const newSubmission = {
    id: submissionId,
    assignmentId,
    studentId,
    fileUrl,
    submittedAt: new Date().toISOString(),
  };

  if (isPlaceholder) {
    const submissions = getLocalData(LOCAL_KEYS.SUBMISSIONS);
    // Remove previous submission if exists
    const filtered = submissions.filter((s: any) => !(s.assignmentId === assignmentId && s.studentId === studentId));
    filtered.push(newSubmission);
    setLocalData(LOCAL_KEYS.SUBMISSIONS, filtered);
    return newSubmission;
  }

  try {
    await setDoc(doc(db, 'submissions', submissionId), newSubmission);
    return newSubmission;
  } catch (err) {
    console.error('Error submitting assignment in Firestore:', err);
    throw err;
  }
};

// Faculty: Grade and leave feedback for student submission
export const gradeSubmission = async (
  submissionId: string,
  grade: string,
  feedbackComments: string,
  facultyId: string
): Promise<void> => {
  const feedbackId = 'fb_' + Date.now();
  const newFeedback = {
    id: feedbackId,
    submissionId,
    facultyId,
    comments: feedbackComments,
    createdAt: new Date().toISOString(),
  };

  if (isPlaceholder) {
    // Update submission grade
    const submissions = getLocalData(LOCAL_KEYS.SUBMISSIONS);
    const updatedSubmissions = submissions.map((s: any) =>
      s.id === submissionId ? { ...s, grade } : s
    );
    setLocalData(LOCAL_KEYS.SUBMISSIONS, updatedSubmissions);

    // Save feedback
    const feedbacks = getLocalData(LOCAL_KEYS.FEEDBACK);
    feedbacks.push(newFeedback);
    setLocalData(LOCAL_KEYS.FEEDBACK, feedbacks);
    return;
  }

  try {
    // Update main submission document
    await updateDoc(doc(db, 'submissions', submissionId), { grade });
    
    // Create sub-collection feedback document
    const feedbackRef = doc(db, 'submissions', submissionId, 'feedback', feedbackId);
    await setDoc(feedbackRef, newFeedback);
  } catch (err) {
    console.error('Error grading submission in Firestore:', err);
    throw err;
  }
};

// Faculty: Get all student submissions for an assignment
export const getAssignmentSubmissions = async (
  assignmentId: string
): Promise<(any & { studentName: string; studentEmail: string })[]> => {
  if (isPlaceholder) {
    const submissions = getLocalData(LOCAL_KEYS.SUBMISSIONS);
    const users = getLocalData(LOCAL_KEYS.USERS) as UserProfile[];
    const assignmentSubmissions = submissions.filter((s: any) => s.assignmentId === assignmentId);

    return assignmentSubmissions.map((s: any) => {
      const student = users.find((u) => u.uid === s.studentId);
      
      // Fetch feedback comments if graded
      const feedbacks = getLocalData(LOCAL_KEYS.FEEDBACK);
      const fb = feedbacks.find((f: any) => f.submissionId === s.id);

      return {
        ...s,
        studentName: student?.name || 'Unknown Student',
        studentEmail: student?.email || '',
        feedbackComments: fb?.comments || '',
      };
    });
  }

  try {
    const q = query(collection(db, 'submissions'), where('assignmentId', '==', assignmentId));
    const snap = await getDocs(q);
    
    // Fetch users list to resolve names
    const usersSnap = await getDocs(collection(db, 'users'));
    const usersList = usersSnap.docs.map((d) => d.data() as UserProfile);
    const userMap = new Map(usersList.map((u) => [u.uid, u]));

    const results = [];
    for (const d of snap.docs) {
      const s = { id: d.id, ...d.data() } as any;
      const student = userMap.get(s.studentId);
      
      // Try to fetch sub-collection feedback
      let feedbackComments = '';
      try {
        const fbSnap = await getDocs(collection(db, 'submissions', d.id, 'feedback'));
        if (!fbSnap.empty) {
          fbSnap.forEach((fDoc) => {
            feedbackComments = fDoc.data().comments || '';
          });
        }
      } catch (e) {
        console.warn('Feedback fetch subcollection warning', e);
      }

      results.push({
        ...s,
        studentName: student?.name || 'Unknown Student',
        studentEmail: student?.email || '',
        feedbackComments,
      });
    }

    return results;
  } catch (err) {
    console.error('Error fetching assignment submissions:', err);
    return [];
  }
};

// Student: Get assignments for their courses
export const getStudentAssignments = async (
  studentId: string
): Promise<(any & { courseCode: string; courseName: string; submission?: any; feedback?: string })[]> => {
  if (isPlaceholder) {
    const assignments = getLocalData(LOCAL_KEYS.ASSIGNMENTS);
    const courses = getLocalData(LOCAL_KEYS.COURSES) as Course[];
    const users = getLocalData(LOCAL_KEYS.USERS) as UserProfile[];
    const submissions = getLocalData(LOCAL_KEYS.SUBMISSIONS);
    const feedbacks = getLocalData(LOCAL_KEYS.FEEDBACK);

    const student = users.find((u) => u.uid === studentId);
    const enrolled = student?.enrolledCourses || [];

    const enrolledAssignments = assignments.filter((a: any) => enrolled.includes(a.courseId));
    const courseMap = new Map(courses.map((c) => [c.id, c]));

    return enrolledAssignments.map((a: any) => {
      const c = courseMap.get(a.courseId);
      const sub = submissions.find((s: any) => s.assignmentId === a.id && s.studentId === studentId);
      const fb = sub ? feedbacks.find((f: any) => f.submissionId === sub.id) : null;

      return {
        ...a,
        courseCode: c?.code || 'UNK',
        courseName: c?.name || 'Unknown Course',
        submission: sub || null,
        feedback: fb?.comments || '',
      };
    });
  }

  try {
    const userSnap = await getDoc(doc(db, 'users', studentId));
    const userData = userSnap.data() as UserProfile | undefined;
    const enrolled = userData?.enrolledCourses || [];
    if (enrolled.length === 0) return [];

    const assignmentsSnap = await getDocs(
      query(collection(db, 'assignments'), where('courseId', 'in', enrolled))
    );
    const list = assignmentsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));

    const coursesSnap = await getDocs(collection(db, 'courses'));
    const coursesList = coursesSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Course[];
    const courseMap = new Map(coursesList.map((c) => [c.id, c]));

    const submissionsSnap = await getDocs(
      query(collection(db, 'submissions'), where('studentId', '==', studentId))
    );
    const studentSubmissions = submissionsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));

    const results = [];
    for (const a of list) {
      const c = courseMap.get((a as any).courseId);
      const sub = studentSubmissions.find((s) => s.assignmentId === a.id) || null;
      
      let feedback = '';
      if (sub) {
        try {
          const fbSnap = await getDocs(collection(db, 'submissions', sub.id, 'feedback'));
          if (!fbSnap.empty) {
            fbSnap.forEach((fDoc) => {
              feedback = fDoc.data().comments || '';
            });
          }
        } catch (e) {
          console.warn('Feedback fetch warning', e);
        }
      }

      results.push({
        ...a,
        courseCode: c?.code || 'UNK',
        courseName: c?.name || 'Unknown Course',
        submission: sub,
        feedback,
      });
    }

    return results;
  } catch (err) {
    console.error('Error fetching student assignments:', err);
    return [];
  }
};

// Faculty: Get assignments they created
export const getFacultyAssignments = async (
  facultyId: string
): Promise<(any & { courseCode: string; courseName: string })[]> => {
  if (isPlaceholder) {
    const assignments = getLocalData(LOCAL_KEYS.ASSIGNMENTS);
    const courses = getLocalData(LOCAL_KEYS.COURSES) as Course[];
    const facultyAssignments = assignments.filter((a: any) => a.facultyId === facultyId || facultyId === 'demo_faculty_uid_123');
    const courseMap = new Map(courses.map((c) => [c.id, c]));

    return facultyAssignments.map((a: any) => {
      const c = courseMap.get(a.courseId);
      return {
        ...a,
        courseCode: c?.code || 'UNK',
        courseName: c?.name || 'Unknown Course',
      };
    });
  }

  try {
    const q = query(collection(db, 'assignments'), where('facultyId', '==', facultyId));
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const coursesSnap = await getDocs(collection(db, 'courses'));
    const coursesList = coursesSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Course[];
    const courseMap = new Map(coursesList.map((c) => [c.id, c]));

    return list.map((a: any) => {
      const c = courseMap.get(a.courseId);
      return {
        ...a,
        courseCode: c?.code || 'UNK',
        courseName: c?.name || 'Unknown Course',
      };
    });
  } catch (err) {
    console.error('Error fetching faculty assignments:', err);
    return [];
  }
};

// ==========================================
// 10. Admin CRUD & Timetable Scheduling Services
// ==========================================

// Get all users
export const getAllUsers = async (): Promise<UserProfile[]> => {
  if (isPlaceholder) {
    return getLocalData(LOCAL_KEYS.USERS) as UserProfile[];
  }

  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
  } catch (err) {
    console.error('Error fetching all users:', err);
    return [];
  }
};

// Create or Update User profile
export const createOrUpdateUser = async (userProfile: UserProfile): Promise<void> => {
  if (isPlaceholder) {
    const users = getLocalData(LOCAL_KEYS.USERS) as UserProfile[];
    const idx = users.findIndex((u) => u.uid === userProfile.uid);
    if (idx !== -1) {
      users[idx] = userProfile;
    } else {
      users.push(userProfile);
    }
    setLocalData(LOCAL_KEYS.USERS, users);
    return;
  }

  try {
    await setDoc(doc(db, 'users', userProfile.uid), userProfile);
  } catch (err) {
    console.error('Error creating/updating user:', err);
    throw err;
  }
};

// Delete User profile
export const deleteUser = async (uid: string): Promise<void> => {
  if (isPlaceholder) {
    const users = getLocalData(LOCAL_KEYS.USERS) as UserProfile[];
    const filtered = users.filter((u) => u.uid !== uid);
    setLocalData(LOCAL_KEYS.USERS, filtered);
    return;
  }

  try {
    // Note: This only deletes Firestore profile, Auth delete requires Cloud Functions admin tool.
    await setDoc(doc(db, 'users', uid), {}); // clear doc
  } catch (err) {
    console.error('Error deleting user:', err);
    throw err;
  }
};

// Get all departments
export const getAllDepartments = async (): Promise<any[]> => {
  if (isPlaceholder) {
    return getLocalData(LOCAL_KEYS.DEPARTMENTS);
  }

  try {
    const snap = await getDocs(collection(db, 'departments'));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('Error fetching departments:', err);
    return [];
  }
};

// Create or Update Department
export const createOrUpdateDepartment = async (dept: { id?: string; name: string; code: string; hodId: string }): Promise<void> => {
  const id = dept.id || 'dept_' + Date.now();
  const newDept = { id, ...dept };

  if (isPlaceholder) {
    const depts = getLocalData(LOCAL_KEYS.DEPARTMENTS);
    const idx = depts.findIndex((d) => d.id === id);
    if (idx !== -1) {
      depts[idx] = newDept;
    } else {
      depts.push(newDept);
    }
    setLocalData(LOCAL_KEYS.DEPARTMENTS, depts);
    return;
  }

  try {
    await setDoc(doc(db, 'departments', id), newDept);
  } catch (err) {
    console.error('Error saving department:', err);
    throw err;
  }
};

// Delete Department
export const deleteDepartment = async (id: string): Promise<void> => {
  if (isPlaceholder) {
    const depts = getLocalData(LOCAL_KEYS.DEPARTMENTS);
    const filtered = depts.filter((d) => d.id !== id);
    setLocalData(LOCAL_KEYS.DEPARTMENTS, filtered);
    return;
  }

  try {
    await setDoc(doc(db, 'departments', id), {}); // clear/delete
  } catch (err) {
    console.error('Error deleting department:', err);
    throw err;
  }
};

// Get all courses (helper for timetable)
export const getAllCourses = async (): Promise<Course[]> => {
  if (isPlaceholder) {
    return getLocalData(LOCAL_KEYS.COURSES) as Course[];
  }

  try {
    const snap = await getDocs(collection(db, 'courses'));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Course));
  } catch (err) {
    console.error('Error fetching courses:', err);
    return [];
  }
};

// Save Scheduled Timetable Slot with Conflict Detection
export const saveTimetableEntry = async (entry: {
  courseId: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  startTime: string;
  endTime: string;
  room: string;
  facultyId: string;
}): Promise<void> => {
  const entryId = 'slot_' + Date.now();
  const newEntry = { id: entryId, ...entry };

  // Fetch all existing timetable slots
  let existingTimetable: TimetableEntry[] = [];
  if (isPlaceholder) {
    existingTimetable = getLocalData(LOCAL_KEYS.TIMETABLE) as TimetableEntry[];
  } else {
    try {
      const snap = await getDocs(collection(db, 'timetable'));
      existingTimetable = snap.docs.map((d) => ({ id: d.id, ...d.data() } as TimetableEntry));
    } catch (e) {
      console.warn('Error reading timetable slots for conflict check:', e);
    }
  }

  // Check overlap: day matches, and time boundaries cross
  const overlapSlots = existingTimetable.filter((t) => {
    const dayMatches = t.day === entry.day;
    const timeOverlaps = entry.startTime < t.endTime && entry.endTime > t.startTime;
    return dayMatches && timeOverlaps;
  });

  // 1. Room conflict check
  const roomConflict = overlapSlots.find((t) => t.room === entry.room);
  if (roomConflict) {
    throw new Error(`Conflict: Classroom "${entry.room}" is already booked during this time.`);
  }

  // 2. Faculty conflict check
  const facultyConflict = overlapSlots.find((t) => t.facultyId === entry.facultyId);
  if (facultyConflict) {
    throw new Error(`Conflict: Professor is already assigned to teach another lecture during this time.`);
  }

  // Commit Save
  if (isPlaceholder) {
    existingTimetable.push(newEntry);
    setLocalData(LOCAL_KEYS.TIMETABLE, existingTimetable);
    return;
  }

  try {
    await setDoc(doc(db, 'timetable', entryId), newEntry);
  } catch (err) {
    console.error('Error creating timetable slot in Firestore:', err);
    throw err;
  }
};

// Delete Timetable Entry
export const deleteTimetableEntry = async (id: string): Promise<void> => {
  if (isPlaceholder) {
    const list = getLocalData(LOCAL_KEYS.TIMETABLE) as TimetableEntry[];
    const filtered = list.filter((t) => t.id !== id);
    setLocalData(LOCAL_KEYS.TIMETABLE, filtered);
    return;
  }

  try {
    await setDoc(doc(db, 'timetable', id), {}); // clear
  } catch (err) {
    console.error('Error deleting scheduled slot:', err);
    throw err;
  }
};

// Get All Timetable Slots
export const getAllTimetableEntries = async (): Promise<TimetableEntry[]> => {
  if (isPlaceholder) {
    return getLocalData(LOCAL_KEYS.TIMETABLE) as TimetableEntry[];
  }
  try {
    const snap = await getDocs(collection(db, 'timetable'));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as TimetableEntry));
  } catch (err) {
    console.error('Error fetching all timetable slots:', err);
    return [];
  }
};



