import React, { useState, useEffect } from 'react';
import {
  Typography,
  Grid,
  Paper,
  Box,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  IconButton,
  Card,
  CardContent,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import SyncIcon from '@mui/icons-material/Sync';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CampaignIcon from '@mui/icons-material/Campaign';
import PeopleIcon from '@mui/icons-material/People';
import ClassIcon from '@mui/icons-material/Class';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PaymentIcon from '@mui/icons-material/Payment';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { useAuthStore } from '../store/authStore';
import {
  getTimetable,
  getNotices,
  getStudentAttendanceStats,
  getPendingLeaves,
  updateLeaveStatus,
  getFacultyAssignmentStats,
  getAdminMetrics,
  getStudentFeeRecords,
  AttendanceStats,
  AssignmentStats,
  AdminMetrics,
} from '../firebase/dbService';
import { seedLocalDb, seedCloudFirestore } from '../firebase/dbSeeder';
import { isPlaceholder } from '../firebase/config';
import { TimetableEntry, Notice, LeaveRequest, FeeRecord } from '../types';
import { formatDate } from '../utils/format';

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

// Recharts Custom Tooltip
const CustomChartTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <Paper
        className="glass-panel"
        sx={{
          p: 1.5,
          border: '1px solid rgba(255, 255, 255, 0.12)',
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          borderRadius: 2,
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
          {payload[0].name || payload[0].payload.name || payload[0].payload.courseCode}
        </Typography>
        <Typography variant="caption" sx={{ color: 'primary.light', display: 'block' }}>
          {payload[0].name === 'Paid' || payload[0].name === 'Pending'
            ? `Records: ${payload[0].value}`
            : `Submissions: ${payload[0].value}`}
        </Typography>
        {payload[1] && (
          <Typography variant="caption" sx={{ color: 'secondary.light', display: 'block' }}>
            {`Total Class: ${payload[1].value}`}
          </Typography>
        )}
      </Paper>
    );
  }
  return null;
};

