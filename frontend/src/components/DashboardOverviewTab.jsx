import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, CircularProgress, Chip, Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import { useAuth, api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LatestUpdatesPanel from './LatestUpdatesPanel';

export default function DashboardOverviewTab() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/reports/analytics');
        setStats(res.data);
      } catch (err) {
        showToast('Failed to load dashboard data.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [showToast]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  if (!stats) return <Typography>Error loading stats.</Typography>;

  const renderPrincipalDashboard = () => (
    <Box>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <ColorfulStatCard title="Total Students" value={stats.totalStudents || 0} color="primary.light" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ColorfulStatCard title="Total Faculty" value={stats.totalFaculty || 0} color="warning.light" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ColorfulStatCard title="Avg Attendance" value={`${stats.averageAttendance || 0}%`} color="success.light" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ColorfulStatCard title="Pending Apps" value={stats.pendingApplications || 0} color="secondary.light" />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.examStats && (
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: '16px', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Exam Status Overview</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}><StatRow label="Draft" value={stats.examStats.draft || 0} /></Grid>
                  <Grid item xs={6}><StatRow label="Scheduled" value={stats.examStats.scheduled || 0} /></Grid>
                  <Grid item xs={6}><StatRow label="Active" value={stats.examStats.active || 0} /></Grid>
                  <Grid item xs={6}><StatRow label="Ended" value={stats.examStats.ended || 0} /></Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {stats.billing && (
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: '16px', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Financial Overview</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}><StatRow label="Total Revenue" value={`$${stats.billing.totalRevenue}`} color="success.main" /></Grid>
                  <Grid item xs={12}><StatRow label="Pending Dues" value={`$${stats.billing.pendingAmount}`} color="error.main" /></Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      <LatestUpdatesPanel role="principal" />
    </Box>
  );

  const renderHodDashboard = () => (
    <Box>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <ColorfulStatCard title="Department Students" value={stats.totalStudents || 0} color="primary.light" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <ColorfulStatCard title="Department Faculty" value={stats.totalFaculty || 0} color="warning.light" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <ColorfulStatCard title="Pending Applications" value={stats.pendingApplications || 0} color="success.light" />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.activeSessions && stats.activeSessions.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: '16px', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Today's Active Sessions</Typography>
                {stats.activeSessions.map((session) => (
                  <Box key={session.sessionId} sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle2">{session.subjectName}</Typography>
                      <Typography variant="body2" color="text.secondary">By {session.facultyName} • {session.startTime} ({session.duration}m)</Typography>
                    </Box>
                    <Chip label={`${session.checkinCount} Joined`} color="primary" size="small" />
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        )}

        {stats.upcomingExams && stats.upcomingExams.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: '16px', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Upcoming Exams</Typography>
                {stats.upcomingExams.map((exam) => (
                  <Box key={exam._id} sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle2">{exam.title}</Typography>
                      <Typography variant="body2" color="text.secondary">{exam.subjectId?.name} • {new Date(exam.date).toLocaleDateString()}</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight="bold">{exam.duration}m</Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      <LatestUpdatesPanel role="hod" />
    </Box>
  );

  const renderFacultyDashboard = () => (
    <Box>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <ColorfulStatCard title="My Scoped Students" value={stats.myStudents || 0} color="primary.light" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <ColorfulStatCard title="Pending Admission Enquiries" value={stats.pendingAdmissions || 0} color="warning.light" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <ColorfulStatCard title="Upcoming MCQ Exams" value={stats.upcomingExams?.length || 0} color="success.light" />
        </Grid>
      </Grid>

      {stats.activeSessions && (
        <Card sx={{ p: 3, borderRadius: '16px', mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Today's Active Attendance Check-Ins</Typography>
          {stats.activeSessions.length === 0 ? (
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
                  {stats.activeSessions.map((s, idx) => (
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
      )}

      <LatestUpdatesPanel role="faculty" />
    </Box>
  );

  const renderStudentDashboard = () => (
    <Box>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <ColorfulStatCard title="My Attendance Percentage" value={`${stats.attendancePercentage || 0}%`} color="primary.light" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <ColorfulStatCard title="Fees Outstanding Balance" value={`$${stats.feesDue || 0}`} color="warning.light" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <ColorfulStatCard title="Available MCQ Exams" value={stats.upcomingExamsCount || 0} color="success.light" />
        </Grid>
      </Grid>

      <Card sx={{ p: 3, borderRadius: '16px', mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Recent Campus Announcements</Typography>
        {stats.recentNotices?.length === 0 ? (
          <Typography color="text.secondary">No announcements posted for your batch.</Typography>
        ) : (
          <Box>
            {stats.recentNotices?.map((n) => (
              <Box key={n.id || n._id} sx={{ mb: 2.5, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{n.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(n.createdAt).toLocaleDateString()} • {n.facultyName || n.authorName}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{n.content}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </Card>

      <LatestUpdatesPanel role="student" />
    </Box>
  );

  return (
    <Box>
      {user?.role === 'principal' && renderPrincipalDashboard()}
      {user?.role === 'hod' && renderHodDashboard()}
      {user?.role === 'faculty' && renderFacultyDashboard()}
      {user?.role === 'student' && renderStudentDashboard()}
    </Box>
  );
}

function ColorfulStatCard({ title, value, color }) {
  return (
    <Card sx={{ p: 3, borderRadius: '16px', bgcolor: color, color: '#fff', height: '100%' }}>
      <Typography variant="body2">{title}</Typography>
      <Typography variant="h3" sx={{ fontWeight: 800 }}>{value}</Typography>
    </Card>
  );
}

function StatRow({ label, value, color }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="subtitle1" fontWeight="bold" color={color}>{value}</Typography>
    </Box>
  );
}
