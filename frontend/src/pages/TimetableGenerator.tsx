import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Paper,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

import {
  getAllCourses,
  getAllUsers,
  getAllTimetableEntries,
  saveTimetableEntry,
  deleteTimetableEntry,
} from '../firebase/dbService';
import { Course, UserProfile } from '../types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export const TimetableGenerator: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Form States
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedDay, setSelectedDay] = useState<typeof DAYS[number]>('Monday');
  const [room, setRoom] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [coursesList, usersList, allSlots] = await Promise.all([
        getAllCourses(),
        getAllUsers(),
        getAllTimetableEntries(),
      ]);
      setCourses(coursesList);
      setUsers(usersList);

      // Join course details
      const courseMap = new Map(coursesList.map((c) => [c.id, c]));
      const userMap = new Map(usersList.map((u) => [u.uid, u]));

      const joinedSlots = allSlots.map((slot: any) => {
        const c = courseMap.get(slot.courseId);
        const f = userMap.get(slot.facultyId);
        return {
          ...slot,
          courseCode: c?.code || 'UNK',
          courseName: c?.name || 'Unknown Course',
          facultyName: f?.name || 'Unknown Instructor',
        };
      });

      // Sort by day and start time
      const dayOrder = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
      joinedSlots.sort((a: any, b: any) => {
        const dayDiff = (dayOrder[a.day as keyof typeof dayOrder] || 0) - (dayOrder[b.day as keyof typeof dayOrder] || 0);
        if (dayDiff !== 0) return dayDiff;
        return a.startTime.localeCompare(b.startTime);
      });

      setTimetable(joinedSlots);
      if (coursesList.length > 0) {
        setSelectedCourseId(coursesList[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !selectedDay || !room || !startTime || !endTime) {
      setErrorMsg('Please complete all timetable fields.');
      return;
    }
    if (startTime >= endTime) {
      setErrorMsg('Start time must be before end time.');
      return;
    }

    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Resolve FacultyId from selected course
    const selectedCourse = courses.find((c) => c.id === selectedCourseId);
    if (!selectedCourse) {
      setErrorMsg('Selected course is invalid.');
      setActionLoading(false);
      return;
    }

    try {
      await saveTimetableEntry({
        courseId: selectedCourseId,
        day: selectedDay,
        startTime,
        endTime,
        room,
        facultyId: selectedCourse.facultyId,
      });

      setSuccessMsg(`Lecture scheduled successfully for Room ${room}.`);
      setRoom('');
      loadData();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Timetable scheduling conflict occurred.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSlot = async (id: string, code: string) => {
    if (!window.confirm(`Are you sure you want to delete the scheduled lecture slot for ${code}?`)) return;
    setActionLoading(true);
    try {
      await deleteTimetableEntry(id);
      setSuccessMsg('Scheduled slot deleted.');
      loadData();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to delete slot.');
    } finally {
      setActionLoading(false);
    }
  };

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const assignedFaculty = selectedCourse
    ? users.find((u) => u.uid === selectedCourse.facultyId)
    : null;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }} className="animate-fade-in">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800 }}>
          Timetable Generator
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Schedule course lectures, assign classrooms, and verify timetable conflict checks.
        </Typography>
      </Box>

      {successMsg && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Side: Scheduling Form */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AddCircleOutlineIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Schedule Lecture Slot
                </Typography>
              </Box>
              <Divider sx={{ mb: 3, opacity: 0.08 }} />

              {courses.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  Assign courses in database CRUD before scheduling times.
                </Alert>
              ) : (
                <form onSubmit={handleSaveSlot}>
                  <FormControl fullWidth sx={{ mb: 2.5 }}>
                    <InputLabel id="courses-select-label">Course</InputLabel>
                    <Select
                      labelId="courses-select-label"
                      value={selectedCourseId}
                      label="Course"
                      onChange={(e) => setSelectedCourseId(e.target.value)}
                    >
                      {courses.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {assignedFaculty && (
                    <Paper className="glass-panel" sx={{ p: 1.5, mb: 2.5, display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="caption" color="text.secondary">
                        Assigned Faculty
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {assignedFaculty.name}
                      </Typography>
                    </Paper>
                  )}

                  <FormControl fullWidth sx={{ mb: 2.5 }}>
                    <InputLabel id="days-select-label">Day of Week</InputLabel>
                    <Select
                      labelId="days-select-label"
                      value={selectedDay}
                      label="Day of Week"
                      onChange={(e) => setSelectedDay(e.target.value as typeof DAYS[number])}
                    >
                      {DAYS.map((d) => (
                        <MenuItem key={d} value={d}>
                          {d}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    label="Classroom / Laboratory"
                    placeholder="e.g. Lab 401, Room 102"
                    variant="outlined"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    sx={{ mb: 2.5 }}
                    required
                  />

                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Start Time"
                        type="time"
                        InputLabelProps={{ shrink: true }}
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="End Time"
                        type="time"
                        InputLabelProps={{ shrink: true }}
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        required
                      />
                    </Grid>
                  </Grid>

                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={actionLoading}
                    startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : <AddCircleOutlineIcon />}
                    sx={{ height: 48 }}
                  >
                    {actionLoading ? 'Scheduling Lecture...' : 'Schedule Lecture'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Side: Timetable Grid / List */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CalendarMonthIcon color="secondary" />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Scheduled Course Timetable
                </Typography>
              </Box>
              <Divider sx={{ mb: 2, opacity: 0.08 }} />

              {timetable.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
                  No classes scheduled in the timetable grid.
                </Typography>
              ) : (
                <TableContainer component={Box} sx={{ maxHeight: 500 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', bgcolor: '#111827' }}>Day</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', bgcolor: '#111827' }}>Course</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', bgcolor: '#111827' }}>Time Slot</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', bgcolor: '#111827' }}>Room</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', bgcolor: '#111827' }}>Instructor</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: '#111827' }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {timetable.map((slot) => (
                        <TableRow key={slot.id} hover>
                          <TableCell sx={{ fontWeight: 'bold', color: 'primary.light' }}>{slot.day}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {slot.courseCode}
                            <Typography variant="caption" display="block" color="text.secondary">
                              {slot.courseName}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 500 }}>{slot.startTime} - {slot.endTime}</TableCell>
                          <TableCell>{slot.room}</TableCell>
                          <TableCell>{slot.facultyName}</TableCell>
                          <TableCell align="right">
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleDeleteSlot(slot.id, slot.courseCode)}
                              disabled={actionLoading}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
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
    </Box>
  );
};
export default TimetableGenerator;
