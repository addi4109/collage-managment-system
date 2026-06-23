import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  IconButton,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import PublishIcon from '@mui/icons-material/Publish';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  createReport,
  updateReport,
  publishReport,
  getStudentsList,
  getAttendanceStats,
  getFacultyReports,
  StudentListItem,
  SubjectMarks,
} from '../services/reportService';
import { useToast } from '../context/ToastContext';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const GRADES = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'];

export const ReportForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  
  const isEditMode = !!id;
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Lists
  const [students, setStudents] = useState<StudentListItem[]>([]);
  
  // Form State
  const [studentId, setStudentId] = useState('');
  const [courseName, setCourseName] = useState('');
  const [month, setMonth] = useState('January');
  const [year, setYear] = useState(new Date().getFullYear());
  
  // Auto-calculated Attendance values
  const [totalClasses, setTotalClasses] = useState(0);
  const [attendedClasses, setAttendedClasses] = useState(0);
  const [attendancePercentage, setAttendancePercentage] = useState(0.0);
  const [fetchingAttendance, setFetchingAttendance] = useState(false);
  
  // Subject Marks List
  const [subjects, setSubjects] = useState<SubjectMarks[]>([
    { subjectName: '', internalMarks: 0, externalMarks: null, totalMarks: 0 },
  ]);
  
  // Evaluation Section
  const [remarks, setRemarks] = useState('');
  const [performanceGrade, setPerformanceGrade] = useState('A');
  const [behaviorComment, setBehaviorComment] = useState('');
  const [improvementSuggestions, setImprovementSuggestions] = useState('');

  // Load students and optionally edit target data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const studentList = await getStudentsList();
        setStudents(studentList);

        if (isEditMode && id) {
          // In edit mode, get the list of faculty reports and find our target
          const list = await getFacultyReports();
          const target = list.find((r) => r._id === id);
          if (target) {
            if (target.status === 'published') {
              toast.error('This report card is already published and locked.');
              navigate('/reports/manage');
              return;
            }
            setStudentId(target.studentId);
            setCourseName(target.courseName);
            setMonth(target.month);
            setYear(target.year);
            setTotalClasses(target.totalClasses);
            setAttendedClasses(target.attendedClasses);
            setAttendancePercentage(target.attendancePercentage);
            setSubjects(target.subjects.map(s => ({
              subjectName: s.subjectName,
              internalMarks: s.internalMarks,
              externalMarks: s.externalMarks,
              totalMarks: s.totalMarks
            })));
            setRemarks(target.remarks);
            setPerformanceGrade(target.performanceGrade);
            setBehaviorComment(target.behaviorComment || '');
            setImprovementSuggestions(target.improvementSuggestions || '');
          } else {
            toast.error('Report card not found.');
            navigate('/reports/manage');
          }
        }
      } catch (err: any) {
        console.error(err);
        toast.error('Failed to load form dependencies.');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [id, isEditMode]);

  // Trigger attendance auto-calculation on changes
  useEffect(() => {
    const fetchStats = async () => {
      if (!studentId || !month || !year) return;
      try {
        setFetchingAttendance(true);
        const stats = await getAttendanceStats(studentId, month, year);
        setTotalClasses(stats.totalClasses);
        setAttendedClasses(stats.attendedClasses);
        setAttendancePercentage(stats.attendancePercentage);
      } catch (err) {
        console.error('Error fetching attendance stats:', err);
      } finally {
        setFetchingAttendance(false);
      }
    };

    // Prevent fetching immediately in edit mode initial render
    if (studentId) {
      fetchStats();
    }
  }, [studentId, month, year]);

  const handleAddSubject = () => {
    setSubjects([
      ...subjects,
      { subjectName: '', internalMarks: 0, externalMarks: null, totalMarks: 0 },
    ]);
  };

  const handleRemoveSubject = (index: number) => {
    const list = [...subjects];
    list.splice(index, 1);
    setSubjects(list);
  };

  const handleSubjectChange = (
    index: number,
    field: keyof SubjectMarks,
    value: string | number | null
  ) => {
    const list = [...subjects];
    const item = { ...list[index] };

    if (field === 'subjectName') {
      item.subjectName = value as string;
    } else if (field === 'internalMarks') {
      item.internalMarks = Math.max(0, parseInt(value as string, 10) || 0);
      item.totalMarks = item.internalMarks + (item.externalMarks || 0);
    } else if (field === 'externalMarks') {
      item.externalMarks = value === '' || value === null ? null : Math.max(0, parseInt(value as string, 10) || 0);
      item.totalMarks = item.internalMarks + (item.externalMarks || 0);
    }

    list[index] = item;
    setSubjects(list);
  };

  const handleSubmit = async (status: 'draft' | 'published') => {
    if (!studentId) {
      toast.error('Please select a student.');
      return;
    }
    if (!courseName.trim()) {
      toast.error('Please enter course name.');
      return;
    }
    if (subjects.length === 0 || subjects.some((s) => !s.subjectName.trim())) {
      toast.error('Please enter a valid subject name for all subjects.');
      return;
    }
    if (!remarks.trim()) {
      toast.error('Remarks are required.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        studentId,
        courseName: courseName.trim(),
        month,
        year: parseInt(year as any, 10),
        totalClasses,
        attendedClasses,
        attendancePercentage,
        subjects,
        remarks: remarks.trim(),
        performanceGrade,
        behaviorComment: behaviorComment.trim(),
        improvementSuggestions: improvementSuggestions.trim(),
      };

      if (isEditMode && id) {
        // Edit update
        await updateReport(id, payload);
        if (status === 'published') {
          await publishReport(id);
          toast.success('Report updated and published successfully!');
        } else {
          toast.success('Report draft updated successfully.');
        }
      } else {
        // Create new
        const saved = await createReport(payload);
        if (status === 'published') {
          await publishReport(saved._id);
          toast.success('Report created and published successfully!');
        } else {
          toast.success('Report card draft created.');
        }
      }

      navigate('/reports/manage');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to submit report card.');
    } finally {
      setSubmitting(false);
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
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/reports/manage')}
        sx={{ mb: 3 }}
        color="inherit"
      >
        Back to Dashboard
      </Button>

      <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800, mb: 1 }}>
        {isEditMode ? 'Edit Report Card' : 'Create Report Card'}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Input grades, attendance, and evaluation feedback. Pushing to "Publish" finalizes the report.
      </Typography>

      <Grid container spacing={3}>
        {/* Core Settings Panel */}
        <Grid item xs={12} md={5}>
          <Card sx={{ bgcolor: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                1. Report Header Details
              </Typography>
              <Divider sx={{ opacity: 0.08 }} />

              <FormControl fullWidth disabled={isEditMode}>
                <InputLabel id="student-select-label">Select Student</InputLabel>
                <Select
                  labelId="student-select-label"
                  value={studentId}
                  label="Select Student"
                  onChange={(e) => setStudentId(e.target.value)}
                >
                  {students.map((s) => (
                    <MenuItem key={s._id} value={s._id}>
                      {s.name} ({s.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Course Name"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="E.g., Computer Science B.Tech"
                required
              />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel id="month-select-label">Month</InputLabel>
                    <Select
                      labelId="month-select-label"
                      value={month}
                      label="Month"
                      onChange={(e) => setMonth(e.target.value)}
                    >
                      {MONTHS.map((m) => (
                        <MenuItem key={m} value={m}>
                          {m}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Year"
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value, 10) || new Date().getFullYear())}
                  />
                </Grid>
              </Grid>

              {/* Read-Only Auto-Calculated Attendance Stats Section */}
              <Paper sx={{ p: 2.5, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    Auto-Calculated Attendance
                  </Typography>
                  {fetchingAttendance && <CircularProgress size={16} />}
                </Box>
                <Divider sx={{ opacity: 0.08, mb: 1.5 }} />
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">
                      Total Classes
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {totalClasses}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">
                      Attended
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {attendedClasses}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">
                      Percentage
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'primary.light' }}>
                      {attendancePercentage}%
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </CardContent>
          </Card>
        </Grid>

        {/* Academic Marks & Evaluation Panel */}
        <Grid item xs={12} md={7}>
          <Card sx={{ bgcolor: '#111827', border: '1px solid rgba(255,255,255,0.06)', mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  2. Subject Marks Section
                </Typography>
                <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={handleAddSubject}>
                  Add Subject
                </Button>
              </Box>
              <Divider sx={{ opacity: 0.08, mb: 2.5 }} />

              <TableContainer component={Box}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Subject Name</TableCell>
                      <TableCell align="center" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Internal</TableCell>
                      <TableCell align="center" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>External</TableCell>
                      <TableCell align="center" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Total</TableCell>
                      <TableCell align="right" sx={{ color: 'text.secondary', fontWeight: 'bold' }}></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {subjects.map((sub, idx) => (
                      <TableRow key={idx}>
                        <TableCell sx={{ border: 'none', py: 1 }}>
                          <TextField
                            size="small"
                            placeholder="Mathematics"
                            value={sub.subjectName}
                            onChange={(e) => handleSubjectChange(idx, 'subjectName', e.target.value)}
                            fullWidth
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ border: 'none', py: 1 }}>
                          <TextField
                            type="number"
                            size="small"
                            value={sub.internalMarks}
                            onChange={(e) => handleSubjectChange(idx, 'internalMarks', e.target.value)}
                            sx={{ width: 80 }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ border: 'none', py: 1 }}>
                          <TextField
                            type="number"
                            size="small"
                            placeholder="N/A"
                            value={sub.externalMarks === null ? '' : sub.externalMarks}
                            onChange={(e) => handleSubjectChange(idx, 'externalMarks', e.target.value)}
                            sx={{ width: 80 }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ border: 'none', py: 1, fontWeight: 'bold' }}>
                          {sub.totalMarks}
                        </TableCell>
                        <TableCell align="right" sx={{ border: 'none', py: 1 }}>
                          <IconButton color="error" size="small" onClick={() => handleRemoveSubject(idx)}>
                            <DeleteIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          <Card sx={{ bgcolor: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                3. Behavioral Evaluation
              </Typography>
              <Divider sx={{ opacity: 0.08 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth
                    label="Behavior Comment"
                    value={behaviorComment}
                    onChange={(e) => setBehaviorComment(e.target.value)}
                    placeholder="E.g., Very active participator, maintains discipline."
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel id="grade-select-label">Overall Grade</InputLabel>
                    <Select
                      labelId="grade-select-label"
                      value={performanceGrade}
                      label="Overall Grade"
                      onChange={(e) => setPerformanceGrade(e.target.value)}
                    >
                      {GRADES.map((g) => (
                        <MenuItem key={g} value={g}>
                          {g}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Evaluation Remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Write academic remarks and performance reviews..."
                required
              />

              <TextField
                fullWidth
                multiline
                rows={2}
                label="Improvement Suggestions"
                value={improvementSuggestions}
                onChange={(e) => setImprovementSuggestions(e.target.value)}
                placeholder="Give advice on area of study or classroom concentration..."
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Footer */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button onClick={() => navigate('/reports/manage')} color="inherit" disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="outlined"
          color="warning"
          startIcon={<SaveIcon />}
          onClick={() => handleSubmit('draft')}
          disabled={submitting}
        >
          Save Draft
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PublishIcon />}
          onClick={() => handleSubmit('published')}
          disabled={submitting}
        >
          Publish Report
        </Button>
      </Box>
    </Box>
  );
};

export default ReportForm;
