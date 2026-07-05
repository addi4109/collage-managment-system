import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockResetIcon from '@mui/icons-material/LockReset';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

import { api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { TableSkeleton } from '../components/SkeletonLoader';
import TimetableTab from '../components/TimetableTab';
import LostFoundTab from '../components/LostFoundTab';
import NoticeTab from '../components/NoticeTab';
import AcademicCalendarTab from '../components/AcademicCalendarTab';
import FeeInvoiceTab from '../components/FeeInvoiceTab';
import PlacementTab from '../components/PlacementTab';
import LibraryTab from '../components/LibraryTab';
import NotificationTab from '../components/NotificationTab';
import ContactSupportTab from '../components/ContactSupportTab';
import LatestUpdatesPanel from '../components/LatestUpdatesPanel';
import HodManagementTab from '../components/HodManagementTab';
import FacultyDirectoryTab from '../components/FacultyDirectoryTab';
import ApplicationApprovalsTab from '../components/ApplicationApprovalsTab';
import ExamApprovalsTab from '../components/ExamApprovalsTab';
import ResultApprovalsTab from '../components/ResultApprovalsTab';
import { getSemestersForYear } from '../utils/academicHelpers';

export default function PrincipalDashboard() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'overview';
  const { showToast } = useToast();

  // Data States
  const [stats, setStats] = useState(null);
  const [faculties, setFaculties] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [resultBatches, setResultBatches] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [pendingExams, setPendingExams] = useState([]);
  const [openExamQuestionsDialog, setOpenExamQuestionsDialog] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [pendingApplications, setPendingApplications] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Load Departments
  const loadDepartments = async () => {
    try {
      const res = await api.get('/departments');
      setDepartments(res.data);
    } catch (err) {
      showToast('Error loading departments.', 'error');
    }
  };

  // Load Dashboard Data depending on Tab
  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'overview') {
        const res = await api.get('/reports/analytics');
        setStats(res.data);
      } else if (tab === 'faculty') {
        const res = await api.get('/faculty');
        setFaculties(res.data);
        await loadDepartments();
      } else if (tab === 'results') {
        const res = await api.get('/results/pending');
        setResultBatches(res.data);
      } else if (tab === 'exams') {
        const res = await api.get('/exams/pending');
        setPendingExams(res.data);
      } else if (tab === 'audit') {
        const res = await api.get('/audit');
        setAuditLogs(res.data.logs || []);
      } else if (tab === 'applications') {
        const res = await api.get('/applications/pending');
        setPendingApplications(res.data);
      }
    } catch (err) {
      showToast('Failed to load portal data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tab]);



  // Declare Results
  const handleDeclareBatch = async (id) => {
    try {
      await api.post(`/results/declare/${id}`);
      showToast('Semester results batch declared successfully.', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to declare results.', 'error');
    }
  };

  const handleDeclareAll = async () => {
    try {
      await api.post('/results/declare-all');
      showToast('All approved results declared successfully.', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to declare results.', 'error');
    }
  };

  // MCQ Exam Approvals
  const handleReviewExam = async (examId, approve) => {
    try {
      await api.post(`/exams/${examId}/review`, { approve });
      showToast(`Exam ${approve ? 'approved' : 'rejected and returned to draft'}.`, 'success');
      loadData();
    } catch (err) {
      showToast('Failed to review exam.', 'error');
    }
  };

  // Subject Operations extracted to SubjectManagementTab


  return (
    <Box>
      {loading ? (
        <TableSkeleton />
      ) : (
        <>
          {/* STATS VIEW */}
          {tab === 'overview' && stats && (
            <Box>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ p: 3, borderRadius: '16px', bgcolor: 'primary.light', color: '#fff' }}>
                    <Typography variant="body2">Total Students Enrolled</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800 }}>{stats.totalStudents}</Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ p: 3, borderRadius: '16px', bgcolor: 'secondary.light', color: '#fff' }}>
                    <Typography variant="body2">Faculty Strength</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800 }}>{stats.totalFaculty}</Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ p: 3, borderRadius: '16px', bgcolor: 'success.light', color: '#fff' }}>
                    <Typography variant="body2">Average Attendance Rate</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800 }}>{stats.averageAttendance}%</Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ p: 3, borderRadius: '16px', bgcolor: 'warning.light', color: '#fff' }}>
                    <Typography variant="body2">Pending Applications</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800 }}>{stats.pendingApplications}</Typography>
                  </Card>
                </Grid>
              </Grid>

              <Grid container spacing={4}>
                <Grid item xs={12} md={7}>
                  <Card sx={{ p: 3, borderRadius: '16px' }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Fee Collection Analytics</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={[
                        { name: 'Total Billed', amount: stats.billing?.totalBilled || 0 },
                        { name: 'Total Collected', amount: stats.billing?.totalPaid || 0 },
                        { name: 'Total Due', amount: stats.billing?.totalDue || 0 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="amount" fill="#4F46E5" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </Grid>
                <Grid item xs={12} md={5}>
                  <Card sx={{ p: 3, borderRadius: '16px' }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Exam Status Matrix</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Draft', value: stats.examStats?.draft || 0 },
                            { name: 'Scheduled', value: stats.examStats?.scheduled || 0 },
                            { name: 'Active', value: stats.examStats?.active || 0 },
                            { name: 'Ended', value: stats.examStats?.ended || 0 }
                          ].filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name }) => name}
                        >
                          {['#cbd5e1', '#3b82f6', '#10b981', '#ef4444'].map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>
                </Grid>
              </Grid>

              {/* LATEST UPDATES FEED */}
              <LatestUpdatesPanel role="admin" />
            </Box>
          )}

          {/* FACULTY MANAGEMENT */}
          {tab === 'hods' && (
            <HodManagementTab />
          )}

          {/* FACULTY MANAGEMENT */}
          {tab === 'faculty' && (
            <FacultyDirectoryTab role="principal" />
          )}





          {/* RESULT DECLARATION */}
          {tab === 'results' && <ResultApprovalsTab />}

          {/* EXAM APPROVALS */}
          {tab === 'exams' && <ExamApprovalsTab />}



          {/* SYSTEM AUDIT LOGS */}
          {tab === 'audit' && (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>Security Audit Logs</Typography>
              <TableContainer component={Paper} sx={{ borderRadius: '16px' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Performed By</TableCell>
                      <TableCell>Action Type</TableCell>
                      <TableCell>IP Address</TableCell>
                      <TableCell>Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log._id}>
                        <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                        <TableCell>{log.performedBy?.name} ({log.performedBy?.role})</TableCell>
                        <TableCell>
                          <Chip label={log.action} size="small" color="primary" variant="outlined" />
                        </TableCell>
                        <TableCell>{log.ipAddress}</TableCell>
                        <TableCell>{log.details}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* TIMETABLE TAB */}
          {tab === 'timetable' && (
            <TimetableTab role="admin" />
          )}

          {/* LOST & FOUND TAB */}
          {tab === 'lostfound' && (
            <LostFoundTab />
          )}

          {/* NEW ERP TABS */}
          {tab === 'notices' && (
            <NoticeTab role="admin" />
          )}

          {/* ACADEMIC CALENDAR TAB */}
          {tab === 'calendar' && (
            <AcademicCalendarTab role="admin" />
          )}

          {/* FEES MANAGEMENT TAB */}
          {tab === 'fees' && (
            <FeeInvoiceTab role="admin" />
          )}

          {/* PLACEMENT CELL TAB */}
          {tab === 'placements' && (
            <PlacementTab role="admin" />
          )}

          {/* LIBRARY LEDGER TAB */}
          {tab === 'library' && (
            <LibraryTab role="admin" />
          )}

          {/* APPLICATION APPROVALS TAB */}
          {tab === 'applications' && <ApplicationApprovalsTab />}

          {/* NOTIFICATIONS TAB */}
          {tab === 'notifications' && (
            <NotificationTab role="admin" />
          )}

          {tab === 'contact' && (
            <ContactSupportTab />
          )}
        </>
      )}

      {/* EXAM QUESTIONS VIEW DIALOG */}
      <Dialog open={openExamQuestionsDialog} onClose={() => setOpenExamQuestionsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Exam Questions: {selectedExam?.title}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            {selectedExam?.questions?.map((q, idx) => (
              <Card key={idx} sx={{ p: 2.5, mb: 2, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1.5 }}>
                  Q{idx + 1}. {q.questionText}
                </Typography>
                <Grid container spacing={1.5}>
                  {q.options?.map((opt, optIdx) => (
                    <Grid item xs={12} sm={6} key={optIdx}>
                      <Box sx={{
                        p: 1.5,
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: optIdx === q.correctAnswerIndex ? 'success.main' : 'divider',
                        bgcolor: optIdx === q.correctAnswerIndex ? 'success.light' : 'background.paper',
                        color: optIdx === q.correctAnswerIndex ? 'success.contrastText' : 'text.primary',
                        fontWeight: optIdx === q.correctAnswerIndex ? 'bold' : 'normal',
                      }}>
                        Option {optIdx + 1}: {opt}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Card>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenExamQuestionsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
