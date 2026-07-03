import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  CircularProgress,
  Divider,
  Stack,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import QRCode from 'qrcode.react';

import { api, useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { TableSkeleton } from '../components/SkeletonLoader';
import TimetableTab from '../components/TimetableTab';
import LostFoundTab from '../components/LostFoundTab';
import AssignmentTab from '../components/AssignmentTab';
import NoticeTab from '../components/NoticeTab';
import AcademicCalendarTab from '../components/AcademicCalendarTab';
import MonthlyReportTab from '../components/MonthlyReportTab';
import PlacementTab from '../components/PlacementTab';
import ComplaintsTab from '../components/ComplaintsTab';
import LibraryTab from '../components/LibraryTab';
import FacultyResultsTab from '../components/FacultyResultsTab';
import NotificationTab from '../components/NotificationTab';

export default function FacultyDashboard() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'stats';
  const { user } = useAuth();
  const { showToast } = useToast();

  // Data States
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [exams, setExams] = useState([]);
  
  // Scoped Dropdowns
  const [depts, setDepts] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSem, setSelectedSem] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  // Dialog States
  const [openStudentDialog, setOpenStudentDialog] = useState(false);
  const [studentForm, setStudentForm] = useState({ name: '', username: '', password: '', email: '', phone: '', rollNumber: '', enrollmentNumber: '', departmentId: '', year: '', semester: '', parentName: '', parentMobile: '', address: '' });
  const [isEditMode, setIsEditMode] = useState(false);
  const [editStudentId, setEditStudentId] = useState(null);

  // Admission Request Form
  const [openAdmissionDialog, setOpenAdmissionDialog] = useState(false);
  const [admissionForm, setAdmissionForm] = useState({ name: '', username: '', password: '', email: '', phone: '', rollNumber: '', enrollmentNumber: '', departmentId: '', year: '', semester: '', parentName: '', parentMobile: '', address: '' });

  // QR Session Dialog
  const [openQrDialog, setOpenQrDialog] = useState(false);
  const [qrToken, setQrToken] = useState('');
  const [qrDuration, setQrDuration] = useState(15);
  const [sessionForm, setSessionForm] = useState({
    subjectName: '',
    departmentId: '',
    year: '',
    semester: 'Sem 1',
    duration: 15,
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00 AM'
  });

  // Attendance details dialog states
  const [openAttendanceDialog, setOpenAttendanceDialog] = useState(false);
  const [selectedSessionDetails, setSelectedSessionDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // MCQ Exam Builder States
  const [openExamDialog, setOpenExamDialog] = useState(false);
  const [examForm, setExamForm] = useState({ title: '', subjectId: '', departmentId: '', year: '', semester: '', duration: 30, questions: [] });
  const [newQuestion, setNewQuestion] = useState({ questionText: '', options: ['', '', '', ''], correctAnswerIndex: 0 });
  const [showPassword, setShowPassword] = useState(false);
  const [examSubjects, setExamSubjects] = useState([]);

  // Fetch subjects for Exam creation dynamically based on selected dept/year/sem in the exam dialog
  useEffect(() => {
    if (!examForm.departmentId || !examForm.year || !examForm.semester) return;
    const fetchExamSubjects = async () => {
      try {
        const res = await api.get(`/subjects?departmentId=${examForm.departmentId}&year=${examForm.year}&semester=${examForm.semester}`);
        setExamSubjects(res.data);
        if (res.data.length > 0) {
          setExamForm(prev => ({ ...prev, subjectId: res.data[0]._id }));
        } else {
          setExamForm(prev => ({ ...prev, subjectId: '' }));
        }
      } catch (err) {
        console.error('Error loading exam subjects:', err);
      }
    };
    fetchExamSubjects();
  }, [examForm.departmentId, examForm.year, examForm.semester]);

  // Results Entry States
  const [resultsSheet, setResultsSheet] = useState(null);

  // Exam Scheduling States
  const [openScheduleDialog, setOpenScheduleDialog] = useState(false);
  const [schedulingExamId, setSchedulingExamId] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    scheduleDate: new Date().toISOString().split('T')[0],
    startTime: '10:00 AM',
    endTime: '11:00 AM',
  });

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Load Dropdowns
  const loadFilterOptions = async () => {
    try {
      const res = await api.get('/departments');
      // Filter only departments assigned to this faculty
      const assignedDeps = user?.assignedDepartments || [];
      const assignedYears = user?.assignedYears || [];
      
      const filtered = res.data.filter(d => assignedDeps.includes(d._id));
      setDepts(filtered);
      
      const defaultDept = filtered.length > 0 ? filtered[0]._id : '';
      const defaultYear = assignedYears.length > 0 ? assignedYears[0] : '';
      
      if (defaultDept) setSelectedDept(defaultDept);
      if (defaultYear) setSelectedYear(defaultYear);
      
      setSessionForm(prev => ({
        ...prev,
        departmentId: defaultDept,
        year: defaultYear,
        semester: 'Sem 1',
      }));
    } catch (err) {
      showToast('Error loading setup options.', 'error');
    }
  };

  // Load Subjects based on filters
  useEffect(() => {
    if (!selectedDept || !selectedYear || !selectedSem) return;
    const fetchSubjects = async () => {
      try {
        const res = await api.get(`/subjects?departmentId=${selectedDept}&year=${selectedYear}&semester=${selectedSem}`);
        setSubjects(res.data);
        if (res.data.length > 0) setSelectedSubject(res.data[0]._id);
      } catch (err) {
        showToast('Error loading subjects.', 'error');
      }
    };
    fetchSubjects();
  }, [selectedDept, selectedYear, selectedSem]);

  // Load Primary Data based on Tab
  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'stats') {
        const res = await api.get('/reports/analytics');
        setStats(res.data);
      } else if (tab === 'students') {
        const res = await api.get('/students');
        setStudents(res.data);
        await loadFilterOptions();
      } else if (tab === 'attendance') {
        const res = await api.get('/attendance/sessions');
        setSessions(res.data);
        await loadFilterOptions();
      } else if (tab === 'exams') {
        const res = await api.get('/exams/faculty');
        setExams(res.data);
        await loadFilterOptions();
      } else if (tab === 'results') {
        await loadFilterOptions();
      } else if (tab === 'admissions') {
        await loadFilterOptions();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load dashboard data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tab]);

  // Student CRUD Actions
  const handleOpenStudentForm = (student = null) => {
    setShowPassword(false);
    if (student) {
      setIsEditMode(true);
      setEditStudentId(student._id);
      setStudentForm({
        name: student.userId.name,
        username: student.userId.username,
        password: '', // blank = keep current; fill in to reset
        email: student.userId.email,
        phone: student.phone || '',
        rollNumber: student.rollNumber,
        enrollmentNumber: student.enrollmentNumber,
        departmentId: student.departmentId._id,
        year: student.year,
        semester: student.semester,
        parentName: student.parentName || '',
        parentMobile: student.parentMobile || '',
        address: student.address || '',
      });
    } else {
      setIsEditMode(false);
      setStudentForm({
        name: '', username: '', password: '', email: '', phone: '',
        rollNumber: '', enrollmentNumber: '',
        departmentId: selectedDept, year: selectedYear, semester: selectedSem || 'Sem 1',
        parentName: '', parentMobile: '', address: ''
      });
    }
    setOpenStudentDialog(true);
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      if (isEditMode) {
        await api.put(`/students/${editStudentId}`, studentForm);
        // If faculty provided a new password, reset it via dedicated endpoint
        if (studentForm.password && studentForm.password.trim()) {
          await api.post(`/students/${editStudentId}/reset-password`, { password: studentForm.password });
        }
        showToast('Student profile updated successfully.', 'success');
      } else {
        await api.post('/students', studentForm);
        showToast('Student registered successfully.', 'success');
      }
      setOpenStudentDialog(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save student profile.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    try {
      await api.delete(`/students/${id}`);
      showToast('Student soft-deleted successfully.', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to delete student.', 'error');
    }
  };

  // Admission Request Form
  const handleOpenAdmissionForm = () => {
    setAdmissionForm({
      name: '', username: '', password: '', email: '', phone: '',
      rollNumber: '', enrollmentNumber: '',
      departmentId: selectedDept, year: selectedYear, semester: selectedSem || 'Sem 1',
      parentName: '', parentMobile: '', address: ''
    });
    setOpenAdmissionDialog(true);
  };

  const handleAdmissionSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      await api.post('/admissions/request', admissionForm);
      showToast('Admission request submitted for Admin review.', 'success');
      setOpenAdmissionDialog(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit admission request.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  // QR Session Creation
  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/attendance/session', sessionForm);
      setQrToken(res.data.session.sessionToken);
      setQrDuration(res.data.session.duration);
      setOpenQrDialog(true);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create session.', 'error');
    }
  };

  const handleOpenAttendanceDetails = async (sessionId) => {
    setOpenAttendanceDialog(true);
    setLoadingDetails(true);
    try {
      const res = await api.get(`/attendance/session/${sessionId}`);
      setSelectedSessionDetails(res.data);
    } catch (err) {
      showToast('Failed to load session attendance.', 'error');
      setOpenAttendanceDialog(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleEndSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to end this attendance session? Students will no longer be able to check-in.')) return;
    try {
      await api.post(`/attendance/session/${sessionId}/end`);
      showToast('Attendance session ended successfully.', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to end attendance session.', 'error');
    }
  };

  // MCQ Exam builder
  const handleAddQuestion = () => {
    if (!newQuestion.questionText || newQuestion.options.some(o => !o)) {
      return showToast('Please fill out the question and all 4 options.', 'warning');
    }
    setExamForm({
      ...examForm,
      questions: [...examForm.questions, newQuestion],
    });
    setNewQuestion({ questionText: '', options: ['', '', '', ''], correctAnswerIndex: 0 });
    showToast('Question added to exam list.', 'success');
  };

  const handleCreateExam = async () => {
    if (examForm.questions.length === 0) {
      return showToast('Please add at least one question.', 'warning');
    }
    if (!examForm.subjectId) {
      return showToast('Please select a subject for the exam.', 'warning');
    }
    try {
      const res = await api.post('/exams', examForm);
      // Immediately submit for approval
      await api.post(`/exams/${res.data.exam._id}/submit`);
      showToast('Exam created and submitted for Admin approval.', 'success');
      setOpenExamDialog(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create exam.', 'error');
    }
  };

  // MCQ Exam Scheduling & Lifecycle Handlers
  const handleOpenScheduleDialog = (exam) => {
    setSchedulingExamId(exam._id);
    setScheduleForm({
      scheduleDate: exam.scheduleDate ? new Date(exam.scheduleDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      startTime: exam.startTime || '10:00 AM',
      endTime: exam.endTime || '11:00 AM',
    });
    setOpenScheduleDialog(true);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/exams/${schedulingExamId}/schedule`, scheduleForm);
      showToast('Exam scheduled successfully.', 'success');
      setOpenScheduleDialog(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to schedule exam.', 'error');
    }
  };

  const handleStartExam = async (examId) => {
    if (!window.confirm('Are you sure you want to start this exam now? Students will be notified.')) return;
    try {
      await api.post(`/exams/${examId}/start`);
      showToast('Exam is now active!', 'success');
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to start exam.', 'error');
    }
  };

  const handleEndExam = async (examId) => {
    if (!window.confirm('Are you sure you want to end this exam now? Students will no longer be able to submit.')) return;
    try {
      await api.post(`/exams/${examId}/end`);
      showToast('Exam ended.', 'success');
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to end exam.', 'error');
    }
  };

  // Results Spreadsheet loading
  const handleLoadResultsSheet = async () => {
    if (!selectedDept || !selectedYear || !selectedSem) {
      return showToast('Please select Department, Year, and Semester.', 'warning');
    }
    try {
      const res = await api.get(`/results/draft?departmentId=${selectedDept}&year=${selectedYear}&semester=${selectedSem}`);
      setResultsSheet(res.data);
    } catch (err) {
      showToast('Failed to load grade sheet template.', 'error');
    }
  };

  const handleResultMarkChange = (studentId, subjectId, field, value) => {
    const updatedResults = resultsSheet.results.map(r => {
      if (r.studentId === studentId && r.subjectId === subjectId) {
        return { ...r, [field]: value };
      }
      return r;
    });
    setResultsSheet({ ...resultsSheet, results: updatedResults });
  };

  const handleSaveResults = async (submit = false) => {
    try {
      const res = await api.post('/results/draft', resultsSheet);
      if (submit) {
        const batchId = res.data.batch._id;
        await api.post(`/results/submit/${batchId}`);
        showToast('Grade batch submitted successfully for approval.', 'success');
        setResultsSheet(null);
      } else {
        showToast('Grade sheet draft saved successfully.', 'success');
      }
    } catch (err) {
      showToast('Failed to save grade sheet.', 'error');
    }
  };

  return (
    <Box>
      {loading ? (
        <TableSkeleton />
      ) : (
        <>
          {/* STATS VIEW */}
          {tab === 'stats' && stats && (
            <Box>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={4}>
                  <Card sx={{ p: 3, borderRadius: '16px', bgcolor: 'primary.light', color: '#fff' }}>
                    <Typography variant="body2">My Scoped Students</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800 }}>{stats.myStudents}</Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card sx={{ p: 3, borderRadius: '16px', bgcolor: 'secondary.light', color: '#fff' }}>
                    <Typography variant="body2">Pending Admission Enquiries</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800 }}>{stats.pendingAdmissions}</Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card sx={{ p: 3, borderRadius: '16px', bgcolor: 'success.light', color: '#fff' }}>
                    <Typography variant="body2">Upcoming MCQ Exams</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800 }}>{stats.upcomingExams?.length || 0}</Typography>
                  </Card>
                </Grid>
              </Grid>

              {/* Active check-in monitor */}
              <Card sx={{ p: 3, borderRadius: '16px', mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Today's Active Attendance Check-Ins</Typography>
                {stats.activeSessions?.length === 0 ? (
                  <Typography color="text.secondary">No active attendance sessions right now.</Typography>
                ) : (
                  <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Subject Code</TableCell>
                          <TableCell>Subject Name</TableCell>
                          <TableCell>Time</TableCell>
                          <TableCell>Duration</TableCell>
                          <TableCell align="right">Students Checked-in</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {stats.activeSessions?.map((s, idx) => (
                          <TableRow key={idx}>
                            <TableCell sx={{ fontWeight: 'bold' }}>{s.subjectCode}</TableCell>
                            <TableCell>{s.subjectName}</TableCell>
                            <TableCell>{s.startTime}</TableCell>
                            <TableCell>{s.duration} mins</TableCell>
                            <TableCell align="right">
                              <Chip label={`${s.checkinCount} present`} color="success" size="small" />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Card>
            </Box>
          )}

          {/* STUDENT CRUD */}
          {tab === 'students' && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Students Directory</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenStudentForm()}>
                  Register Student
                </Button>
              </Box>
              <TableContainer component={Paper} sx={{ borderRadius: '16px' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Roll Number</TableCell>
                      <TableCell>Enrollment</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell>Class</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.map((s) => (
                      <TableRow key={s._id}>
                        <TableCell sx={{ fontWeight: 'bold' }}>{s.rollNumber}</TableCell>
                        <TableCell>{s.enrollmentNumber}</TableCell>
                        <TableCell>{s.userId?.name}</TableCell>
                        <TableCell>{s.departmentId?.name}</TableCell>
                        <TableCell>{s.year} - {s.semester}</TableCell>
                        <TableCell align="right">
                          <IconButton size="small" color="primary" onClick={() => handleOpenStudentForm(s)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeleteStudent(s._id)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* ADMISSIONS REQUEST */}
          {tab === 'admissions' && (
            <Box>
              <Card sx={{ p: 4, borderRadius: '24px', maxWidth: 600, mx: 'auto' }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, textAlign: 'center' }}>Admissions Request Form</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
                  Create a new student entry request. Admin must approve this to activate the account.
                </Typography>
                <Button variant="contained" fullWidth size="large" onClick={handleOpenAdmissionForm}>
                  Create Admission Request
                </Button>
              </Card>
            </Box>
          )}

          {/* QR ATTENDANCE GENERATOR */}
          {tab === 'attendance' && (
            <Box>
              <Grid container spacing={4}>
                <Grid item xs={12} md={5}>
                  <Card sx={{ p: 3, borderRadius: '16px' }}>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>Generate Check-in Session</Typography>
                    <form onSubmit={handleCreateSession}>
                      <TextField
                        select
                        fullWidth
                        required
                        label="Department"
                        value={sessionForm.departmentId}
                        onChange={(e) => setSessionForm({ ...sessionForm, departmentId: e.target.value })}
                        sx={{ mb: 2 }}
                      >
                        {depts.map(d => <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>)}
                      </TextField>
                      <TextField
                        select
                        fullWidth
                        required
                        label="Year"
                        value={sessionForm.year}
                        onChange={(e) => setSessionForm({ ...sessionForm, year: e.target.value })}
                        sx={{ mb: 2 }}
                      >
                        {user.assignedYears.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                      </TextField>
                      <TextField
                        select
                        fullWidth
                        required
                        label="Semester"
                        value={sessionForm.semester}
                        onChange={(e) => setSessionForm({ ...sessionForm, semester: e.target.value })}
                        sx={{ mb: 2 }}
                      >
                        {['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                      </TextField>
                      <TextField
                        fullWidth
                        required
                        label="Subject"
                        placeholder="e.g. Java Programming"
                        value={sessionForm.subjectName}
                        onChange={(e) => setSessionForm({ ...sessionForm, subjectName: e.target.value })}
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        required
                        type="date"
                        label="Date"
                        InputLabelProps={{ shrink: true }}
                        value={sessionForm.date}
                        onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        required
                        label="Start Time"
                        placeholder="e.g. 10:00 AM"
                        value={sessionForm.startTime}
                        onChange={(e) => setSessionForm({ ...sessionForm, startTime: e.target.value })}
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        required
                        type="number"
                        label="Session Duration (mins)"
                        value={sessionForm.duration}
                        onChange={(e) => setSessionForm({ ...sessionForm, duration: parseInt(e.target.value, 10) })}
                        sx={{ mb: 3 }}
                      />
                      <Button fullWidth size="large" variant="contained" type="submit">
                        Generate QR Code
                      </Button>
                    </form>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={7}>
                  <Card sx={{ p: 3, borderRadius: '16px' }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Recent Active Session Logs</Typography>
                    <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Subject</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Time</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {sessions.map((s) => (
                            <TableRow key={s._id}>
                              <TableCell sx={{ fontWeight: 'bold' }}>{s.subjectName || s.subjectId?.name}</TableCell>
                              <TableCell>{new Date(s.date).toLocaleDateString()}</TableCell>
                              <TableCell>{s.startTime}</TableCell>
                              <TableCell>
                                <Chip label={s.status} color={s.status === 'active' ? 'success' : 'default'} size="small" />
                              </TableCell>
                              <TableCell align="right">
                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                  {s.status === 'active' && (
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={() => {
                                        setQrToken(s.sessionToken);
                                        setQrDuration(s.duration);
                                        setOpenQrDialog(true);
                                      }}
                                    >
                                      QR
                                    </Button>
                                  )}
                                  {s.status === 'active' && (
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      color="error"
                                      onClick={() => handleEndSession(s._id)}
                                    >
                                      End
                                    </Button>
                                  )}
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="success"
                                    onClick={() => handleOpenAttendanceDetails(s._id)}
                                  >
                                    View
                                  </Button>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* MCQ EXAMS BUILDER */}
          {tab === 'exams' && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Exam Papers Directory</Typography>
                <Button variant="contained" onClick={() => {
                  setExamForm({
                    title: '',
                    questions: [],
                    duration: 30,
                    departmentId: depts.length > 0 ? depts[0]._id : '',
                    year: user?.assignedYears?.length > 0 ? user.assignedYears[0] : '',
                    semester: 'Sem 1',
                    subjectId: '',
                  });
                  setOpenExamDialog(true);
                }}>
                  Create MCQ Exam
                </Button>
              </Box>
              <TableContainer component={Paper} sx={{ borderRadius: '16px' }}>
                <Table>
                   <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Subject</TableCell>
                      <TableCell>Class</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {exams.map((e) => (
                      <TableRow key={e._id}>
                        <TableCell sx={{ fontWeight: 'bold' }}>{e.title}</TableCell>
                        <TableCell>{e.subjectId?.name}</TableCell>
                        <TableCell>{e.year} - {e.semester}</TableCell>
                        <TableCell>{e.duration} mins</TableCell>
                        <TableCell>
                          <Chip label={e.status} color={e.status === 'active' ? 'success' : e.status === 'pending_approval' ? 'warning' : e.status === 'scheduled' ? 'info' : 'default'} size="small" />
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            {e.status === 'approved' && (
                              <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                onClick={() => handleOpenScheduleDialog(e)}
                              >
                                Schedule
                              </Button>
                            )}
                            {e.status === 'scheduled' && (
                              <>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  onClick={() => handleStartExam(e._id)}
                                >
                                  Start
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => handleOpenScheduleDialog(e)}
                                >
                                  Reschedule
                                </Button>
                              </>
                            )}
                            {e.status === 'active' && (
                              <Button
                                size="small"
                                variant="contained"
                                color="error"
                                onClick={() => handleEndExam(e._id)}
                              >
                                End Exam
                              </Button>
                            )}
                            {e.status === 'draft' && (
                              <Typography variant="body2" color="text.secondary">Draft</Typography>
                            )}
                            {e.status === 'pending_approval' && (
                              <Typography variant="body2" color="text.secondary">Awaiting Review</Typography>
                            )}
                            {e.status === 'ended' && (
                              <Typography variant="body2" color="text.secondary">Ended</Typography>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* GRADE SHEETS */}
          {tab === 'results' && (
            <FacultyResultsTab />
          )}

          {/* TIMETABLE TAB */}
          {tab === 'timetable' && (
            <TimetableTab role="faculty" />
          )}

          {/* LOST & FOUND TAB */}
          {tab === 'lostfound' && (
            <LostFoundTab />
          )}

          {/* NEW ERP TABS */}
          {tab === 'assignments' && (
            <AssignmentTab role="faculty" />
          )}

          {/* NOTICE BOARD TAB */}
          {tab === 'notices' && (
            <NoticeTab role="faculty" />
          )}

          {/* ACADEMIC CALENDAR TAB */}
          {tab === 'calendar' && (
            <AcademicCalendarTab role="faculty" />
          )}

          {/* MONTHLY REPORTS ENTRY TAB */}
          {tab === 'monthly-reports' && (
            <MonthlyReportTab role="faculty" />
          )}

          {/* PLACEMENT drives TAB */}
          {tab === 'placements' && (
            <PlacementTab role="faculty" />
          )}

          {/* COMPLAINTS TAB */}
          {tab === 'complaints' && (
            <ComplaintsTab role="faculty" />
          )}

          {/* LIBRARY CATALOG TAB */}
          {tab === 'library' && (
            <LibraryTab role="faculty" />
          )}

          {/* SEND NOTIFICATIONS TAB */}
          {tab === 'notifications' && (
            <NotificationTab role="faculty" />
          )}
        </>
      )}

      {/* DYNAMIC REGISTER STUDENT DIALOG */}
      <Dialog open={openStudentDialog} onClose={() => setOpenStudentDialog(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleStudentSubmit}>
          <DialogTitle sx={{ fontWeight: 'bold' }}>{isEditMode ? 'Modify Student Profile' : 'Register New Student'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Student Full Name"
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Roll Number"
                  value={studentForm.rollNumber}
                  onChange={(e) => setStudentForm({ ...studentForm, rollNumber: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Enrollment Number"
                  value={studentForm.enrollmentNumber}
                  onChange={(e) => setStudentForm({ ...studentForm, enrollmentNumber: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Username"
                  value={studentForm.username}
                  onChange={(e) => setStudentForm({ ...studentForm, username: e.target.value })}
                  disabled={isEditMode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required={!isEditMode}
                  type={showPassword ? 'text' : 'password'}
                  label={isEditMode ? 'Reset Password (leave blank to keep current)' : 'Password'}
                  placeholder={isEditMode ? '••••••••  (optional)' : '••••••••'}
                  value={studentForm.password || ''}
                  onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        size="small"
                        onClick={() => setShowPassword(v => !v)}
                        edge="end"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="email"
                  label="Email"
                  value={studentForm.email}
                  onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={studentForm.phone}
                  onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Department"
                  value={studentForm.departmentId}
                  onChange={(e) => setStudentForm({ ...studentForm, departmentId: e.target.value })}
                >
                  {depts.map(d => <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Year"
                  value={studentForm.year}
                  onChange={(e) => setStudentForm({ ...studentForm, year: e.target.value })}
                >
                  {user.assignedYears.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Semester"
                  value={studentForm.semester}
                  onChange={(e) => setStudentForm({ ...studentForm, semester: e.target.value })}
                >
                  {['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Parent/Guardian Name"
                  value={studentForm.parentName}
                  onChange={(e) => setStudentForm({ ...studentForm, parentName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Parent Mobile"
                  value={studentForm.parentMobile}
                  onChange={(e) => setStudentForm({ ...studentForm, parentMobile: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Residential Address"
                  value={studentForm.address}
                  onChange={(e) => setStudentForm({ ...studentForm, address: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenStudentDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={submitLoading}>
              {submitLoading ? <CircularProgress size={24} /> : 'Save Student'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ADMISSION ENQUIRY DIALOG */}
      <Dialog open={openAdmissionDialog} onClose={() => setOpenAdmissionDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleAdmissionSubmit}>
          <DialogTitle sx={{ fontWeight: 'bold' }}>Create Admission Enquiry Request</DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              fullWidth
              required
              label="Student Name"
              value={admissionForm.name}
              onChange={(e) => setAdmissionForm({ ...admissionForm, name: e.target.value })}
              sx={{ mb: 2, mt: 1 }}
            />
            <TextField
              margin="dense"
              fullWidth
              required
              label="Roll Number"
              value={admissionForm.rollNumber}
              onChange={(e) => setAdmissionForm({ ...admissionForm, rollNumber: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              fullWidth
              required
              label="Enrollment Number"
              value={admissionForm.enrollmentNumber}
              onChange={(e) => setAdmissionForm({ ...admissionForm, enrollmentNumber: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              fullWidth
              required
              label="Username"
              value={admissionForm.username}
              onChange={(e) => setAdmissionForm({ ...admissionForm, username: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              fullWidth
              required
              type="password"
              label="Password"
              value={admissionForm.password}
              onChange={(e) => setAdmissionForm({ ...admissionForm, password: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              fullWidth
              required
              type="email"
              label="Email"
              value={admissionForm.email}
              onChange={(e) => setAdmissionForm({ ...admissionForm, email: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              select
              margin="dense"
              fullWidth
              required
              label="Department"
              value={admissionForm.departmentId}
              onChange={(e) => setAdmissionForm({ ...admissionForm, departmentId: e.target.value })}
              sx={{ mb: 2 }}
            >
              {depts.map(d => <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>)}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAdmissionDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={submitLoading}>
              {submitLoading ? <CircularProgress size={24} /> : 'Submit Request'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* QR DISPLAY DIALOG */}
      <Dialog open={openQrDialog} onClose={() => setOpenQrDialog(false)}>
        <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center' }}>Check-in QR Code</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
          {qrToken && (
            <QRCode
              value={JSON.stringify({ sessionToken: qrToken })}
              size={250}
              level="H"
              includeMargin
            />
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Students must scan this QR code within {qrDuration} minutes to mark check-in.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button variant="contained" onClick={() => setOpenQrDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* MCQ EXAM CREATOR DIALOG */}
      <Dialog open={openExamDialog} onClose={() => setOpenExamDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Create MCQ Exam Paper</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            fullWidth
            required
            label="Exam Title"
            value={examForm.title}
            onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            margin="dense"
            fullWidth
            required
            type="number"
            label="Duration (minutes)"
            value={examForm.duration}
            onChange={(e) => setExamForm({ ...examForm, duration: parseInt(e.target.value, 10) })}
            sx={{ mb: 3 }}
          />

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                required
                label="Department"
                value={examForm.departmentId || ''}
                onChange={(e) => setExamForm({ ...examForm, departmentId: e.target.value })}
              >
                {depts.map(d => <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                required
                label="Year"
                value={examForm.year || ''}
                onChange={(e) => setExamForm({ ...examForm, year: e.target.value })}
              >
                {user?.assignedYears?.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                required
                label="Semester"
                value={examForm.semester || 'Sem 1'}
                onChange={(e) => setExamForm({ ...examForm, semester: e.target.value })}
              >
                {['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                required
                label="Subject"
                value={examForm.subjectId || ''}
                onChange={(e) => setExamForm({ ...examForm, subjectId: e.target.value })}
              >
                {examSubjects.map(s => <MenuItem key={s._id} value={s._id}>{s.name} ({s.code})</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Build Questions ({examForm.questions.length} added)</Typography>

          <Card sx={{ p: 2, mb: 2, bgcolor: 'action.hover' }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Question Text"
              value={newQuestion.questionText}
              onChange={(e) => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
              sx={{ mb: 2 }}
            />
            <Grid container spacing={2}>
              {newQuestion.options.map((opt, idx) => (
                <Grid item xs={6} key={idx}>
                  <TextField
                    fullWidth
                    label={`Option ${idx + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...newQuestion.options];
                      newOpts[idx] = e.target.value;
                      setNewQuestion({ ...newQuestion, options: newOpts });
                    }}
                  />
                </Grid>
              ))}
            </Grid>
            <TextField
              select
              fullWidth
              label="Correct Option Index"
              value={newQuestion.correctAnswerIndex}
              onChange={(e) => setNewQuestion({ ...newQuestion, correctAnswerIndex: parseInt(e.target.value, 10) })}
              sx={{ mt: 2 }}
            >
              {[0, 1, 2, 3].map(val => (
                <MenuItem key={val} value={val}>Option {val + 1}</MenuItem>
              ))}
            </TextField>
            <Button sx={{ mt: 2 }} variant="outlined" onClick={handleAddQuestion}>Add Question</Button>
          </Card>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenExamDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateExam} variant="contained" color="success">Create & Submit Exam</Button>
        </DialogActions>
      </Dialog>

      {/* ATTENDANCE DETAILS DIALOG */}
      <Dialog open={openAttendanceDialog} onClose={() => setOpenAttendanceDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Session Attendance: {selectedSessionDetails?.session?.subjectName}
        </DialogTitle>
        <DialogContent>
          {loadingDetails ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : !selectedSessionDetails || selectedSessionDetails.records.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No students checked-in for this session yet.
            </Typography>
          ) : (
            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider', mt: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Roll Number</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Check-in Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedSessionDetails.records.map((r, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ fontWeight: 'bold' }}>{r.rollNumber}</TableCell>
                      <TableCell>{r.studentName}</TableCell>
                      <TableCell>{r.studentEmail}</TableCell>
                      <TableCell>{new Date(r.createdAt || r.timestamp).toLocaleTimeString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAttendanceDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* EXAM SCHEDULING DIALOG */}
      <Dialog open={openScheduleDialog} onClose={() => setOpenScheduleDialog(false)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Schedule MCQ Exam</DialogTitle>
        <form onSubmit={handleScheduleSubmit}>
          <DialogContent sx={{ pt: 1 }}>
            <TextField
              fullWidth
              required
              type="date"
              label="Schedule Date"
              InputLabelProps={{ shrink: true }}
              value={scheduleForm.scheduleDate}
              onChange={(e) => setScheduleForm({ ...scheduleForm, scheduleDate: e.target.value })}
              sx={{ mb: 2, mt: 1 }}
            />
            <TextField
              fullWidth
              required
              label="Start Time"
              placeholder="e.g. 10:00 AM"
              value={scheduleForm.startTime}
              onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              required
              label="End Time"
              placeholder="e.g. 11:00 AM"
              value={scheduleForm.endTime}
              onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
              sx={{ mb: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenScheduleDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save Schedule</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
