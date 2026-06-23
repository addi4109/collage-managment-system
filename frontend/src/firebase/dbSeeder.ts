import { doc, setDoc } from 'firebase/firestore';
import { db } from './config';

// Key names for LocalStorage Fallback Database
export const LOCAL_KEYS = {
  USERS: 'eh_users',
  DEPARTMENTS: 'eh_departments',
  COURSES: 'eh_courses',
  TIMETABLE: 'eh_timetable',
  NOTICES: 'eh_notices',
  LEAVES: 'eh_leaves',
  FEE_RECORDS: 'eh_fee_records',
  ASSIGNMENTS: 'eh_assignments',
  SUBMISSIONS: 'eh_submissions',
  FEEDBACK: 'eh_feedback',
};

// Initial Seed Data
const MOCK_DEPARTMENTS = [
  { id: 'dept_cs', name: 'Computer Science & Engineering', code: 'CSE', hodId: 'faculty_1' },
  { id: 'dept_ee', name: 'Electrical Engineering', code: 'EE', hodId: 'faculty_2' },
  { id: 'dept_math', name: 'Mathematics', code: 'MATH', hodId: 'faculty_3' },
];

const MOCK_COURSES = [
  { id: 'cs_101', name: 'Introduction to Programming', code: 'CS101', departmentId: 'dept_cs', facultyId: 'faculty_1' },
  { id: 'cs_202', name: 'Data Structures & Algorithms', code: 'CS202', departmentId: 'dept_cs', facultyId: 'faculty_1' },
  { id: 'ee_101', name: 'Electric Circuit Analysis', code: 'EE101', departmentId: 'dept_ee', facultyId: 'faculty_2' },
  { id: 'math_101', name: 'Calculus & Linear Algebra', code: 'MATH101', departmentId: 'dept_math', facultyId: 'faculty_3' },
];

const MOCK_TIMETABLE = [
  { id: 't_1', courseId: 'cs_101', day: 'Monday', startTime: '09:00', endTime: '10:30', room: 'Lab 401', facultyId: 'faculty_1' },
  { id: 't_2', courseId: 'cs_101', day: 'Wednesday', startTime: '09:00', endTime: '10:30', room: 'Lab 401', facultyId: 'faculty_1' },
  { id: 't_3', courseId: 'cs_202', day: 'Tuesday', startTime: '11:00', endTime: '12:30', room: 'Lecture Hall 102', facultyId: 'faculty_1' },
  { id: 't_4', courseId: 'cs_202', day: 'Thursday', startTime: '11:00', endTime: '12:30', room: 'Lecture Hall 102', facultyId: 'faculty_1' },
  { id: 't_5', courseId: 'ee_101', day: 'Monday', startTime: '14:00', endTime: '15:30', room: 'Block C 203', facultyId: 'faculty_2' },
  { id: 't_6', courseId: 'math_101', day: 'Friday', startTime: '10:00', endTime: '11:30', room: 'Block A 303', facultyId: 'faculty_3' },
];

const MOCK_NOTICES = [
  { id: 'n_1', title: 'End-Semester Exam Schedule', content: 'The end-semester examinations will commence from July 10th. Detailed timetables are uploaded on the board.', targetRole: 'all', createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'n_2', title: 'Faculty Meeting: Curriculum Review', content: 'A mandatory review meeting is scheduled for Friday at 3:00 PM in the HOD Conference Room.', targetRole: 'faculty', createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'n_3', title: 'Annual Smart Hackathon 2026', content: 'Registrations are open for the annual hackathon. Team size 3-5. Winning prize: $2000.', targetRole: 'student', createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'n_4', title: 'Scheduled Server Maintenance', content: 'EduTech Hub portals will undergo scheduled database maintenance on Sunday between 2:00 AM - 5:00 AM.', targetRole: 'all', createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() },
];

const MOCK_LEAVES = [
  { id: 'l_1', studentId: 'demo_student_uid_123', studentName: 'Demo Student', reason: 'Dengue Fever recovery and rest advised by physician', fromDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], toDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'pending', createdAt: new Date().toISOString() },
  { id: 'l_2', studentId: 'student_99', studentName: 'Alex Rivera', reason: 'Representing college in regional athletic championship', fromDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], toDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'approved', createdAt: new Date().toISOString() },
  { id: 'l_3', studentId: 'student_88', studentName: 'Jane Smith', reason: 'Family medical emergency, traveling out of town', fromDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], toDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'rejected', createdAt: new Date().toISOString() },
];

const MOCK_FEE_RECORDS = [
  { id: 'f_1', studentId: 'demo_student_uid_123', amount: 1250, dueDate: '2026-07-01', paid: false },
  { id: 'f_2', studentId: 'demo_student_uid_123', amount: 1250, dueDate: '2026-01-15', paid: true, transactionId: 'TXN_EDTECH_987162' },
  { id: 'f_3', studentId: 'student_99', amount: 1500, dueDate: '2026-07-01', paid: false },
];

const MOCK_ASSIGNMENTS = [
  { id: 'a_1', title: 'Loops, Arrays, and Functions', description: 'Complete the core exercises inside the PDF. Submit final solution code.', courseId: 'cs_101', dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), facultyId: 'faculty_1' },
  { id: 'a_2', title: 'Binary Trees & Graph Traversals', description: 'Implement BST nodes deletion and DFS/BFS search sequences in C++ or Java.', courseId: 'cs_202', dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), facultyId: 'faculty_1' },
];

