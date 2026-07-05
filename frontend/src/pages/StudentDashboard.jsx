import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  LinearProgress,
  Divider,
  CircularProgress,
  IconButton,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AlertIcon from '@mui/icons-material/Warning';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CancelIcon from '@mui/icons-material/Cancel';
import PrintIcon from '@mui/icons-material/Print';

import { api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { TableSkeleton } from '../components/SkeletonLoader';
import TimetableTab from '../components/TimetableTab';
import LostFoundTab from '../components/LostFoundTab';
import AssignmentTab from '../components/AssignmentTab';
import NoticeTab from '../components/NoticeTab';
import AcademicCalendarTab from '../components/AcademicCalendarTab';
import MonthlyReportTab from '../components/MonthlyReportTab';
import FeeInvoiceTab from '../components/FeeInvoiceTab';
import PlacementTab from '../components/PlacementTab';
import ComplaintsTab from '../components/ComplaintsTab';
import LibraryTab from '../components/LibraryTab';
import ScholarshipTab from '../components/ScholarshipTab';
import ContactSupportTab from '../components/ContactSupportTab';
import LatestUpdatesPanel from '../components/LatestUpdatesPanel';

export default function StudentDashboard() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'stats';
  const { showToast } = useToast();

  // Data States
  const [stats, setStats] = useState(null);
  const [fees, setFees] = useState([]);
  const [exams, setExams] = useState([]);
  const [marksheet, setMarksheet] = useState(null);
  const [applications, setApplications] = useState([]);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Manual Check-in Input
  const [sessionToken, setSessionToken] = useState('');

  // QR Scanner states
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const scannerRef = useRef(null);

  // Application Form
  const [openAppDialog, setOpenAppDialog] = useState(false);
  const [appForm, setAppForm] = useState({ type: 'Leave Application', description: '' });

  // Exam Attempt States (Proctored MCQ client)
  const [activeExam, setActiveExam] = useState(null);
  const [examAttempt, setExamAttempt] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [warningsCount, setWarningsCount] = useState(0);

  // Timer reference
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  // Load Primary Data based on Tab
  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'stats') {
        const res = await api.get('/reports/analytics');
        setStats(res.data);
      } else if (tab === 'attendance') {
        const res = await api.get('/attendance/student-summary');
        setFees(res.data); // reuse fee state container for attendance summaries
      } else if (tab === 'exams') {
        const res = await api.get('/exams/student');
        setExams(res.data);
      } else if (tab === 'results') {
        // Load marksheet for Sem 1 as default, can filter later
        try {
          const res = await api.get('/results/marksheet?semester=Sem 1');
          setMarksheet(res.data);
        } catch (e) {
          setMarksheet(null);
        }
      } else if (tab === 'applications') {
        const res = await api.get('/applications/my');
        setApplications(res.data);
      }
    } catch (err) {
      showToast('Error loading details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tab]);

  // QR Attendance check-in submit
  const handleCheckInSubmit = async (e) => {
    e.preventDefault();
    if (!sessionToken) return showToast('Please enter a session token.', 'warning');
    setSubmitLoading(true);
    try {
      await api.post('/attendance/checkin', { sessionToken });
      showToast('Attendance checked-in successfully.', 'success');
      setSessionToken('');
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Check-in failed. Session expired.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Start camera QR scanner
  const startScanner = useCallback(async () => {
    setScanResult(null);
    setScanning(true);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const html5QrCode = new Html5Qrcode('qr-scanner-region');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decodedText) => {
          // Parse the QR data — faculty encodes { sessionToken: '...' }
          let token = decodedText;
          try {
            const parsed = JSON.parse(decodedText);
            if (parsed.sessionToken) token = parsed.sessionToken;
          } catch (_) {
            // raw string token
          }

          setScanResult(token);
          await stopScanner();

          // Auto submit check-in
          try {
            await api.post('/attendance/checkin', { sessionToken: token });
            showToast('✅ Attendance marked successfully!', 'success');
            setScannerOpen(false);
            setScanResult(null);
            loadData();
          } catch (err) {
            showToast(err.response?.data?.message || 'Check-in failed. Token may be expired.', 'error');
          }
        },
        () => {} // ignore per-frame errors
      );
    } catch (err) {
      showToast('Camera access denied or not available.', 'error');
      setScanning(false);
    }
  }, []);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        // state 2 = SCANNING
        if (state === 2) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (_) {}
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const handleCloseScannerDialog = useCallback(async () => {
    await stopScanner();
    setScannerOpen(false);
    setScanResult(null);
  }, [stopScanner]);

  // Submit leave application
  const handleAppSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      await api.post('/applications', appForm);
      showToast('Application request submitted successfully.', 'success');
      setOpenAppDialog(false);
      loadData();
    } catch (err) {
      showToast('Error submitting request.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  // ── Proctoring Event Triggers ──
  const logViolation = async (eventType, details) => {
    if (!activeExam) return;
    try {
      const res = await api.post(`/exams/${activeExam._id}/violation`, { eventType, details });
      setWarningsCount(res.data.attempt.proctorWarnings);
      showToast(`PROCTOR WARNING [${res.data.attempt.proctorWarnings}/3]: ${details}`, 'error');
      
      if (res.data.autoSubmitted) {
        showToast('Maximum proctor violations reached. Exam auto-submitted.', 'error');
        handleCleanExamAttempt();
      }
    } catch (err) {
      console.error('Failed to log violation:', err);
    }
  };

  const handleStartExam = async (exam) => {
    if (!window.confirm('Do you want to start this exam? Fullscreen will be requested, and tab switches are monitored.')) return;
    try {
      const res = await api.post(`/exams/${exam._id}/attempt`);
      setActiveExam(exam);
      setExamAttempt(res.data.attempt);
      setSelectedAnswers(new Array(exam.questions.length).fill(-1));
      setCurrentQuestionIndex(0);
      setWarningsCount(0);
      setTimeLeft(exam.duration * 60);

      // Enter Fullscreen
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }

      showToast('Exam attempt started. Proctoring is active.', 'info');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to start attempt.', 'error');
    }
  };

  // Timer Countdown loop
  useEffect(() => {
    if (!activeExam) return;
    if (timeLeft <= 0) {
      handleForceSubmitExam();
      return;
    }

    timerRef.current = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timerRef.current);
  }, [timeLeft, activeExam]);

  // Dynamic proctoring event listeners mapping
  useEffect(() => {
    if (!activeExam) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        logViolation('TAB_SWITCH', 'Student switched browser tabs or minimized window.');
      }
    };

    const handleBlur = () => {
      logViolation('FOCUS_LOST', 'Student moved focus away from the test window.');
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      logViolation('RIGHT_CLICK_ATTEMPT', 'Student attempted to right-click exam client.');
    };

    const handleCopyPaste = (e) => {
      e.preventDefault();
      logViolation('COPY_PASTE_ATTEMPT', 'Student attempted copy/paste shortcuts.');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
    };
  }, [activeExam]);

  const handleForceSubmitExam = async () => {
    try {
      await api.post(`/exams/${activeExam._id}/submit-attempt`, { answers: selectedAnswers });
      showToast('Exam submitted successfully.', 'success');
    } catch (err) {
      showToast('Failed to submit exam attempt.', 'error');
    } finally {
      handleCleanExamAttempt();
    }
  };

  const handleCleanExamAttempt = () => {
    setActiveExam(null);
    setExamAttempt(null);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    loadData();
  };

  // mark sheet print trigger
  const handlePrint = () => {
    window.print();
  };

  return (
    <Box>
      {/* RENDER EXAM TAKING CLIENT IN FULL SCREEN OVERLAY */}
      {activeExam && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', bgcolor: 'background.paper', zIndex: 9999, p: 4, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{activeExam.title}</Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Chip label={`Warnings: ${warningsCount}/3`} color={warningsCount > 0 ? 'error' : 'default'} />
              <Chip label={`Time Left: ${Math.floor(timeLeft / 60)}m ${timeLeft % 60}s`} color="primary" />
            </Box>
          </Box>
          <Divider sx={{ mb: 3 }} />

          {/* Current question display */}
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Question {currentQuestionIndex + 1} of {activeExam.questions.length}
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, fontSize: '1.2rem', fontWeight: 500 }}>
              {activeExam.questions[currentQuestionIndex].questionText}
            </Typography>

            <Grid container spacing={2} sx={{ maxWidth: 600 }}>
              {activeExam.questions[currentQuestionIndex].options.map((opt, idx) => {
                const isSelected = selectedAnswers[currentQuestionIndex] === idx;
                return (
                  <Grid item xs={12} key={idx}>
                    <Button
                      fullWidth
                      variant={isSelected ? 'contained' : 'outlined'}
                      onClick={() => {
                        const newAns = [...selectedAnswers];
                        newAns[currentQuestionIndex] = idx;
                        setSelectedAnswers(newAns);
                      }}
                      sx={{ justifyContent: 'flex-start', py: 2, px: 3 }}
                    >
                      {opt}
                    </Button>
                  </Grid>
                );
              })}
            </Grid>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            >
              Previous
            </Button>
            {currentQuestionIndex < activeExam.questions.length - 1 ? (
              <Button
                variant="contained"
                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              >
                Next Question
              </Button>
            ) : (
              <Button
                variant="contained"
                color="success"
                onClick={handleForceSubmitExam}
              >
                Submit Exam
              </Button>
            )}
          </Box>
        </Box>
      )}

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
                    <Typography variant="body2">My Attendance Percentage</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800 }}>{stats.attendancePercentage}%</Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card sx={{ p: 3, borderRadius: '16px', bgcolor: 'warning.light', color: '#fff' }}>
                    <Typography variant="body2">Fees Outstanding Balance</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800 }}>${stats.feesDue}</Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card sx={{ p: 3, borderRadius: '16px', bgcolor: 'success.light', color: '#fff' }}>
                    <Typography variant="body2">Available MCQ Exams</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800 }}>{stats.upcomingExamsCount}</Typography>
                  </Card>
                </Grid>
              </Grid>

              {/* Recent Notices Feed */}
              <Card sx={{ p: 3, borderRadius: '16px' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Recent Campus Announcements</Typography>
                {stats.recentNotices?.length === 0 ? (
                  <Typography color="text.secondary">No announcements posted for your batch.</Typography>
                ) : (
                  <Box>
                    {stats.recentNotices?.map((n) => (
                      <Box key={n.id} sx={{ mb: 2.5, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{n.title}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(n.createdAt).toLocaleDateString()} • {n.facultyName}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{n.content}</Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Card>

              {/* LATEST UPDATES FEED */}
              <LatestUpdatesPanel role="student" />
            </Box>
          )}

          {/* SCAN ATTENDANCE */}
          {tab === 'attendance' && (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>Attendance Check-In</Typography>

              <Grid container spacing={4} justifyContent="center">
                {/* QR SCANNER CARD */}
                <Grid item xs={12} md={5}>
                  <Card sx={{
                    p: 4, borderRadius: '24px', textAlign: 'center',
                    background: 'linear-gradient(145deg, #4F46E5 0%, #06b6d4 100%)',
                    color: '#fff', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 16px 40px rgba(79,70,229,0.4)' },
                  }}
                    onClick={() => { setScannerOpen(true); }}
                  >
                    <QrCodeScannerIcon sx={{ fontSize: 72, mb: 2, opacity: 0.95 }} />
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>Scan QR Code</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.85, mb: 3 }}>
                      Open your camera and point it at the QR code on the projector / faculty screen.
                    </Typography>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<CameraAltIcon />}
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.4)',
                        color: '#fff',
                        fontWeight: 'bold',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                      }}
                    >
                      Open Camera Scanner
                    </Button>
                  </Card>
                </Grid>

                {/* MANUAL TOKEN CARD */}
                <Grid item xs={12} md={5}>
                  <Card sx={{ p: 4, borderRadius: '24px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Manual Token Entry</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Can't scan? Ask your faculty for the session token and enter it below.
                    </Typography>
                    <form onSubmit={handleCheckInSubmit}>
                      <TextField
                        fullWidth
                        label="Session Token"
                        placeholder="Paste or type session token here"
                        value={sessionToken}
                        onChange={(e) => setSessionToken(e.target.value)}
                        sx={{ mb: 2 }}
                      />
                      <Button fullWidth size="large" variant="contained" type="submit" disabled={submitLoading || !sessionToken}>
                        {submitLoading ? <CircularProgress size={22} color="inherit" /> : 'Mark Attendance'}
                      </Button>
                    </form>
                  </Card>
                </Grid>
              </Grid>

              {/* Attendance Summary Table */}
              {fees.length > 0 && (
                <Box sx={{ mt: 5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>My Attendance Summary</Typography>
                  <TableContainer component={Paper} sx={{ borderRadius: '16px' }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Subject</TableCell>
                          <TableCell align="center">Sessions Held</TableCell>
                          <TableCell align="center">Present</TableCell>
                          <TableCell align="right">Attendance %</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {fees.map((row, idx) => (
                          <TableRow key={idx}>
                            <TableCell sx={{ fontWeight: 'bold' }}>{row.subjectName}</TableCell>
                            <TableCell align="center">{row.totalSessions}</TableCell>
                            <TableCell align="center">{row.present}</TableCell>
                            <TableCell align="right">
                              <Chip
                                label={`${row.percentage}%`}
                                color={row.percentage >= 75 ? 'success' : row.percentage >= 60 ? 'warning' : 'error'}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* QR CAMERA SCANNER DIALOG */}
              <Dialog
                open={scannerOpen}
                onClose={handleCloseScannerDialog}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: '24px', overflow: 'hidden' } }}
              >
                <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <QrCodeScannerIcon color="primary" />
                    Scan Attendance QR
                  </Box>
                  <IconButton size="small" onClick={handleCloseScannerDialog}>
                    <CancelIcon />
                  </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                  {/* Camera viewfinder region */}
                  <Box
                    id="qr-scanner-region"
                    sx={{ width: '100%', minHeight: 300, bgcolor: '#000' }}
                  />
                  {!scanning && !scanResult && (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Click below to activate your camera and scan the QR code shown by your faculty.
                      </Typography>
                      <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        startIcon={<CameraAltIcon />}
                        onClick={startScanner}
                        sx={{ borderRadius: '12px' }}
                      >
                        Activate Camera
                      </Button>
                    </Box>
                  )}
                  {scanning && (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        📷 Camera active — align QR code within the frame
                      </Typography>
                    </Box>
                  )}
                  {scanResult && (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <CheckCircleIcon color="success" sx={{ fontSize: 48, mb: 1 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>QR Code Scanned!</Typography>
                      <Typography variant="caption" color="text.secondary">Submitting your attendance...</Typography>
                      <CircularProgress size={20} sx={{ display: 'block', mx: 'auto', mt: 1 }} />
                    </Box>
                  )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                  <Button onClick={handleCloseScannerDialog} color="inherit" fullWidth variant="outlined" sx={{ borderRadius: '12px' }}>
                    Cancel
                  </Button>
                </DialogActions>
              </Dialog>
            </Box>
          )}

          {/* MCQ TEST CLIENT */}
          {tab === 'exams' && (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>My MCQ Examinations</Typography>
              {exams.length === 0 ? (
                <Typography color="text.secondary">No examinations scheduled for your course.</Typography>
              ) : (
                <TableContainer component={Paper} sx={{ borderRadius: '16px' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Exam Title</TableCell>
                        <TableCell>Subject</TableCell>
                        <TableCell>Duration</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {exams.map((e, idx) => (
                        <TableRow key={idx}>
                          <TableCell sx={{ fontWeight: 'bold' }}>{e.exam.title}</TableCell>
                          <TableCell>{e.exam.subjectId?.name}</TableCell>
                          <TableCell>{e.exam.duration} mins</TableCell>
                          <TableCell>
                            <Chip label={e.exam.status} color={e.exam.status === 'active' ? 'success' : 'default'} size="small" />
                          </TableCell>
                          <TableCell align="right">
                            {e.completed ? (
                              <Chip label={`Scored: ${e.score}`} color="secondary" />
                            ) : e.exam.status === 'active' ? (
                              <Button variant="contained" size="small" onClick={() => handleStartExam(e.exam)}>
                                Take Exam
                              </Button>
                            ) : (
                              <Button disabled variant="outlined" size="small">
                                Locked
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* MY SEM MARKSHEET */}
          {tab === 'results' && (
            <Box>
              {marksheet ? (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 3, '@media print': { display: 'none' } }}>
                    <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>Print Marksheet</Button>
                  </Box>
                  <Card sx={{ p: 6, borderRadius: '24px', maxWidth: 800, mx: 'auto', border: '2px solid', borderColor: 'divider' }}>
                    {/* Header */}
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', mb: 1 }}>
                        METROPOLITAN ENGINEERING COLLEGE
                      </Typography>
                      <Typography variant="subtitle1" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 2 }}>
                        Semester Examination Marksheet
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 4 }} />

                    {/* Student Metadata */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Student Name</Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{marksheet.student.name}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Enrollment Number</Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{marksheet.student.enrollmentNumber}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Department</Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{marksheet.student.department}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Semester / Year</Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {marksheet.student.semester} ({marksheet.student.year})
                        </Typography>
                      </Grid>
                    </Grid>

                    {/* Subjects Marks Table */}
                    <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider', mb: 4 }}>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell>Subject</TableCell>
                            <TableCell align="right">Internals (20)</TableCell>
                            <TableCell align="right">Practical (30)</TableCell>
                            <TableCell align="right">Theory (80)</TableCell>
                            <TableCell align="right">Total (130)</TableCell>
                            <TableCell align="center">Grade</TableCell>
                            <TableCell align="right">Result</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {marksheet.results.map((r, idx) => (
                            <TableRow key={idx}>
                              <TableCell sx={{ fontWeight: 'bold' }}>{r.subjectName}</TableCell>
                              <TableCell align="right">{r.internalMarks}</TableCell>
                              <TableCell align="right">{r.practicalMarks}</TableCell>
                              <TableCell align="right">{r.theoryMarks}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold' }}>{r.totalMarks}</TableCell>
                              <TableCell align="center">
                                <Chip label={r.grade} size="small" color={r.grade === 'F' ? 'error' : 'primary'} />
                              </TableCell>
                              <TableCell align="right">
                                <Typography sx={{ fontWeight: 'bold', color: r.pass ? 'success.main' : 'error.main' }}>
                                  {r.pass ? 'PASS' : 'FAIL'}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* GPA / CGPA Summary */}
                    {marksheet.summary && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 3, bgcolor: 'action.hover', borderRadius: '16px' }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Semester SGPA</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>{marksheet.summary.sgpa}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Cumulative CGPA</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>{marksheet.summary.cgpa}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Avg Percentage</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{marksheet.summary.percentage}%</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Result Status</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>PASS</Typography>
                        </Box>
                      </Box>
                    )}
                  </Card>
                </Box>
              ) : (
                <Typography color="text.secondary">No declared semester results found for your profile.</Typography>
              )}
            </Box>
          )}

          {/* SUBMIT REQUEST APPLICATIONS */}
          {tab === 'applications' && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Leaves & Document Requests</Typography>
                <Button variant="contained" onClick={() => setOpenAppDialog(true)}>
                  Submit Application
                </Button>
              </Box>
              {applications.length === 0 ? (
                <Typography color="text.secondary">No submitted requests found.</Typography>
              ) : (
                <TableContainer component={Paper} sx={{ borderRadius: '16px' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Application Type</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Date Submitted</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Remarks</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {applications.map((a) => (
                        <TableRow key={a._id}>
                          <TableCell sx={{ fontWeight: 'bold' }}>{a.type}</TableCell>
                          <TableCell>{a.description}</TableCell>
                          <TableCell>{new Date(a.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Chip
                              label={a.status}
                              color={a.status === 'approved' ? 'success' : a.status === 'rejected' ? 'error' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{a.remarks || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* TIMETABLE TAB */}
          {tab === 'timetable' && (
            <TimetableTab role="student" />
          )}

          {/* LOST & FOUND TAB */}
          {tab === 'lostfound' && (
            <LostFoundTab />
          )}

          {/* NEW ERP TABS */}
          {tab === 'assignments' && (
            <AssignmentTab role="student" />
          )}

          {/* NOTICE BOARD TAB */}
          {tab === 'notices' && (
            <NoticeTab role="student" />
          )}

          {/* ACADEMIC CALENDAR TAB */}
          {tab === 'calendar' && (
            <AcademicCalendarTab role="student" />
          )}

          {/* MONTHLY REPORT TAB */}
          {tab === 'monthly-reports' && (
            <MonthlyReportTab role="student" />
          )}

          {/* FEE INVOICE TAB */}
          {tab === 'fees' && (
            <FeeInvoiceTab role="student" />
          )}

          {/* PLACEMENT TAB */}
          {tab === 'placements' && (
            <PlacementTab role="student" />
          )}

          {/* COMPLAINTS TAB */}
          {tab === 'complaints' && (
            <ComplaintsTab role="student" />
          )}

          {/* LIBRARY TAB */}
          {tab === 'library' && (
            <LibraryTab role="student" />
          )}

          {/* SCHOLARSHIP TAB */}
          {tab === 'scholarships' && (
            <ScholarshipTab role="student" />
          )}

          {tab === 'contact' && (
            <ContactSupportTab />
          )}
        </>
      )}

      {/* SUBMIT REQUEST DIALOG */}
      <Dialog open={openAppDialog} onClose={() => setOpenAppDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleAppSubmit}>
          <DialogTitle sx={{ fontWeight: 'bold' }}>Submit Application Request</DialogTitle>
          <DialogContent>
            <TextField
              select
              margin="dense"
              fullWidth
              required
              label="Request Type"
              value={appForm.type}
              onChange={(e) => setAppForm({ ...appForm, type: e.target.value })}
              sx={{ mb: 2, mt: 1 }}
            >
              {['Leave Application', 'Bonafide Request', 'Document Request', 'ID Card Request'].map(t => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </TextField>
            <TextField
              margin="dense"
              fullWidth
              required
              multiline
              rows={4}
              label="Application Details / Description"
              value={appForm.description}
              onChange={(e) => setAppForm({ ...appForm, description: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAppDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={submitLoading}>
              {submitLoading ? <CircularProgress size={24} /> : 'Submit'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
