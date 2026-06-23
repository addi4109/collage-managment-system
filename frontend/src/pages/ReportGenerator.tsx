import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

import { useAuthStore } from '../store/authStore';
import {
  getAllUsers,
  getStudentAttendanceStats,
  getStudentAssignments,
  AttendanceStats,
} from '../firebase/dbService';
import { UserProfile } from '../types';
import { isPlaceholder } from '../firebase/config';

export const ReportGenerator: React.FC = () => {
  const { user } = useAuthStore();
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Student Report Data Preview States
  const [studentProfile, setStudentProfile] = useState<UserProfile | null>(null);
  const [attendance, setAttendance] = useState<AttendanceStats[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  useEffect(() => {
    const initPage = async () => {
      if (!user) return;
      setLoading(true);
      try {
        if (user.role === 'admin' || user.role === 'faculty') {
          const list = await getAllUsers();
          const studentList = list.filter((u) => u.role === 'student');
          setStudents(studentList);
          if (studentList.length > 0) {
            setSelectedStudentId(studentList[0].uid);
          }
        } else {
          // Student only reviews themselves
          setSelectedStudentId(user.uid);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    initPage();
  }, [user]);

  // Load preview data when student selection changes
  useEffect(() => {
    const loadPreviewData = async () => {
      if (!selectedStudentId) return;
      try {
        // Resolve profile
        let profile = null;
        if (user?.role === 'student' && selectedStudentId === user.uid) {
          profile = user;
        } else {
          profile = students.find((s) => s.uid === selectedStudentId) || null;
        }
        setStudentProfile(profile);

        // Load stats
        const [attStats, asgList] = await Promise.all([
          getStudentAttendanceStats(selectedStudentId),
          getStudentAssignments(selectedStudentId),
        ]);
        setAttendance(attStats);
        setAssignments(asgList);
      } catch (err) {
        console.error('Error loading report preview:', err);
      }
    };
    loadPreviewData();
  }, [selectedStudentId, students, user]);

  const handleGenerateReport = async () => {
    if (!selectedStudentId) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    // Sandbox Fallback
    if (isPlaceholder) {
      // In local mode, we instruct the user to print the page to PDF
      // Using @media print CSS styles, browser print creates a beautiful PDF of the transcript
      setSuccessMsg('Sandbox Mode: Rending print-ready layout below. Click "Print / Save PDF" to open browser PDF save window.');
      setTimeout(() => {
        window.print();
      }, 500);
      return;
    }

    // Cloud Mode
    setActionLoading(true);
    try {
      // Trigger Cloud Function (HTTPonRequest endpoint)
      // Standard Node URL setup: http://localhost:5001/edutech-hub-placeholder/us-central1/generateReport
      // Or production url based on config.
      const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
      const functionUrl = `https://us-central1-${projectId}.cloudfunctions.net/generateReport?studentId=${selectedStudentId}`;
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: selectedStudentId }),
      });

      if (!response.ok) {
        throw new Error('Server returned an error generating the PDF.');
      }

      const resData = await response.json();
      if (resData.downloadUrl) {
        // Open download link
        window.open(resData.downloadUrl, '_blank');
        setSuccessMsg('Report PDF generated successfully by Cloud Functions.');
      } else {
        throw new Error('Download link missing in server response.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to trigger cloud PDF generation.');
    } finally {
      setActionLoading(false);
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
      {/* CSS Print Styles to hide layout shells and format standard A4 report sheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
            background: none !important;
            color: #000 !important;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none !important;
            border: none !important;
            background-color: #fff !important;
          }
          /* Hide print buttons and layout */
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <Box sx={{ mb: 4 }} className="no-print">
        <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800 }}>
          Academic Report Card
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Generate official PDF progress reports summarizing student attendance and course grades.
        </Typography>
      </Box>

      {successMsg && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setSuccessMsg(null)} className="no-print">
          {successMsg}
        </Alert>
      )}

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setErrorMsg(null)} className="no-print">
          {errorMsg}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Side: Select Student Form */}
        {(user?.role === 'admin' || user?.role === 'faculty') && (
          <Grid item xs={12} className="no-print">
            <Card>
              <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <FormControl sx={{ minWidth: 260 }}>
                  <InputLabel id="student-select-label">Select Student</InputLabel>
                  <Select
                    labelId="student-select-label"
                    value={selectedStudentId}
                    label="Select Student"
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                  >
                    {students.map((st) => (
                      <MenuItem key={st.uid} value={st.uid}>
                        {st.name} ({st.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleGenerateReport}
                  disabled={actionLoading}
                  startIcon={actionLoading ? <CircularProgress size={16} /> : isPlaceholder ? <PrintIcon /> : <PictureAsPdfIcon />}
                  sx={{ height: 48 }}
                >
                  {actionLoading ? 'Compiling PDF...' : isPlaceholder ? 'Print / Save PDF' : 'Generate Cloud PDF'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Student View Button */}
        {user?.role === 'student' && (
          <Grid item xs={12} className="no-print" sx={{ mb: 1 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleGenerateReport}
              startIcon={isPlaceholder ? <PrintIcon /> : <PictureAsPdfIcon />}
              sx={{ height: 44 }}
            >
              {isPlaceholder ? 'Print / Save My PDF Report' : 'Download My Cloud PDF'}
            </Button>
          </Grid>
        )}

        {/* Right Side: Print Document Preview */}
        {studentProfile && (
          <Grid item xs={12}>
            <Card id="print-area" sx={{ p: 4, bgcolor: '#111827', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              {/* Report Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#6366f1' }}>
                    EduTech Hub
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Official Student Progress Report
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Date Generated
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {new Date().toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ mb: 3, opacity: 0.1 }} />

              {/* Student Meta Details */}
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                Student Details
              </Typography>
              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Name</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{studentProfile.name}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Email Address</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{studentProfile.email}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Academic Department</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{studentProfile.department || 'General'}</Typography>
                </Grid>
              </Grid>

              {/* Subject Attendance Breakdown */}
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                Subject Attendance Summary
              </Typography>
              {attendance.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>No attendance sessions logged.</Typography>
              ) : (
                <TableContainer component={Box} sx={{ mb: 4 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', color: 'primary.light' }}>Course Code</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'primary.light' }}>Course Name</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', color: 'primary.light' }}>Lectures Present</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.light' }}>Percentage</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attendance.map((row) => (
                        <TableRow key={row.courseId}>
                          <TableCell sx={{ fontWeight: 600 }}>{row.courseCode}</TableCell>
                          <TableCell>{row.courseName}</TableCell>
                          <TableCell align="center">{row.presentCount} / {row.totalCount}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', color: row.percentage >= 75 ? 'success.main' : 'error.main' }}>
                            {row.percentage}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Assignments / Grades Summary */}
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                Assignment & Homework Scores
              </Typography>
              {assignments.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No assignment entries recorded.</Typography>
              ) : (
                <TableContainer component={Box}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', color: 'primary.light' }}>Assignment</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'primary.light' }}>Course Code</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'primary.light' }}>Status</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.light' }}>Grade</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {assignments.map((row) => {
                        const isSubmitted = !!row.submission;
                        const isGraded = isSubmitted && !!row.submission.grade;
                        return (
                          <TableRow key={row.id}>
                            <TableCell sx={{ fontWeight: 600 }}>
                              {row.title}
                              {isGraded && row.feedback && (
                                <Typography variant="caption" display="block" color="text.secondary" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                                  Comments: "{row.feedback}"
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>{row.courseCode}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={isGraded ? 'Graded' : isSubmitted ? 'Submitted' : 'Pending'}
                                color={isGraded ? 'success' : isSubmitted ? 'info' : 'warning'}
                              />
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
                              {isGraded ? row.submission.grade : '-'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};
export default ReportGenerator;
