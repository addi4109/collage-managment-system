import React, { useState, useEffect } from 'react';
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
  Switch,
  TextField,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SaveIcon from '@mui/icons-material/Save';
import { getStudentsForAttendance, markAttendance } from '../services/attendanceService';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../context/ToastContext';
import { LoadingOverlay } from '../components/LoadingOverlay';

export const MarkAttendance: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuthStore();
  
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const tzOffset = today.getTimezoneOffset() * 60000;
    return new Date(today.getTime() - tzOffset).toISOString().split('T')[0];
  });
  const [attendanceStates, setAttendanceStates] = useState<Record<string, 'Present' | 'Absent'>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not faculty or admin
    if (!user || (user.role !== 'faculty' && user.role !== 'admin')) {
      navigate('/unauthorized');
      return;
    }

    const fetchStudentsList = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const list = await getStudentsForAttendance();
        setStudents(list);
        
        // Default all student statuses to 'Present'
        const initialStates: Record<string, 'Present' | 'Absent'> = {};
        list.forEach((s: any) => {
          // If the profile user is nested, use that _id
          const sId = s.user?._id || s.user?.uid || s._id;
          initialStates[sId] = 'Present';
        });
        setAttendanceStates(initialStates);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || 'Failed to retrieve student roster.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentsList();
  }, [user, navigate]);

  const handleStatusToggle = (studentId: string) => {
    setAttendanceStates((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === 'Present' ? 'Absent' : 'Present',
    }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedDate) {
      toast.warning('Please select a date.');
      return;
    }

    setActionLoading(true);
    setErrorMsg(null);

    try {
      const records = Object.entries(attendanceStates).map(([studentId, status]) => ({
        studentId,
        status,
      }));

      await markAttendance(selectedDate, records);
      toast.success(`Attendance records for ${selectedDate} saved successfully.`);
      
      // Redirect back to dashboard after brief delay
      setTimeout(() => {
        if (user?.role === 'admin') navigate('/admin/dashboard');
        else navigate('/faculty/dashboard');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to record attendance entries.');
      toast.error('Failed to save attendance.');
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
      <LoadingOverlay open={actionLoading} message="Saving attendance data..." />
      
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800 }}>
            Mark Attendance
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Select a class date and record student attendance.
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            label="Attendance Date"
            type="date"
            variant="outlined"
            size="small"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 180 }}
          />
          <Button
            variant="contained"
            color="success"
            startIcon={<SaveIcon />}
            onClick={handleSaveAttendance}
            disabled={students.length === 0}
            sx={{
              height: 40,
              fontWeight: 600,
              backgroundColor: '#10b981',
              '&:hover': {
                backgroundColor: '#059669',
              },
            }}
          >
            Save Attendance
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CalendarTodayIcon color="success" />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Student Roll Roster ({students.length} Total)
            </Typography>
          </Box>
          <Divider sx={{ mb: 3, opacity: 0.08 }} />

          {students.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              No registered students found.
            </Typography>
          ) : (
            <TableContainer component={Box}>
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Roll Number</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Student Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Department</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Email Address</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', pr: 4 }}>Status (Absent / Present)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((student) => {
                    const studentId = student.user?._id || student.user?.uid || student._id;
                    const isPresent = attendanceStates[studentId] === 'Present';
                    return (
                      <TableRow key={studentId} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{student.rollNumber || 'N/A'}</TableCell>
                        <TableCell>{student.user?.name || 'N/A'}</TableCell>
                        <TableCell>{student.department || 'N/A'}</TableCell>
                        <TableCell color="text.secondary">{student.user?.email || 'N/A'}</TableCell>
                        <TableCell align="right" sx={{ pr: 4 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                            <Typography variant="body2" color={isPresent ? 'success.main' : 'error.main'} sx={{ fontWeight: 'bold', width: 60, textAlign: 'right' }}>
                              {attendanceStates[studentId]}
                            </Typography>
                            <Switch
                              checked={isPresent}
                              onChange={() => handleStatusToggle(studentId)}
                              color="success"
                            />
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
