import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import QrCodeIcon from '@mui/icons-material/QrCode';
import RefreshIcon from '@mui/icons-material/Refresh';

import { getSessions, startSession, endSession } from '../services/sessionService';
import { useToast } from '../context/ToastContext';

export const MySessions: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadSessionsList = async (showProgress = true) => {
    if (showProgress) setLoading(true);
    setErrorMsg(null);
    try {
      const data = await getSessions();
      setSessions(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to retrieve sessions roster.');
    } finally {
      if (showProgress) setLoading(false);
    }
  };

  useEffect(() => {
    loadSessionsList();
  }, []);

  const handleStartSession = async (id: string) => {
    setActionLoadingId(id);
    try {
      await startSession(id);
      toast.success('Attendance session is now active!');
      // Reload session details
      await loadSessionsList(false);
      // Route directly to QR display page
      navigate(`/attendance/sessions/qr/${id}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to start session.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleEndSession = async (id: string) => {
    setActionLoadingId(id);
    try {
      await endSession(id);
      toast.success('Attendance session has been ended.');
      await loadSessionsList(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to end session.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'active':
        return <Chip label="Active" color="success" size="small" sx={{ fontWeight: 'bold' }} />;
      case 'ended':
        return <Chip label="Ended" color="default" size="small" sx={{ fontWeight: 'bold' }} />;
      case 'created':
      default:
        return <Chip label="Created" color="primary" size="small" sx={{ fontWeight: 'bold' }} />;
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
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800 }}>
            Manage Attendance Sessions
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View, start, or end active classroom QR code check-in sessions.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Tooltip title="Refresh Session List">
            <IconButton onClick={() => loadSessionsList(true)} sx={{ border: '1px solid rgba(255, 255, 255, 0.12)' }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/attendance/sessions/create')}
            sx={{ fontWeight: 600, borderRadius: 2 }}
          >
            Create Session
          </Button>
        </Box>
      </Box>

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {errorMsg}
        </Alert>
      )}

      <Card>
        <CardContent sx={{ p: 3 }}>
          {sessions.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                No attendance sessions created yet.
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => navigate('/attendance/sessions/create')}
                sx={{ borderRadius: 2 }}
              >
                Create First Session
              </Button>
            </Box>
          ) : (
            <TableContainer component={Box}>
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Session Title</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Course Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Department</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Date & Start</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Duration</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', pr: 4 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sessions.map((s) => {
                    const isActionLoading = actionLoadingId === s._id;
                    return (
                      <TableRow key={s._id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{s.sessionTitle}</TableCell>
                        <TableCell>{s.courseName}</TableCell>
                        <TableCell>{s.department || 'N/A'}</TableCell>
                        <TableCell>
                          {new Date(s.date).toLocaleDateString()} | {s.startTime}
                        </TableCell>
                        <TableCell>{s.duration} mins</TableCell>
                        <TableCell>{getStatusChip(s.status)}</TableCell>
                        <TableCell align="right" sx={{ pr: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            {s.status === 'created' && (
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={<PlayArrowIcon />}
                                disabled={isActionLoading}
                                onClick={() => handleStartSession(s._id)}
                                sx={{
                                  backgroundColor: '#10b981',
                                  '&:hover': { backgroundColor: '#059669' },
                                  textTransform: 'none',
                                  borderRadius: 1.5,
                                }}
                              >
                                {isActionLoading ? 'Starting...' : 'Start Session'}
                              </Button>
                            )}

                            {s.status === 'active' && (
                              <>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="secondary"
                                  startIcon={<QrCodeIcon />}
                                  onClick={() => navigate(`/attendance/sessions/qr/${s._id}`)}
                                  sx={{ textTransform: 'none', borderRadius: 1.5 }}
                                >
                                  View QR
                                </Button>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="error"
                                  startIcon={<StopIcon />}
                                  disabled={isActionLoading}
                                  onClick={() => handleEndSession(s._id)}
                                  sx={{ textTransform: 'none', borderRadius: 1.5 }}
                                >
                                  {isActionLoading ? 'Ending...' : 'End'}
                                </Button>
                              </>
                            )}

                            {s.status === 'ended' && (
                              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', pr: 2 }}>
                                Finished
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default MySessions;
