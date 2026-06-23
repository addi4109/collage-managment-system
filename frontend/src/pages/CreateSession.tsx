import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { useAuthStore } from '../store/authStore';
import { createSession } from '../services/sessionService';
import { useToast } from '../context/ToastContext';

export const CreateSession: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();

  const [facultyName, setFacultyName] = useState(user?.name || '');
  const [courseName, setCourseName] = useState('');
  const [sessionTitle, setSessionTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [date, setDate] = useState(() => {
    const today = new Date();
    const tzOffset = today.getTimezoneOffset() * 60000;
    return new Date(today.getTime() - tzOffset).toISOString().split('T')[0];
  });
  const [startTime, setStartTime] = useState(() => {
    const today = new Date();
    return today.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
  });
  const [duration, setDuration] = useState(5);
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facultyName || !courseName || !sessionTitle || !date || !startTime || !duration) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      await createSession({
        facultyName,
        courseName,
        sessionTitle,
        department,
        date,
        startTime,
        duration: Number(duration),
        description,
      });

      toast.success('Attendance session created successfully!');
      navigate('/attendance/sessions');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to create attendance session.');
      toast.error('Failed to create session.');
    } finally {
      setLoading(false);
    }
  };

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
            Create Attendance Session
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure a manual stateful attendance check-in session.
          </Typography>
        </Box>
      </Box>

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {errorMsg}
        </Alert>
      )}

      <Card>
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Faculty / Lecturer Name"
                  variant="outlined"
                  value={facultyName}
                  onChange={(e) => setFacultyName(e.target.value)}
                  placeholder="Your Name"
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Course / Subject Name"
                  variant="outlined"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="e.g. CS101 - Algorithms"
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Session Title"
                  variant="outlined"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="e.g. Lecture 4: Binary Search Trees"
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Department / Branch"
                  variant="outlined"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science (Optional)"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Duration (Minutes)"
                  type="number"
                  variant="outlined"
                  value={duration}
                  onChange={(e) => setDuration(Math.max(1, Number(e.target.value)))}
                  helperText="Session check-in window duration"
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Session Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Start Time"
                  type="time"
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description / Lecture Notes"
                  multiline
                  rows={3}
                  variant="outlined"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Lecture outlines or checks (Optional)"
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 4, opacity: 0.08 }} />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => navigate('/attendance/sessions')}
                disabled={loading}
                sx={{ borderRadius: 2 }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                sx={{ height: 40, px: 4, borderRadius: 2 }}
              >
                {loading ? 'Creating...' : 'Create Session'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CreateSession;
