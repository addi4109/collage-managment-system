import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Grid,
} from '@mui/material';
import QRCode from 'qrcode.react';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import StopIcon from '@mui/icons-material/Stop';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { getSessions, endSession } from '../services/sessionService';
import { getAttendanceRecords } from '../services/attendanceService';
import { useToast } from '../context/ToastContext';

export const QrDisplay: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [session, setSession] = useState<any | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [presentStudentsCount, setPresentStudentsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [endingLoading, setEndingLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const loadSessionData = async () => {
    setErrorMsg(null);
    try {
      const list = await getSessions();
      const current = list.find((s: any) => s._id === id);

      if (!current) {
        setErrorMsg('Attendance session not found.');
        return;
      }

      setSession(current);

      if (current.status === 'active') {
        const expiresTime = new Date(current.expiresAt).getTime();
        const initialTimeLeft = Math.max(0, Math.floor((expiresTime - Date.now()) / 1000));
        setTimeLeft(initialTimeLeft);

        if (initialTimeLeft <= 0) {
          // If already expired but status was active, end it
          await handleAutoEnd(current._id);
        }
      } else if (current.status === 'ended') {
        setTimeLeft(0);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to load session details.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoEnd = async (sessionId: string) => {
    try {
      await endSession(sessionId);
      toast.info('Attendance session window has expired.');
      // Refresh session state
      const list = await getSessions();
      const current = list.find((s: any) => s._id === sessionId);
      if (current) setSession(current);
    } catch (err) {
      console.error('Failed to auto-end session:', err);
    }
  };

  useEffect(() => {
    loadSessionData();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [id]);

  // Start countdown and check-in polling if session is active
  useEffect(() => {
    if (!session || session.status !== 'active' || timeLeft <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Timer Interval
    timerRef.current = setInterval(async () => {
      const expiresTime = new Date(session.expiresAt).getTime();
      const updatedTimeLeft = Math.max(0, Math.floor((expiresTime - Date.now()) / 1000));
      setTimeLeft(updatedTimeLeft);

      if (updatedTimeLeft <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        await handleAutoEnd(session._id);
      }
    }, 1000);

    // Poll Checked-in students count every 3 seconds
    const fetchAttendeeCount = async () => {
      try {
        const records = await getAttendanceRecords(undefined, undefined, session._id);
        setPresentStudentsCount(records.length);
      } catch (err) {
        console.error('Error polling attendee count:', err);
      }
    };

    fetchAttendeeCount(); // initial fetch
    pollRef.current = setInterval(fetchAttendeeCount, 3000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [session, timeLeft]);

  const handleManualEnd = async () => {
    if (!session) return;
    setEndingLoading(true);
    try {
      await endSession(session._id);
      toast.success('Session ended.');
      navigate('/attendance/sessions');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to end session.');
    } finally {
      setEndingLoading(false);
    }
  };

  const formatTimeLeft = () => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (errorMsg || !session) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {errorMsg || 'Session not loaded.'}
        </Alert>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/attendance/sessions')}>
          Back to Sessions List
        </Button>
      </Box>
    );
  }

  const qrPayload = JSON.stringify({
    sessionToken: session.sessionToken,
    sessionId: session._id,
  });

  return (
    <Box sx={{ mt: 2 }} className="animate-fade-in">
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant="outlined"
          color="inherit"
          onClick={() => navigate('/attendance/sessions')}
          startIcon={<ArrowBackIcon />}
          sx={{ borderRadius: 2 }}
        >
          Back
        </Button>
        <Box>
          <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800 }}>
            Session Attendance QR Display
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Present this QR code to the class. Students can check in using their mobile portals.
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3} justifyContent="center">
        <Grid item xs={12} md={8} lg={6}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.light', mb: 0.5 }}>
                {session.courseName}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary', mb: 2 }}>
                {session.sessionTitle}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 4 }}>
                Session ID: {session._id}
              </Typography>

              {session.status === 'active' && timeLeft > 0 ? (
                <Box
                  className="glass-panel"
                  sx={{
                    p: 3,
                    borderRadius: 4,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    mb: 4,
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
                    backgroundColor: '#111827',
                  }}
                >
                  <QRCode
                    value={qrPayload}
                    size={260}
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
                    mb: 4,
                    width: 308,
                    height: 308,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <HourglassEmptyIcon color="error" sx={{ fontSize: 60, mb: 1 }} />
                  <Typography variant="h6" color="error.light" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Session Closed / Expired
                  </Typography>
                  <Typography variant="caption" color="text.secondary" align="center" sx={{ px: 2 }}>
                    This check-in window has finished. No further submissions are accepted.
                  </Typography>
                </Paper>
              )}

              {session.status === 'active' && timeLeft > 0 ? (
                <Box sx={{ display: 'flex', gap: 6, mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <HourglassEmptyIcon color="warning" sx={{ fontSize: 28 }} />
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                        {formatTimeLeft()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Time Remaining
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <PeopleIcon color="secondary" sx={{ fontSize: 28 }} />
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                        {presentStudentsCount}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Students Present
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.light', mb: 4 }}>
                  <CheckCircleOutlineIcon />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Check-in window ended. Total check-ins: {presentStudentsCount}
                  </Typography>
                </Box>
              )}

              {session.status === 'active' && (
                <Button
                  variant="contained"
                  color="error"
                  size="large"
                  startIcon={endingLoading ? <CircularProgress size={20} color="inherit" /> : <StopIcon />}
                  disabled={endingLoading}
                  onClick={handleManualEnd}
                  sx={{ width: '100%', maxWidth: 300, height: 48, borderRadius: 2 }}
                >
                  {endingLoading ? 'Ending...' : 'End Session Immediately'}
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default QrDisplay;