// ============================================================================
// STUDENT DASHBOARD
// ============================================================================
export const StudentDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [timetable, setTimetable] = useState<(TimetableEntry & { courseName: string; courseCode: string })[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [attendance, setAttendance] = useState<AttendanceStats[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [ttData, noticeData, attData, feeData] = await Promise.all([
        getTimetable(user.uid, 'student'),
        getNotices('student'),
        getStudentAttendanceStats(user.uid),
        getStudentFeeRecords(user.uid),
      ]);
      setTimetable(ttData);
      setNotices(noticeData);
      setAttendance(attData);
      setFees(feeData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Calculate Overall Attendance percentage
  const totalPresences = attendance.reduce((sum, item) => sum + item.presentCount, 0);
  const totalSessions = attendance.reduce((sum, item) => sum + item.totalCount, 0);
  const overallPercentage = totalSessions ? Math.round((totalPresences / totalSessions) * 100) : 100;

  // Chart Data for Attendance
  const chartColors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <Box sx={{ mt: 2 }} className="animate-fade-in">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800 }}>
          {getGreeting()}, {user?.name}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here is a summary of your schedules and classes.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Hand: Timetable & Notices */}
        <Grid item xs={12} lg={8}>
          <Grid container spacing={3}>
            {/* Timetable Widget */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <CalendarTodayIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      My Weekly Timetable
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2, opacity: 0.08 }} />
                  {timetable.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                      No classes scheduled. Ensure you are enrolled in courses.
                    </Typography>
                  ) : (
                    <List disablePadding>
                      {timetable.map((t, idx) => (
                        <React.Fragment key={t.id}>
                          <ListItem sx={{ py: 1.5, px: 0 }}>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                    {t.courseName} ({t.courseCode})
                                  </Typography>
                                  <Chip
                                    size="small"
                                    label={t.day}
                                    color="primary"
                                    variant="outlined"
                                    sx={{ fontWeight: 'bold' }}
                                  />
                                </Box>
                              }
                              secondary={
                                <Typography variant="caption" color="text.secondary">
                                  Time: {t.startTime} - {t.endTime} | Room: {t.room}
                                </Typography>
                              }
                            />
                          </ListItem>
                          {idx < timetable.length - 1 && <Divider sx={{ opacity: 0.05 }} />}
                        </React.Fragment>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Notices Widget */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <CampaignIcon color="secondary" />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Recent Notices & Announcements
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2, opacity: 0.08 }} />
                  {notices.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                      No active announcements.
                    </Typography>
                  ) : (
                    <List disablePadding>
                      {notices.map((n, idx) => (
                        <React.Fragment key={n.id}>
                          <Box sx={{ py: 1.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {n.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Posted: {formatDate(n.createdAt)}
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {n.content}
                            </Typography>
                            <Chip size="small" label={`Expires: ${formatDate(n.expiresAt)}`} variant="outlined" />
                          </Box>
                          {idx < notices.length - 1 && <Divider sx={{ my: 1, opacity: 0.05 }} />}
                        </React.Fragment>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Right Hand: Attendance Stats & Fees */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={3}>
            {/* Attendance Chart Widget */}
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'left' }}>
                    Attendance Analytics
                  </Typography>
                  <Divider sx={{ mb: 2, opacity: 0.08 }} />

                  {attendance.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                      No attendance data available.
                    </Typography>
                  ) : (
                    <Box>
                      <Box sx={{ height: 180, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={attendance}
                              dataKey="percentage"
                              nameKey="courseCode"
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={75}
                              paddingAngle={4}
                            >
                              {attendance.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomChartTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                          <Typography variant="h4" sx={{ fontWeight: 800, color: overallPercentage >= 75 ? 'success.main' : 'error.main' }}>
                            {overallPercentage}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Overall Avg
                          </Typography>
                        </Box>
                      </Box>

                      {/* Subject breakdown list */}
                      <Box sx={{ textAlign: 'left', mt: 2 }}>
                        {attendance.map((att, idx) => (
                          <Box key={att.courseId} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: chartColors[idx % chartColors.length] }} />
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {att.courseCode}
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: att.percentage >= 75 ? 'success.light' : 'error.light' }}>
                              {att.percentage}% ({att.presentCount}/{att.totalCount})
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Pending Fees Info Widget */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <PaymentIcon color="warning" />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Fee Records
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2, opacity: 0.08 }} />
                  {fees.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 1, textAlign: 'center' }}>
                      No fee records found.
                    </Typography>
                  ) : (
                    <List disablePadding>
                      {fees.map((fee) => (
                        <ListItem key={fee.id} sx={{ px: 0, py: 1 }} secondaryAction={
                          <Chip
                            size="small"
                            label={fee.paid ? 'Paid' : 'Unpaid'}
                            color={fee.paid ? 'success' : 'warning'}
                            sx={{ fontWeight: 'bold' }}
                          />
                        }>
                          <ListItemText
                            primary={
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                Semester Tuition Fee
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                Due: {fee.dueDate} | Amount: ${fee.amount}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

// ============================================================================
// FACULTY DASHBOARD
// ============================================================================
export const FacultyDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [schedule, setSchedule] = useState<(TimetableEntry & { courseName: string; courseCode: string })[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [assignmentStats, setAssignmentStats] = useState<AssignmentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [schData, leavesData, statsData] = await Promise.all([
        getTimetable(user.uid, 'faculty'),
        getPendingLeaves(),
        getFacultyAssignmentStats(user.uid),
      ]);
      setSchedule(schData);
      setPendingLeaves(leavesData);
      setAssignmentStats(statsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleLeaveDecision = async (leaveId: string, decision: 'approved' | 'rejected') => {
    setSubmittingId(leaveId);
    try {
      await updateLeaveStatus(leaveId, decision);
      
      // Trigger local mock notification for leave decision
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification("EduTech Hub Notification", {
            body: `Leave request status updated to: ${decision.toUpperCase()}`
          });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
              new Notification("EduTech Hub Notification", {
                body: `Leave request status updated to: ${decision.toUpperCase()}`
              });
            }
          });
        }
      }

      // Reload leaves
      const updated = await getPendingLeaves();
      setPendingLeaves(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }} className="animate-fade-in">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800 }}>
          {getGreeting()}, Professor {user?.name}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your timetables, approvals, and course resources.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Side: Schedule & Leaves */}
        <Grid item xs={12} lg={8}>
          <Grid container spacing={3}>
            {/* Faculty Schedule */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <CalendarTodayIcon color="secondary" />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Today's Lecture Schedule
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2, opacity: 0.08 }} />
                  {schedule.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                      No classes scheduled.
                    </Typography>
                  ) : (
                    <List disablePadding>
                      {schedule.map((t, idx) => (
                        <React.Fragment key={t.id}>
                          <ListItem sx={{ py: 1.5, px: 0 }}>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                    {t.courseName} ({t.courseCode})
                                  </Typography>
                                  <Chip size="small" label={t.day} color="secondary" variant="outlined" />
                                </Box>
                              }
                              secondary={
                                <Typography variant="caption" color="text.secondary">
                                  Time Slot: {t.startTime} - {t.endTime} | Location: {t.room}
                                </Typography>
                              }
                            />
                          </ListItem>
                          {idx < schedule.length - 1 && <Divider sx={{ opacity: 0.05 }} />}
                        </React.Fragment>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Leave Approvals */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <PeopleIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Pending Student Leave Applications
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2, opacity: 0.08 }} />
                  {pendingLeaves.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                      No pending leave applications.
                    </Typography>
                  ) : (
                    <TableContainer component={Box}>
                      <Table size="small" sx={{ minWidth: 500 }}>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Student</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Reason</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Duration</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {pendingLeaves.map((l) => (
                            <TableRow key={l.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                              <TableCell sx={{ fontWeight: 500 }}>{l.studentName || 'Student'}</TableCell>
                              <TableCell sx={{ color: 'text.secondary', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {l.reason}
                              </TableCell>
                              <TableCell>
                                {l.fromDate} to {l.toDate}
                              </TableCell>
                              <TableCell align="right">
                                {submittingId === l.id ? (
                                  <CircularProgress size={20} />
                                ) : (
                                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                    <IconButton
                                      size="small"
                                      color="success"
                                      onClick={() => handleLeaveDecision(l.id, 'approved')}
                                    >
                                      <CheckIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleLeaveDecision(l.id, 'rejected')}
                                    >
                                      <CloseIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Right Side: Assignment Stats */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AssignmentIcon color="warning" />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Assignment Statistics
                </Typography>
              </Box>
              <Divider sx={{ mb: 2, opacity: 0.08 }} />
              {assignmentStats.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  No active assignments.
                </Typography>
              ) : (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    Submissions compared to class sizes:
                  </Typography>
                  <Box sx={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={assignmentStats} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.05} />
                        <XAxis dataKey="courseCode" stroke="#9ca3af" fontSize={11} tickLine={false} />
                        <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                        <Tooltip content={<CustomChartTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar name="Submissions" dataKey="submittedCount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        <Bar name="Class Size" dataKey="totalStudents" fill="rgba(255,255,255,0.08)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                  
                  {/* Detailed list view */}
                  <Box sx={{ mt: 3 }}>
                    {assignmentStats.map((item) => (
                      <Box key={item.assignmentId} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {item.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'primary.light' }}>
                            {item.submittedCount}/{item.totalStudents} submitted
                          </Typography>
                        </Box>
                        <Box sx={{ width: '100%', height: 6, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                          <Box sx={{ width: `${(item.submittedCount / item.totalStudents) * 100}%`, height: '100%', bgcolor: 'secondary.main', borderRadius: 3 }} />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// ============================================================================
// ADMIN DASHBOARD
// ============================================================================
export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [seedingType, setSeedingType] = useState<'local' | 'cloud' | null>(null);
  const [seedSuccess, setSeedSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAdminMetrics();
      setMetrics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSeedLocal = () => {
    setSeedingType('local');
    setSeedSuccess(null);
    setTimeout(() => {
      try {
        seedLocalDb(true); // force reload
        setSeedSuccess('Successfully seeded local storage Sandbox database with fresh mockup records!');
        loadData();
      } catch (err) {
        console.error(err);
      } finally {
        setSeedingType(null);
      }
    }, 1000);
  };

  const handleSeedCloud = async () => {
    setSeedingType('cloud');
    setSeedSuccess(null);
    try {
      await seedCloudFirestore();
      setSeedSuccess('Successfully seeded remote Cloud Firestore database with fresh collections!');
      loadData();
    } catch (err: any) {
      console.error(err);
      setSeedSuccess(`Cloud seeding failed: ${err.message || err.toString()}`);
    } finally {
      setSeedingType(null);
    }
  };

  if (loading || !metrics) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Fees Data for PieChart
  const feesData = [
    { name: 'Paid', value: metrics.paidFeesCount || 10 },
    { name: 'Pending', value: metrics.pendingFeesCount || 6 },
  ];
  const feesColors = ['#10b981', '#f59e0b']; // Success Green, Warning Amber

  return (
    <Box sx={{ mt: 2 }} className="animate-fade-in">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800 }}>
          {getGreeting()}, Administrator
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Operations, metrics dashboard, and database configuration utilities.
        </Typography>
      </Box>

      {seedSuccess && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSeedSuccess(null)}>
          {seedSuccess}
        </Alert>
      )}

      {/* KPI Info Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', p: 3 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                  Total Students
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
                  {metrics.totalStudents}
                </Typography>
              </Box>
              <SchoolIcon color="primary" sx={{ fontSize: 40, ml: 'auto', opacity: 0.7 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                  Total Faculty
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
                  {metrics.totalFaculty}
                </Typography>
              </Box>
              <PeopleIcon color="secondary" sx={{ fontSize: 40, ml: 'auto', opacity: 0.7 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                  Active Courses
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
                  {metrics.totalCourses}
                </Typography>
              </Box>
              <ClassIcon color="warning" sx={{ fontSize: 40, ml: 'auto', opacity: 0.7 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                  Departments
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
                  {metrics.totalDepartments}
                </Typography>
              </Box>
              <PeopleIcon color="error" sx={{ fontSize: 40, ml: 'auto', opacity: 0.7 }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Left Side: Fee records charts */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'left' }}>
                Tuition Fee Records Status
              </Typography>
              <Divider sx={{ mb: 2, opacity: 0.08 }} />
              
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={7}>
                  <Box sx={{ height: 220, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={feesData}
                          dataKey="value"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={50}
                          paddingAngle={3}
                        >
                          {feesData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={feesColors[index % feesColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomChartTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>
                <Grid item xs={12} md={5} sx={{ textAlign: 'left' }}>
                  <Paper className="glass-panel" sx={{ p: 2.5, mb: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                      Paid Records
                    </Typography>
                    <Typography variant="h6" color="success.main" sx={{ fontWeight: 800 }}>
                      {metrics.paidFeesCount} invoices
                    </Typography>
                  </Paper>
                  <Paper className="glass-panel" sx={{ p: 2.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                      Outstanding Invoices
                    </Typography>
                    <Typography variant="h6" color="warning.main" sx={{ fontWeight: 800 }}>
                      {metrics.pendingFeesCount} invoices
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Side: Database Utilities */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Database Control Center
              </Typography>
              <Divider sx={{ mb: 2, opacity: 0.08 }} />

              <Alert severity={isPlaceholder ? 'warning' : 'info'} sx={{ mb: 3, borderRadius: 2 }}>
                {isPlaceholder ? (
                  <Typography variant="caption" display="block">
                    ⚠️ <strong>Local Sandbox Mode Active</strong>. Writing to browser local storage. Set credentials in `.env.local` to switch to Firebase.
                  </Typography>
                ) : (
                  <Typography variant="caption" display="block">
                    🟢 <strong>Cloud Firebase Connected</strong>. Read/writes are synced directly with the online Firestore.
                  </Typography>
                )}
              </Alert>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Use these developer triggers to seed the database with a pre-configured educational system:
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="outlined"
                  color="primary"
                  fullWidth
                  onClick={handleSeedLocal}
                  disabled={seedingType !== null}
                  startIcon={seedingType === 'local' ? <CircularProgress size={16} /> : <SyncIcon />}
                  sx={{ height: 44 }}
                >
                  {seedingType === 'local' ? 'Seeding Local...' : 'Reset Local Sandbox Data'}
                </Button>

                <Button
                  variant="contained"
                  color="secondary"
                  fullWidth
                  onClick={handleSeedCloud}
                  disabled={seedingType !== null || isPlaceholder}
                  startIcon={seedingType === 'cloud' ? <CircularProgress size={16} /> : <SyncIcon />}
                  sx={{ height: 44 }}
                >
                  {seedingType === 'cloud' ? 'Pushing Cloud Data...' : 'Seed Cloud Firestore'}
                </Button>
                
                {isPlaceholder && (
                  <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block' }}>
                    * Cloud Seeding disabled when running on local placeholders
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