// Helper to seed submissions for nice dashboard charts
const MOCK_SUBMISSIONS = [
  { id: 's_1', assignmentId: 'a_1', studentId: 'demo_student_uid_123', fileUrl: 'https://example.com/sub1.pdf', grade: 'A', submittedAt: new Date().toISOString() },
  { id: 's_2', assignmentId: 'a_1', studentId: 'student_99', fileUrl: 'https://example.com/sub2.pdf', grade: 'B', submittedAt: new Date().toISOString() },
  { id: 's_3', assignmentId: 'a_1', studentId: 'student_88', fileUrl: 'https://example.com/sub3.pdf', grade: 'A+', submittedAt: new Date().toISOString() },
  { id: 's_4', assignmentId: 'a_1', studentId: 'student_77', fileUrl: 'https://example.com/sub4.pdf', submittedAt: new Date().toISOString() },
];

// Seeds local storage database
export const seedLocalDb = (force = false) => {
  const checkAndSet = (key: string, data: any) => {
    if (force || !localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(data));
    }
  };

  checkAndSet(LOCAL_KEYS.DEPARTMENTS, MOCK_DEPARTMENTS);
  checkAndSet(LOCAL_KEYS.COURSES, MOCK_COURSES);
  checkAndSet(LOCAL_KEYS.TIMETABLE, MOCK_TIMETABLE);
  checkAndSet(LOCAL_KEYS.NOTICES, MOCK_NOTICES);
  checkAndSet(LOCAL_KEYS.LEAVES, MOCK_LEAVES);
  checkAndSet(LOCAL_KEYS.FEE_RECORDS, MOCK_FEE_RECORDS);
  checkAndSet(LOCAL_KEYS.ASSIGNMENTS, MOCK_ASSIGNMENTS);
  checkAndSet(LOCAL_KEYS.SUBMISSIONS, MOCK_SUBMISSIONS);
  
  // Seed current demo users profile so it syncs correctly
  const demoUsers = [
    { uid: 'demo_student_uid_123', email: 'student@edutech.edu', name: 'Demo Student', role: 'student', department: 'Computer Science & Engineering', enrolledCourses: ['cs_101', 'cs_202', 'math_101'], createdAt: new Date().toISOString(), status: 'active' },
    { uid: 'demo_faculty_uid_123', email: 'faculty@edutech.edu', name: 'Prof. Demo Faculty', role: 'faculty', department: 'Computer Science & Engineering', createdAt: new Date().toISOString(), status: 'active' },
    { uid: 'demo_admin_uid_123', email: 'admin@edutech.edu', name: 'Demo Admin', role: 'admin', createdAt: new Date().toISOString(), status: 'active' },
  ];
  
  const existingUsers = localStorage.getItem(LOCAL_KEYS.USERS);
  let parsedUsers = existingUsers ? JSON.parse(existingUsers) : [];
  
  demoUsers.forEach(du => {
    if (!parsedUsers.find((u: any) => u.uid === du.uid)) {
      parsedUsers.push(du);
    }
  });
  localStorage.setItem(LOCAL_KEYS.USERS, JSON.stringify(parsedUsers));
  
  console.log('EduTech Hub: Local Sandbox database seeded successfully.');
};

// Seeds cloud firestore database
export const seedCloudFirestore = async () => {
  try {
    const collectionsToSeed = [
      { name: 'departments', data: MOCK_DEPARTMENTS },
      { name: 'courses', data: MOCK_COURSES },
      { name: 'timetable', data: MOCK_TIMETABLE },
      { name: 'notices', data: MOCK_NOTICES },
      { name: 'leaves', data: MOCK_LEAVES },
      { name: 'fee_records', data: MOCK_FEE_RECORDS },
      { name: 'assignments', data: MOCK_ASSIGNMENTS },
      { name: 'submissions', data: MOCK_SUBMISSIONS },
    ];

    for (const col of collectionsToSeed) {
      for (const item of col.data) {
        await setDoc(doc(db, col.name, item.id), item);
      }
    }

    // Seed profiles for demo accounts
    const demoProfiles = [
      { uid: 'demo_student_uid_123', email: 'student@edutech.edu', name: 'Demo Student', role: 'student', department: 'Computer Science & Engineering', enrolledCourses: ['cs_101', 'cs_202', 'math_101'], createdAt: new Date().toISOString(), status: 'active' },
      { uid: 'demo_faculty_uid_123', email: 'faculty@edutech.edu', name: 'Prof. Demo Faculty', role: 'faculty', department: 'Computer Science & Engineering', createdAt: new Date().toISOString(), status: 'active' },
      { uid: 'demo_admin_uid_123', email: 'admin@edutech.edu', name: 'Demo Admin', role: 'admin', createdAt: new Date().toISOString(), status: 'active' }
    ];

    for (const profile of demoProfiles) {
      await setDoc(doc(db, 'users', profile.uid), profile);
    }

    console.log('EduTech Hub: Cloud Firestore database seeded successfully.');
    return true;
  } catch (err) {
    console.error('Error seeding Cloud Firestore:', err);
    throw err;
  }
};
