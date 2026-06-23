import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  CircularProgress,
  Alert,
  Divider,
  Grid,
  Chip,
  IconButton,
  Paper,
  InputAdornment,
  Fade,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';

import {
  getFacultySessions,
  getSessionAttendance,
  SessionDetails,
  SessionAttendanceRecord,
} from '../services/attendanceService';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../context/ToastContext';

export const MarkAttendance: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuthStore();

  // Sessions list state
  const [sessions, setSessions] = useState<SessionDetails[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Filters state
  const [searchCourse, setSearchCourse] = useState('');
  const [searchDate, setSearchDate] = useState('');

  // Selected session state
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [presentStudents, setPresentStudents] = useState<SessionAttendanceRecord[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh reference
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Authentication check
  useEffect(() => {
    if (!user || (user.role !== 'faculty' && user.role !== 'admin')) {
      navigate('/unauthorized');
    }
  }, [user, navigate]);

  // Fetch all sessions on mount
  useEffect(() => {
    fetchSessionsList();
    return () => {
      stopAutoRefresh();
    };
  }, []);

  // Control auto-refresh based on selected session's activity
  useEffect(() => {
    if (selectedSessionId && sessionDetails && sessionDetails.status === 'active') {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }
    return () => stopAutoRefresh();
  }, [selectedSessionId, sessionDetails]);

  const fetchSessionsList = async () => {
    setLoadingSessions(true);
    setSessionError(null);
    try {
      const data = await getFacultySessions();
      setSessions(data);
    } catch (err: any) {
      console.error(err);
      setSessionError(err.message || 'Failed to retrieve attendance sessions.');
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchAttendanceDetails = async (sessionId: string, silent = false) => {
    if (!silent) {
      setLoadingAttendance(true);
    } else {
      setIsRefreshing(true);
    }
    setAttendanceError(null);
    try {
      const data = await getSessionAttendance(sessionId);
      setSessionDetails(data.session);
      setPresentStudents(data.presentStudents);
    } catch (err: any) {
      console.error(err);
      setAttendanceError(err.message || 'Failed to retrieve session check-ins.');
      toast.error('Failed to load live check-in list.');
    } finally {
      setLoadingAttendance(false);
      setIsRefreshing(false);
    }
  };

  const startAutoRefresh = () => {
    stopAutoRefresh(); // Clear any existing
    autoRefreshIntervalRef.current = setInterval(() => {
      if (selectedSessionId) {
        fetchAttendanceDetails(selectedSessionId, true);
      }
    }, 5000); // refresh every 5 seconds
  };

  const stopAutoRefresh = () => {
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
      autoRefreshIntervalRef.current = null;
    }
  };

  const handleViewAttendance = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setStudentSearchQuery('');
    fetchAttendanceDetails(sessionId);
  };

  const handleBackToSessions = () => {
    setSelectedSessionId(null);
    setSessionDetails(null);
    setPresentStudents([]);
    stopAutoRefresh();
    fetchSessionsList(); // Refresh list on going back
  };

  const handleManualRefresh = () => {
    if (selectedSessionId) {
      fetchAttendanceDetails(selectedSessionId);
    }
  };

  // Filter sessions
  const filteredSessions = sessions.filter((session) => {
    const query = searchCourse.toLowerCase();
    const matchesCourse =
      session.courseName.toLowerCase().includes(query) ||
      session.sessionTitle.toLowerCase().includes(query);

    if (!searchDate) return matchesCourse;

    const sessionDateString = new Date(session.date).toISOString().split('T')[0];
    return matchesCourse && sessionDateString === searchDate;
  });

  // Filter students checked in
  const filteredStudents = presentStudents.filter((student) => {
    const query = studentSearchQuery.toLowerCase();
    return (
      student.studentName.toLowerCase().includes(query) ||
      student.rollNumber.toLowerCase().includes(query)
    );
  });

  // Status Chip Renderer
  const renderStatusChip = (status: 'created' | 'active' | 'ended') => {
    switch (status) {
      case 'active':
        return (
          <Chip
            label="Active"
            color="success"
            size="small"
            sx={{
              fontWeight: 'bold',
              animation: 'pulse 1.5s infinite',
              '@keyframes pulse': {
                '0%': { opacity: 0.6, transform: 'scale(0.98)' },
                '50%': { opacity: 1, transform: 'scale(1.02)' },
                '100%': { opacity: 0.6, transform: 'scale(0.98)' },
              },
            }}
          />
        );
      case 'ended':
        return (
          <Chip
            label="Ended"
            variant="outlined"
            size="small"
            sx={{ color: 'text.secondary', borderColor: 'text.disabled', fontWeight: 600 }}
          />
        );
      case 'created':
      default:
        return (
          <Chip
            label="Created"
            color="info"
            size="small"
            sx={{ fontWeight: 'bold' }}
          />
        );
    }
  };

  // Display specific loading indicator
  if (loadingSessions && !selectedSessionId) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', py: 12, gap: 2 }}>
        <CircularProgress size={50} />
        <Typography variant="body2" color="text.secondary">
          Loading sessions directory...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }} className="animate-fade-in">
      {!selectedSessionId ? (
        // ================= SECTION 1: SESSION LIST =================
        <Box>
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800 }}>
                Manage Attendance
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Monitor automatic check-ins and review student session records.
              </Typography>
            </Box>
          </Box>

          {sessionError && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {sessionError}
            </Alert>
          )}

          {/* Filters Bar */}
          <Paper sx={{ p: 2.5, mb: 4, borderRadius: 3, backgroundColor: 'background.paper', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search Course or Title"
                  placeholder="e.g. Computer Networks..."
                  value={searchCourse}
                  onChange={(e) => setSearchCourse(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: searchCourse && (
                      <IconButton size="small" onClick={() => setSearchCourse('')}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Filter by Date"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    endAdornment: searchDate && (
                      <IconButton size="small" onClick={() => setSearchDate('')}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={5} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={fetchSessionsList}
                  sx={{ borderRadius: 2 }}
                >
                  Refresh Sessions
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate('/attendance/sessions/create')}
                  color="primary"
                  sx={{ borderRadius: 2, fontWeight: 'bold' }}
                >
                  Create New Session
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Session Cards Listing */}
          {filteredSessions.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
              <InfoIcon color="action" sx={{ fontSize: 48, mb: 1.5 }} />
              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
                No Sessions Found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {sessions.length === 0
                  ? "You haven't created any attendance sessions yet."
                  : "No sessions match your search criteria."}
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {filteredSessions.map((session) => (
                <Grid item xs={12} sm={6} md={4} key={session._id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 3,
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      backgroundColor: session.status === 'ended' ? 'rgba(255, 255, 255, 0.01)' : 'background.paper',
                      opacity: session.status === 'ended' ? 0.75 : 1,
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
                        borderColor: session.status === 'active' ? 'success.main' : 'rgba(255, 255, 255, 0.12)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            color: 'primary.light',
                            letterSpacing: 1,
                          }}
                        >
                          {session.courseName}
                        </Typography>
                        {renderStatusChip(session.status)}
                      </Box>

                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, lineBreak: 'anywhere' }}>
                        {session.sessionTitle}
                      </Typography>

                      {session.department && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Dept: {session.department}
                        </Typography>
                      )}

                      <Divider sx={{ my: 1.5, opacity: 0.05 }} />

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarTodayIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {new Date(session.date).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {session.startTime} ({session.duration} min)
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ mt: 'auto' }}>
                        <Button
                          fullWidth
                          variant={session.status === 'active' ? 'contained' : 'outlined'}
                          color={session.status === 'active' ? 'success' : 'primary'}
                          onClick={() => handleViewAttendance(session._id)}
                          sx={{
                            fontWeight: 'bold',
                            borderRadius: 2,
                            py: 1,
                            backgroundColor: session.status === 'active' ? '#10b981' : undefined,
                            '&:hover': {
                              backgroundColor: session.status === 'active' ? '#059669' : undefined,
                            },
                          }}
                        >
                          View Attendance
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      ) : (
        // ================= SECTION 2: ATTENDANCE VIEW PAGE =================
        <Fade in={!!selectedSessionId}>
          <Box>
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton onClick={handleBackToSessions} sx={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <ArrowBackIcon />
              </IconButton>
              <Box>
                <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800 }}>
                  Session Live Check-Ins
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Review student logs and verify status.
                </Typography>
              </Box>
            </Box>

            {attendanceError && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {attendanceError}
              </Alert>
            )}

            {loadingAttendance && !isRefreshing ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={3}>
                {/* Left Side Panel: Session details & stats */}
                <Grid item xs={12} md={4}>
                  <Card sx={{ borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.05)', mb: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          Session Info
                        </Typography>
                        {sessionDetails && renderStatusChip(sessionDetails.status)}
                      </Box>
                      <Divider sx={{ mb: 2, opacity: 0.08 }} />

                      {sessionDetails && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Course Name
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {sessionDetails.courseName}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Session Title
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {sessionDetails.sessionTitle}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Date & Time
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(sessionDetails.date).toLocaleDateString([], {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Started at {sessionDetails.startTime} ({sessionDetails.duration} Min duration)
                            </Typography>
                          </Box>
                          {sessionDetails.description && (
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Description
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {sessionDetails.description}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}
                    </CardContent>
                  </Card>

                  {/* Attendance Count Card */}
                  <Card sx={{ borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.05)', backgroundColor: 'rgba(16, 185, 129, 0.03)' }}>
                    <CardContent sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                        TOTAL STUDENTS PRESENT
                      </Typography>
                      <Typography variant="h2" sx={{ fontWeight: 900, my: 1, color: '#10b981' }}>
                        {presentStudents.length}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                        {sessionDetails?.status === 'active' ? (
                          <>
                            <CircularProgress size={10} color="success" />
                            <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                              Monitoring live updates (5s auto-refresh)
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            Session inactive. Logs are finalized.
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Right Side Panel: Student List Table */}
                <Grid item xs={12} md={8}>
                  <Card sx={{ borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                        <TextField
                          size="small"
                          label="Filter Students"
                          placeholder="Search student or roll number..."
                          value={studentSearchQuery}
                          onChange={(e) => setStudentSearchQuery(e.target.value)}
                          sx={{ width: { xs: '100%', sm: 260 } }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <SearchIcon color="action" />
                              </InputAdornment>
                            ),
                            endAdornment: studentSearchQuery && (
                              <IconButton size="small" onClick={() => setStudentSearchQuery('')}>
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            )
                          }}
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={isRefreshing ? <CircularProgress size={14} /> : <RefreshIcon />}
                          onClick={handleManualRefresh}
                          disabled={isRefreshing}
                        >
                          Manual Refresh
                        </Button>
                      </Box>

                      {filteredStudents.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
                          {presentStudents.length === 0
                            ? 'No student has checked in for this session yet.'
                            : 'No students match your filter query.'}
                        </Typography>
                      ) : (
                        <TableContainer component={Box}>
                          <Table size="medium">
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Roll Number</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Student Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Check-in Time</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', pr: 3 }}>Status</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {filteredStudents.map((student) => (
                                <TableRow key={student.studentId} hover>
                                  <TableCell sx={{ fontWeight: 600 }}>{student.rollNumber || 'N/A'}</TableCell>
                                  <TableCell>{student.studentName}</TableCell>
                                  <TableCell color="text.secondary">
                                    {new Date(student.checkInTime).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit',
                                    })}
                                  </TableCell>
                                  <TableCell align="right" sx={{ pr: 3 }}>
                                    <Chip
                                      icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                                      label="Present"
                                      color="success"
                                      size="small"
                                      sx={{ fontWeight: 'bold', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}
                                    />
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
            )}
          </Box>
        </Fade>
      )}
    </Box>
  );
};
export default MarkAttendance;
