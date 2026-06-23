import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SchoolIcon from '@mui/icons-material/School';
import { useAuthStore } from '../store/authStore';
import { getStudentReports, Report } from '../services/reportService';
import { useToast } from '../context/ToastContext';

export const StudentReportView: React.FC = () => {
  const { user } = useAuthStore();
  const toast = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReportIndex, setSelectedReportIndex] = useState<number>(-1);

  useEffect(() => {
    const fetchReports = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const data = await getStudentReports(user.uid);
        setReports(data);
        if (data.length > 0) {
          setSelectedReportIndex(0); // select the latest report first
        }
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || 'Failed to load report cards.');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (reports.length === 0) {
    return (
      <Box sx={{ mt: 2 }} className="animate-fade-in">
        <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800, mb: 1 }}>
          My Report Cards
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          View finalized monthly academic performance and attendance reports.
        </Typography>
        <Card sx={{ border: '1px dashed rgba(255,255,255,0.06)', bgcolor: '#111827' }}>
          <CardContent sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
            <AssessmentIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
            <Typography variant="body1">No report cards have been published for you yet.</Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const selectedReport = reports[selectedReportIndex];

  return (
    <Box sx={{ mt: 2 }} className="animate-fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        <Box>
          <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800, mb: 1 }}>
            My Report Cards
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Select a month to view details of your academic progress report.
          </Typography>
        </Box>

        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel id="select-report-label">Select Month / Year</InputLabel>
          <Select
            labelId="select-report-label"
            value={selectedReportIndex}
            label="Select Month / Year"
            onChange={(e) => setSelectedReportIndex(Number(e.target.value))}
          >
            {reports.map((r, idx) => (
              <MenuItem key={r._id} value={idx}>
                {r.month} {r.year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {selectedReport && (
        <Grid container spacing={3}>
          {/* Header Summary Card */}
          <Grid item xs={12}>
            <Card sx={{ bgcolor: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
              <CardContent sx={{ p: 3 }}>
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={8}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <SchoolIcon color="primary" />
                      <Typography variant="h5" sx={{ fontWeight: 800 }}>
                        {selectedReport.courseName}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', color: 'text.secondary' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PersonIcon sx={{ fontSize: 16 }} />
                        <Typography variant="body2">Evaluated by: {selectedReport.facultyName}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarTodayIcon sx={{ fontSize: 16 }} />
                        <Typography variant="body2">
                          Period: {selectedReport.month} {selectedReport.year}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4} sx={{ textAlign: { md: 'right' } }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Overall Monthly Grade
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 900, color: 'secondary.light' }}>
                      {selectedReport.performanceGrade}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Attendance and Subject Marks */}
          <Grid item xs={12} md={5}>
            {/* Attendance Progress Card */}
            <Card sx={{ bgcolor: '#111827', border: '1px solid rgba(255,255,255,0.06)', mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Monthly Attendance
                </Typography>
                <Divider sx={{ opacity: 0.08, mb: 2.5 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Attendance Percentage
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.light' }}>
                    {selectedReport.attendancePercentage}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={selectedReport.attendancePercentage}
                  sx={{ height: 8, borderRadius: 4, mb: 3 }}
                />

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Total Classes
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {selectedReport.totalClasses}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Attended Classes
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {selectedReport.attendedClasses}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Behavioral Comments */}
            <Card sx={{ bgcolor: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Behavioral Review
                </Typography>
                <Divider sx={{ opacity: 0.08 }} />

                {selectedReport.behaviorComment && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Conduct & Behavior
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, lineHeight: 1.5 }}>
                      {selectedReport.behaviorComment}
                    </Typography>
                  </Box>
                )}

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Improvement Suggestions
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, lineHeight: 1.5, color: 'warning.light' }}>
                    {selectedReport.improvementSuggestions || 'No suggestions recorded.'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Academic Report Marks */}
          <Grid item xs={12} md={7}>
            <Card sx={{ bgcolor: '#111827', border: '1px solid rgba(255,255,255,0.06)', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Academic Assessment Breakdown
                </Typography>
                <Divider sx={{ opacity: 0.08, mb: 2 }} />

                <TableContainer component={Box} sx={{ flexGrow: 1 }}>
                  <Table size="medium">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Subject</TableCell>
                        <TableCell align="center" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Internal</TableCell>
                        <TableCell align="center" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>External</TableCell>
                        <TableCell align="center" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Total Marks</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedReport.subjects.map((sub, idx) => (
                        <TableRow key={idx}>
                          <TableCell sx={{ fontWeight: 600 }}>{sub.subjectName}</TableCell>
                          <TableCell align="center">{sub.internalMarks}</TableCell>
                          <TableCell align="center">{sub.externalMarks === null ? '—' : sub.externalMarks}</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold', color: 'primary.light' }}>
                            {sub.totalMarks}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 1.5, border: '1px solid rgba(255,255,255,0.04)' }}>
                  <Typography variant="caption" color="text.secondary">
                    Faculty Comments & Feedback
                  </Typography>
                  <Typography variant="body1" sx={{ fontStyle: 'italic', mt: 0.5, lineHeight: 1.5 }}>
                    "{selectedReport.remarks}"
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default StudentReportView;
