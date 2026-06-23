import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  Grid,
} from '@mui/material';
import QRCode from 'qrcode.react';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import { useAuthStore } from '../store/authStore';
import { getFacultyCourses, createAttendanceSession, AttendanceSessionData } from '../firebase/dbService';
import { Course } from '../types';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, isPlaceholder } from '../firebase/config';

export const QrGenerate: React.FC = () => {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [session, setSession] = useState<AttendanceSessionData | null>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [loading, setLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [presentStudentsCount, setPresentStudentsCount] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  // Load faculty courses
  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) return;
      try {
        const list = await getFacultyCourses(user.uid);
        setCourses(list);
        if (list.length > 0) {
          setSelectedCourseId(list[0].id);
        }
      } catch (err) {
        console.error('Error fetching courses:', err);
      } finally {
        setCoursesLoading(false);
      }
    };
    fetchCourses();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (unsubRef.current) unsubRef.current();
    };
  }, [user]);

  // Handle Generate click
  const handleGenerate = async () => {
    if (!selectedCourseId || !user) return;
    setLoading(true);
    setError(null);
    setSession(null);
    setPresentStudentsCount(0);
    setTimeLeft(300);

    if (timerRef.current) clearInterval(timerRef.current);
    if (unsubRef.current) unsubRef.current();

    try {
      const newSession = await createAttendanceSession(selectedCourseId, user.uid);
      setSession(newSession);

      // Start countdown
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Listen for updates to track students checking in
      if (!isPlaceholder) {
        // Cloud Firestore listener
        unsubRef.current = onSnapshot(doc(db, 'attendance', newSession.id), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as AttendanceSessionData;
            setPresentStudentsCount(data.studentsPresent?.length || 0);
          }
        });
      } else {
        // Local fallback polling
        unsubRef.current = (() => {
          const pollInterval = setInterval(() => {
            const sessions = localStorage.getItem('eh_attendance')
              ? JSON.parse(localStorage.getItem('eh_attendance')!)
              : [];
            const current = sessions.find((s: any) => s.sessionId === newSession.id);
            if (current) {
              setPresentStudentsCount(current.studentsPresent?.length || 0);
            }
          }, 3000);

          return () => clearInterval(pollInterval);
        })();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create attendance session.');
    } finally {
      setLoading(false);
    }
  };

  // Format time (e.g., 04:59)
  const formatTimeLeft = () => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (coursesLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  return (
    <Box sx={{ mt: 2 }} className="animate-fade-in">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800 }}>
          Generate Attendance QR
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Select a course and generate a unique QR code valid for 5 minutes.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Side: Course Selection Form */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Setup Check-In Session
              </Typography>
              <Divider sx={{ mb: 3, opacity: 0.08 }} />

              {courses.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  You have not been assigned to any courses yet. Admins must assign courses.
                </Alert>
              ) : (
                <Box>
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel id="course-select-label">Select Course</InputLabel>
                    <Select
                      labelId="course-select-label"
                      value={selectedCourseId}
                      label="Select Course"
                      onChange={(e) => setSelectedCourseId(e.target.value)}
                    >
                      {courses.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    onClick={handleGenerate}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CalendarTodayIcon />}
                    sx={{ height: 48 }}
                  >
                    {loading ? 'Starting Session...' : 'Generate Attendance QR'}
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Side: QR Code Viewer */}
        <Grid item xs={12} md={7}>
          {session ? (
            <Card sx={{ textAlign: 'center', minHeight: 450 }}>
              <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.light' }}>
                  {selectedCourse?.name} ({selectedCourse?.code})
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 3 }}>
                  Session ID: {session.sessionId}
                </Typography>

                {timeLeft > 0 ? (
                  <Box
                    className="glass-panel"
                    sx={{
                      p: 3,
                      borderRadius: 4,
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      mb: 3,
                      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    <QRCode
                      value={session.qrCodeHash}
                      size={240}
                      bgColor="#111827"
                      fgColor="#6366f1"
                      level="Q"
                    />
                  </Box>
                ) : (
                  <Paper
                    sx={{
                      p: 5,
                      borderRadius: 4,
                      backgroundColor: 'rgba(239, 68, 68, 0.05)',
                      border: '1px dashed rgba(239, 68, 68, 0.3)',
                      mb: 3,
                      width: 288,
                      height: 288,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <HourglassEmptyIcon color="error" sx={{ fontSize: 60, mb: 1 }} />
                    <Typography variant="h6" color="error.light" sx={{ fontWeight: 'bold' }}>
                      QR Expired
                    </Typography>
                    <Typography variant="caption" color="text.secondary" align="center" sx={{ px: 2 }}>
                      The 5-minute checkout window has closed. Generate a new code.
                    </Typography>
                  </Paper>
                )}

                {timeLeft > 0 ? (
                  <Box sx={{ display: 'flex', gap: 4, mt: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <HourglassEmptyIcon color="warning" />
                      <Box sx={{ textAlign: 'left' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                          {formatTimeLeft()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Time Remaining
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PeopleIcon color="secondary" />
                      <Box sx={{ textAlign: 'left' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                          {presentStudentsCount}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Students Present
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.light' }}>
                    <CheckCircleOutlineIcon />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Session finished. Total check-ins: {presentStudentsCount}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 450, border: '1px dashed rgba(255,255,255,0.06)' }}>
              <CardContent sx={{ textAlign: 'center', color: 'text.secondary' }}>
                <HourglassEmptyIcon sx={{ fontSize: 60, opacity: 0.3, mb: 1 }} />
                <Typography variant="body2">
                  No active session. Select a course and launch to display the check-in QR code.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};
export default QrGenerate;
