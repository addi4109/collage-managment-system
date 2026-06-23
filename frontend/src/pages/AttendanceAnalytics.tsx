import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Alert,
} from '@mui/material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

import { useAuthStore } from '../store/authStore';
import {
  getStudentAttendanceStats,
  getFacultyCourses,
  getCourseSessions,
  AttendanceStats,
  AttendanceSessionData,
} from '../firebase/dbService';
import { Course, UserProfile } from '../types';
import { formatDate } from '../utils/format';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export const AttendanceAnalytics: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  // Student States
  const [studentStats, setStudentStats] = useState<AttendanceStats[]>([]);

  // Faculty States
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [sessions, setSessions] = useState<AttendanceSessionData[]>([]);
  const [selectedSession, setSelectedSession] = useState<AttendanceSessionData | null>(null);
  const [studentsList, setStudentsList] = useState<UserProfile[]>([]);

  useEffect(() => {
    const initPage = async () => {
      if (!user) return;
      setLoading(true);
      try {
        if (user.role === 'student') {
          const stats = await getStudentAttendanceStats(user.uid);
          setStudentStats(stats);
        } else {
          // Faculty view
          const facultyCourses = await getFacultyCourses(user.uid);
          setCourses(facultyCourses);
          if (facultyCourses.length > 0) {
            setSelectedCourseId(facultyCourses[0].id);
          }

          // Fetch all users to resolve names later
          const usersRaw = localStorage.getItem('eh_users')
            ? JSON.parse(localStorage.getItem('eh_users')!)
            : [];
          setStudentsList(usersRaw.filter((u: any) => u.role === 'student'));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    initPage();
  }, [user]);

  // Fetch sessions when selectedCourseId changes (Faculty only)
  useEffect(() => {
    const fetchSessions = async () => {
      if (!selectedCourseId || user?.role !== 'faculty') return;
      try {
        const list = await getCourseSessions(selectedCourseId);
        // Sort sessions by date desc
        list.sort((a, b) => b.date.localeCompare(a.date));
        setSessions(list);
        if (list.length > 0) {
          setSelectedSession(list[0]);
        } else {
          setSelectedSession(null);
        }
      } catch (err) {
        console.error('Error fetching course sessions:', err);
      }
    };
    fetchSessions();
  }, [selectedCourseId, user]);

  // Resolve Student Name from UID
  const getStudentName = (uid: string) => {
    const student = studentsList.find((s) => s.uid === uid);
    return student ? student.name : `UID: ${uid}`;
  };

  // Recharts Custom Tooltip for Attendance Percentages
  const CustomTooltip = ({ active, payload }: any) => {
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
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {payload[0].payload.courseName || payload[0].payload.courseCode}
          </Typography>
          <Typography variant="caption" sx={{ color: 'primary.light', display: 'block' }}>
            Attendance: {payload[0].value}%
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Attended: {payload[0].payload.presentCount} / {payload[0].payload.totalCount} lectures
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Render Student Layout
  const renderStudentView = () => {
    // Check for warnings
    const shortageCourses = studentStats.filter((c) => c.percentage < 75);

    return (
      <Grid container spacing={3}>
        {/* Warning Alerts */}
        {shortageCourses.length > 0 && (
          <Grid item xs={12}>
            <Alert
              severity="warning"
              icon={<WarningAmberIcon />}
              sx={{ borderRadius: 2, border: '1px solid rgba(245, 158, 11, 0.3)' }}
            >
              <strong>Attendance Shortage Alert!</strong> You are currently below the required 75% attendance in{' '}
              {shortageCourses.length} course(s):{' '}
              {shortageCourses.map((c) => `${c.courseCode} (${c.percentage}%)`).join(', ')}.
            </Alert>
          </Grid>
        )}

        {/* Attendance Bar Chart */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Subject Attendance Comparison
              </Typography>
              <Divider sx={{ mb: 2, opacity: 0.08 }} />
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={studentStats} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.05} />
                    <XAxis dataKey="courseCode" stroke="#9ca3af" fontSize={11} tickLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={11} domain={[0, 100]} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '75% Baseline', fill: '#ef4444', fontSize: 10, position: 'top' }} />
                    <Bar dataKey="percentage" fill="#6366f1" radius={[4, 4, 0, 0]}>
                      {studentStats.map((entry, index) => (
                        <Bar
                          key={`bar-${index}`}
                          dataKey="percentage"
                          fill={entry.percentage >= 75 ? '#6366f1' : '#ef4444'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Summary Table */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Detailed Log
              </Typography>
              <Divider sx={{ mb: 2, opacity: 0.08 }} />
              
              <TableContainer component={Box}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Course</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Present</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {studentStats.map((row) => (
                      <TableRow key={row.courseId}>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {row.courseCode}
                          <Typography variant="caption" display="block" color="text.secondary">
                            {row.courseName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {row.presentCount} / {row.totalCount}
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            size="small"
                            label={`${row.percentage}%`}
                            color={row.percentage >= 75 ? 'success' : 'error'}
                            sx={{ fontWeight: 'bold' }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Render Faculty Layout
  const renderFacultyView = () => {
    // Generate trend data for LineChart
    const trendData = [...sessions]
      .reverse() // show chronological order
      .map((s) => ({
        date: formatDate(s.date).split(',')[0], // just date part
        checkIns: s.studentsPresent?.length || 0,
      }));

    return (
      <Grid container spacing={3}>
        {/* Selection Dropdown */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Select Course
              </Typography>
              <Divider sx={{ mb: 3, opacity: 0.08 }} />
              {courses.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No courses assigned to review.
                </Typography>
              ) : (
                <FormControl fullWidth>
                  <InputLabel id="faculty-course-select-label">Course</InputLabel>
                  <Select
                    labelId="faculty-course-select-label"
                    value={selectedCourseId}
                    label="Course"
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                  >
                    {courses.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </CardContent>
          </Card>

          {/* Quick Metrics */}
          {sessions.length > 0 && (
            <Card sx={{ mt: 3 }}>
              <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <AssignmentTurnedInIcon color="primary" sx={{ fontSize: 40 }} />
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>
                    {sessions.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Lectures Taken
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Attendance Trend Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Attendance Trend (Students Present per Lecture)
              </Typography>
              <Divider sx={{ mb: 2, opacity: 0.08 }} />
              
              {sessions.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
                  No lectures have been registered for this course yet.
                </Typography>
              ) : (
                <Box sx={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.05} />
                      <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                      <Tooltip />
                      <Line type="monotone" name="Students Checked In" dataKey="checkIns" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sessions list & details */}
        {sessions.length > 0 && (
          <Grid item xs={12}>
            <Grid container spacing={3}>
              {/* Lecture list */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                      Lecture History (Select to view present students)
                    </Typography>
                    <Divider sx={{ mb: 2, opacity: 0.08 }} />

                    <TableContainer component={Box} sx={{ maxHeight: 300 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#111827' }}>Lecture Date</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#111827' }}>Students Checked In</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {sessions.map((s) => (
                            <TableRow
                              key={s.id}
                              hover
                              selected={selectedSession?.id === s.id}
                              onClick={() => setSelectedSession(s)}
                              sx={{ cursor: 'pointer' }}
                            >
                              <TableCell sx={{ fontWeight: 500 }}>
                                {formatDate(s.date)}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  size="small"
                                  label={`${s.studentsPresent?.length || 0} students`}
                                  color="secondary"
                                  variant="outlined"
                                  sx={{ fontWeight: 'bold' }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* checked-in students detail */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                      Students Present
                    </Typography>
                    <Divider sx={{ mb: 2, opacity: 0.08 }} />

                    {selectedSession ? (
                      <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                          Lecture Date: <strong>{formatDate(selectedSession.date)}</strong>
                        </Typography>
                        
                        {selectedSession.studentsPresent?.length === 0 ? (
                          <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                            No student checked in for this session.
                          </Typography>
                        ) : (
                          <List dense sx={{ maxHeight: 250, overflowY: 'auto', bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2 }}>
                            {selectedSession.studentsPresent.map((studentUid) => (
                              <ListItem key={studentUid}>
                                <ListItemText
                                  primary={getStudentName(studentUid)}
                                  primaryTypographyProps={{ fontWeight: 500 }}
                                  secondary={`UID: ${studentUid}`}
                                />
                              </ListItem>
                            ))}
                          </List>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                        Select a lecture session from the table to view the list of present students.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        )}
      </Grid>
    );
  };

  return (
    <Box sx={{ mt: 2 }} className="animate-fade-in">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800 }}>
          Attendance Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review subject percentages, session timelines, and student logs.
        </Typography>
      </Box>

      {user?.role === 'student' ? renderStudentView() : renderFacultyView()}
    </Box>
  );
};
export default AttendanceAnalytics;
