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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockResetIcon from '@mui/icons-material/LockReset';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
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
import ComplaintsTab from '../components/ComplaintsTab';
import LibraryTab from '../components/LibraryTab';
import ScholarshipTab from '../components/ScholarshipTab';
import NotificationTab from '../components/NotificationTab';

export default function AdminDashboard() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'stats';
  const { showToast } = useToast();

  // Dialog and Form States
  const [openFacultyDialog, setOpenFacultyDialog] = useState(false);
  const [facultyForm, setFacultyForm] = useState({ name: '', username: '', password: '', assignedDepartments: [], assignedYears: [] });
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFacultyId, setEditFacultyId] = useState(null);
  
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
      if (tab === 'stats') {
        const res = await api.get('/reports/analytics');
        setStats(res.data);
      } else if (tab === 'faculty') {
        const res = await api.get('/faculty');
        setFaculties(res.data);
        await loadDepartments();
      } else if (tab === 'admissions') {
        const res = await api.get('/admissions/pending');
        setAdmissions(res.data);
      } else if (tab === 'results') {
        const res = await api.get('/results/pending');
        setResultBatches(res.data);
      } else if (tab === 'exams') {
        const res = await api.get('/exams/pending');
        setPendingExams(res.data);
      } else if (tab === 'audit') {
        const res = await api.get('/audit');
        setAuditLogs(res.data.logs || []);
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

  // Approve/Reject Admission
  const handleAdmissionReview = async (id, approve) => {
    try {
      const endpoint = approve ? `/admissions/approve/${id}` : `/admissions/reject/${id}`;
      await api.post(endpoint);
      showToast(`Admission request ${approve ? 'approved' : 'rejected'}.`, 'success');
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error updating admission.', 'error');
    }
  };

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

  // Faculty CRUD Operations
  const handleOpenFacultyForm = (faculty = null) => {
    if (faculty) {
      setIsEditMode(true);
      setEditFacultyId(faculty._id);
      setFacultyForm({
        name: faculty.userId.name,
        username: faculty.userId.username,
        password: '',
        assignedDepartments: faculty.assignedDepartments.map(d => d._id),
        assignedYears: faculty.assignedYears,
      });
    } else {
      setIsEditMode(false);
      setFacultyForm({ name: '', username: '', password: '', assignedDepartments: [], assignedYears: [] });
    }
    setOpenFacultyDialog(true);
  };

  const handleFacultySubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      if (isEditMode) {
        await api.put(`/faculty/${editFacultyId}`, facultyForm);
        if (facultyForm.password) {
          await api.put(`/faculty/${editFacultyId}/password`, { password: facultyForm.password });
        }
        showToast('Faculty profile updated.', 'success');
      } else {
        await api.post('/faculty', facultyForm);
        showToast('Faculty member registered successfully.', 'success');
      }
      setOpenFacultyDialog(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit faculty form.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteFaculty = async (id) => {
    if (!window.confirm('Are you sure you want to delete this faculty profile?')) return;
    try {
      await api.delete(`/faculty/${id}`);
      showToast('Faculty profile soft-deleted.', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to delete faculty.', 'error');
    }
  };

  const handleResetPasswordPrompt = async (faculty) => {
    const newPassword = window.prompt(`Enter new password for faculty member ${faculty.userId?.name}:`);
    if (newPassword === null) return; // cancelled
    if (!newPassword.trim()) {
      return showToast('Password cannot be empty.', 'warning');
    }

    try {
      await api.put(`/faculty/${faculty._id}/password`, { password: newPassword });
      showToast('Faculty password reset successfully.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reset password.', 'error');
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
            </Box>
          )}

          {/* FACULTY MANAGEMENT */}
          {tab === 'faculty' && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Faculty Directory</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenFacultyForm()}>
                  Register Faculty
                </Button>
              </Box>
              <TableContainer component={Paper} sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Username</TableCell>
                      <TableCell>Assigned Departments</TableCell>
                      <TableCell>Assigned Years</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {faculties.map((f) => (
                      <TableRow key={f._id}>
                        <TableCell sx={{ fontWeight: 'bold' }}>{f.userId?.name}</TableCell>
                        <TableCell>{f.userId?.username}</TableCell>
                        <TableCell>
                          {f.assignedDepartments.map(d => (
                            <Chip key={d._id} label={d.name} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                          ))}
                        </TableCell>
                        <TableCell>
                          {f.assignedYears.map((y, idx) => (
                            <Chip key={idx} label={y} size="small" variant="outlined" sx={{ mr: 0.5 }} />
                          ))}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => handleResetPasswordPrompt(f)} color="warning" title="Reset Password">
                            <LockResetIcon />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleOpenFacultyForm(f)} color="primary">
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDeleteFaculty(f._id)} color="error">
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

          {/* ADMISSIONS APPROVAL */}
          {tab === 'admissions' && (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>Pending Admission Approvals</Typography>
              {admissions.length === 0 ? (
                <Typography color="text.secondary">No pending admission requests found.</Typography>
              ) : (
                <TableContainer component={Paper} sx={{ borderRadius: '16px' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Enrollment</TableCell>
                        <TableCell>Student Name</TableCell>
                        <TableCell>Department</TableCell>
                        <TableCell>Year/Sem</TableCell>
                        <TableCell>Created By Faculty</TableCell>
                        <TableCell align="right">Review Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {admissions.map((a) => (
                        <TableRow key={a._id}>
                          <TableCell sx={{ fontWeight: 'bold' }}>{a.enrollmentNumber}</TableCell>
                          <TableCell>{a.name}</TableCell>
                          <TableCell>{a.departmentId?.name}</TableCell>
                          <TableCell>{a.year} - {a.semester}</TableCell>
                          <TableCell>{a.createdByFaculty?.name}</TableCell>
                          <TableCell align="right">
                            <IconButton color="success" onClick={() => handleAdmissionReview(a._id, true)}>
                              <CheckCircleIcon />
                            </IconButton>
                            <IconButton color="error" onClick={() => handleAdmissionReview(a._id, false)}>
                              <CancelIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* RESULT DECLARATION */}
          {tab === 'results' && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Pending Student Results</Typography>
                {resultBatches.length > 0 && (
                  <Button variant="contained" color="success" onClick={handleDeclareAll}>
                    Declare All Pending
                  </Button>
                )}
              </Box>
              {resultBatches.length === 0 ? (
                <Typography color="text.secondary">No submitted student results found.</Typography>
              ) : (
                <TableContainer component={Paper} sx={{ borderRadius: '16px' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Student</TableCell>
                        <TableCell>Roll Number</TableCell>
                        <TableCell>Department</TableCell>
                        <TableCell>Class</TableCell>
                        <TableCell>Submitted By</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {resultBatches.map((r) => (
                        <TableRow key={r._id}>
                          <TableCell sx={{ fontWeight: 'bold' }}>{r.studentName}</TableCell>
                          <TableCell>{r.rollNumber}</TableCell>
                          <TableCell>{r.departmentId?.name}</TableCell>
                          <TableCell>{r.year} - {r.semester}</TableCell>
                          <TableCell>{r.facultyId?.name}</TableCell>
                          <TableCell>
                            <Chip label={r.status} color="warning" size="small" />
                          </TableCell>
                          <TableCell align="right">
                            <Button size="small" variant="contained" color="success" onClick={() => handleDeclareBatch(r._id)}>
                              Approve & Declare
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* EXAM APPROVALS */}
          {tab === 'exams' && (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>Pending Exam Approvals</Typography>
              {pendingExams.length === 0 ? (
                <Typography color="text.secondary">No exams are pending approval right now.</Typography>
              ) : (
                <TableContainer component={Paper} sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Exam Title</TableCell>
                        <TableCell>Subject</TableCell>
                        <TableCell>Department</TableCell>
                        <TableCell>Class</TableCell>
                        <TableCell>Duration</TableCell>
                        <TableCell>Created By</TableCell>
                        <TableCell align="center">Questions</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pendingExams.map((e) => (
                        <TableRow key={e._id}>
                          <TableCell sx={{ fontWeight: 'bold' }}>{e.title}</TableCell>
                          <TableCell>{e.subjectId?.name || 'N/A'}</TableCell>
                          <TableCell>{e.departmentId?.name || 'N/A'}</TableCell>
                          <TableCell>{e.year} - {e.semester}</TableCell>
                          <TableCell>{e.duration} mins</TableCell>
                          <TableCell>{e.facultyId?.name || 'N/A'}</TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                setSelectedExam(e);
                                setOpenExamQuestionsDialog(true);
                              }}
                            >
                              View ({e.questions?.length || 0})
                            </Button>
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={() => handleReviewExam(e._id, true)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => handleReviewExam(e._id, false)}
                              >
                                Reject
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

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

          {/* GRIEVANCES TICKET RESOLVER TAB */}
          {tab === 'complaints' && (
            <ComplaintsTab role="admin" />
          )}

          {/* LIBRARY LEDGER TAB */}
          {tab === 'library' && (
            <LibraryTab role="admin" />
          )}

          {/* SCHOLARSHIP APPROVER TAB */}
          {tab === 'scholarships' && (
            <ScholarshipTab role="admin" />
          )}

          {/* NOTIFICATIONS TAB */}
          {tab === 'notifications' && (
            <NotificationTab role="admin" />
          )}
        </>
      )}

      {/* FACULTY REGISTRATION DIALOG */}
      <Dialog open={openFacultyDialog} onClose={() => setOpenFacultyDialog(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleFacultySubmit}>
          <DialogTitle sx={{ fontWeight: 'bold' }}>{isEditMode ? 'Modify Faculty Profile' : 'Register Faculty Member'}</DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              fullWidth
              required
              label="Full Name"
              value={facultyForm.name}
              onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })}
              sx={{ mb: 2, mt: 1 }}
            />
            <TextField
              margin="dense"
              fullWidth
              required
              label="Username"
              value={facultyForm.username}
              onChange={(e) => setFacultyForm({ ...facultyForm, username: e.target.value })}
              disabled={isEditMode}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              fullWidth
              required={!isEditMode}
              type="password"
              label={isEditMode ? "Reset Password (leave blank to keep current)" : "Password"}
              value={facultyForm.password || ''}
              onChange={(e) => setFacultyForm({ ...facultyForm, password: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              select
              margin="dense"
              fullWidth
              required
              label="Assign Department"
              SelectProps={{
                multiple: true,
                value: facultyForm.assignedDepartments,
                onChange: (e) => setFacultyForm({ ...facultyForm, assignedDepartments: e.target.value }),
              }}
              sx={{ mb: 2 }}
            >
              {departments.map((d) => (
                <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              margin="dense"
              fullWidth
              required
              label="Assign Year Scope"
              SelectProps={{
                multiple: true,
                value: facultyForm.assignedYears,
                onChange: (e) => setFacultyForm({ ...facultyForm, assignedYears: e.target.value }),
              }}
            >
              {['First Year', 'Second Year', 'Third Year'].map((y) => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenFacultyDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={submitLoading}>
              {submitLoading ? <CircularProgress size={24} /> : 'Save Profile'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

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
