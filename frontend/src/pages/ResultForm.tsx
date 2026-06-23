import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';

import {
  getStudentsDropdown,
  createResult,
  updateResult,
  getResultById,
  submitResult,
  StudentDropdownItem,
  SubjectMarks,
} from '../services/resultService';
import { useToast } from '../context/ToastContext';

export const ResultForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const isEditMode = !!id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState<StudentDropdownItem[]>([]);
  
  // Form states
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [courseName, setCourseName] = useState('');
  const [semester, setSemester] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  
  // Extra fields
  const [attendancePercentage, setAttendancePercentage] = useState<number | ''>('');
  const [internalMarksTotal, setInternalMarksTotal] = useState<number | ''>('');
  const [practicalMarksTotal, setPracticalMarksTotal] = useState<number | ''>('');
  const [theoryMarksTotal, setTheoryMarksTotal] = useState<number | ''>('');

  const [subjects, setSubjects] = useState<SubjectMarks[]>([
    { subjectCode: '', subjectName: '', maxMarks: 100, obtainedMarks: 0 }
  ]);

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Load student list for dropdown
      const studentList = await getStudentsDropdown();
      setStudents(studentList);

      if (isEditMode) {
        const resultData = await getResultById(id!);
        setStudentId(resultData.studentId);
        setStudentName(resultData.studentName);
        setRollNumber(resultData.rollNumber || '');
        setCourseName(resultData.courseName || '');
        setSemester(resultData.semester || '');
        setAcademicYear(resultData.academicYear || '');
        
        setAttendancePercentage(resultData.attendancePercentage ?? '');
        setInternalMarksTotal(resultData.internalMarksTotal ?? '');
        setPracticalMarksTotal(resultData.practicalMarksTotal ?? '');
        setTheoryMarksTotal(resultData.theoryMarksTotal ?? '');

        setSubjects(resultData.subjects.map(s => ({
          subjectCode: s.subjectCode,
          subjectName: s.subjectName,
          maxMarks: s.maxMarks,
          obtainedMarks: s.obtainedMarks,
          approvalStatus: s.approvalStatus,
          adminRemark: s.adminRemark,
        })));
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load form dependencies.');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelect = (selectedId: string) => {
    setStudentId(selectedId);
    const student = students.find((s) => s.studentId === selectedId);
    if (student) {
      setStudentName(student.studentName);
      setRollNumber(student.rollNumber);
      setCourseName(student.department);
    }
  };

  const handleAddSubject = () => {
    setSubjects([...subjects, { subjectCode: '', subjectName: '', maxMarks: 100, obtainedMarks: 0 }]);
  };

  const handleRemoveSubject = (idx: number) => {
    if (subjects.length <= 1) return;
    setSubjects(subjects.filter((_, i) => i !== idx));
  };

  const handleSubjectChange = (idx: number, field: keyof SubjectMarks, value: any) => {
    const updated = [...subjects];
    updated[idx] = { ...updated[idx], [field]: value };
    setSubjects(updated);
  };

  // Local real-time calculation summaries
  const calculateSummaries = () => {
    let maxTotal = 0;
    let obtainedTotal = 0;
    let allPassed = true;

    subjects.forEach((sub) => {
      const max = Number(sub.maxMarks) || 0;
      const obtained = Number(sub.obtainedMarks) || 0;
      maxTotal += max;
      obtainedTotal += obtained;

      const pct = max > 0 ? (obtained / max) * 100 : 0;
      if (pct < 40) {
        allPassed = false;
      }
    });

    const percent = maxTotal > 0 ? (obtainedTotal / maxTotal) * 100 : 0;
    const cgpa = Number((percent / 10).toFixed(2));

    let overallGrade = 'F';
    if (percent >= 90) overallGrade = 'O';
    else if (percent >= 80) overallGrade = 'A';
    else if (percent >= 70) overallGrade = 'B';
    else if (percent >= 60) overallGrade = 'C';
    else if (percent >= 50) overallGrade = 'D';
    else if (percent >= 40) overallGrade = 'E';

    return {
      total: maxTotal,
      obtained: obtainedTotal,
      percentage: percent.toFixed(2),
      cgpa,
      grade: overallGrade,
      result: allPassed ? 'Pass' : 'Fail',
    };
  };

  const handleSave = async (submitForApproval = false) => {
    if (!studentId || !semester.trim() || !academicYear.trim() || !courseName.trim()) {
      toast.warning('Please fill in all general student details.');
      return;
    }

    // Validate subjects
    for (let i = 0; i < subjects.length; i++) {
      const sub = subjects[i];
      if (!sub.subjectCode.trim() || !sub.subjectName.trim()) {
        toast.warning(`Subject Code and Name cannot be blank in Row #${i + 1}.`);
        return;
      }
      if (Number(sub.maxMarks) <= 0 || Number(sub.obtainedMarks) < 0) {
        toast.warning(`Marks cannot be negative in Row #${i + 1}.`);
        return;
      }
      if (Number(sub.obtainedMarks) > Number(sub.maxMarks)) {
        toast.warning(`Obtained marks cannot exceed Max Marks in Row #${i + 1}.`);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        studentId,
        studentName,
        rollNumber,
        courseName,
        semester,
        academicYear,
        subjects,
        attendancePercentage: attendancePercentage !== '' ? Number(attendancePercentage) : undefined,
        internalMarksTotal: internalMarksTotal !== '' ? Number(internalMarksTotal) : undefined,
        practicalMarksTotal: practicalMarksTotal !== '' ? Number(practicalMarksTotal) : undefined,
        theoryMarksTotal: theoryMarksTotal !== '' ? Number(theoryMarksTotal) : undefined,
      };

      let resultId = id;

      if (isEditMode) {
        await updateResult(id!, payload);
        toast.success('Result sheet draft updated.');
      } else {
        const res = await createResult(payload);
        resultId = res.result._id;
        toast.success('Result sheet draft saved.');
      }

      if (submitForApproval && resultId) {
        // Automatically submit after save
        await updateResult(resultId, payload); // ensure saved
        // Trigger submit
        await submitResult(resultId);
        toast.success('Result sheet submitted for approval!');
      }

      navigate('/results/faculty');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to save results.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const summaries = calculateSummaries();

  return (
    <Box sx={{ mt: 1, px: 2 }} className="animate-fade-in">
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800 }}>
            {isEditMode ? 'Edit Examination Marks' : 'Prepare Student Results'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Enter marks, subject records, and verify evaluation metrics.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/results/faculty')}
          sx={{ borderRadius: 2 }}
        >
          Cancel & Exit
        </Button>
      </Box>

      <Grid container spacing={4}>
        {/* Left Side: Parameters Entry */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3.5, border: '1px solid rgba(255, 255, 255, 0.05)', mb: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                1. General Information
              </Typography>
              <Grid container spacing={2.5}>
                {/* Student Selector */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth disabled={isEditMode}>
                    <InputLabel id="student-select-label">Select Student</InputLabel>
                    <Select
                      labelId="student-select-label"
                      label="Select Student"
                      value={studentId}
                      onChange={(e) => handleStudentSelect(e.target.value)}
                    >
                      {students.map((s) => (
                        <MenuItem key={s.studentId} value={s.studentId}>
                          {s.studentName} ({s.rollNumber})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Roll Number */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Roll Number"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    disabled
                  />
                </Grid>

                {/* Course Name */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Course / Department"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                  />
                </Grid>

                {/* Semester */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="semester-select-label">Semester</InputLabel>
                    <Select
                      labelId="semester-select-label"
                      label="Semester"
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                    >
                      {['1st Semester', '2nd Semester', '3rd Semester', '4th Semester', '5th Semester', '6th Semester', '7th Semester', '8th Semester'].map((sem) => (
                        <MenuItem key={sem} value={sem}>
                          {sem}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Academic Year */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Academic Year"
                    placeholder="e.g. 2025-2026"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 4, opacity: 0.05 }} />

              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                2. Extra Academic Parameters
              </Typography>
              <Grid container spacing={2.5}>
                {/* Attendance */}
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Attendance %"
                    placeholder="e.g. 85.5"
                    value={attendancePercentage}
                    onChange={(e) => setAttendancePercentage(e.target.value !== '' ? Number(e.target.value) : '')}
                  />
                </Grid>

                {/* Internals */}
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Internals Total"
                    value={internalMarksTotal}
                    onChange={(e) => setInternalMarksTotal(e.target.value !== '' ? Number(e.target.value) : '')}
                  />
                </Grid>

                {/* Practicals */}
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Practicals Total"
                    value={practicalMarksTotal}
                    onChange={(e) => setPracticalMarksTotal(e.target.value !== '' ? Number(e.target.value) : '')}
                  />
                </Grid>

                {/* Theory */}
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Theory Total"
                    value={theoryMarksTotal}
                    onChange={(e) => setTheoryMarksTotal(e.target.value !== '' ? Number(e.target.value) : '')}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Marks Entry Sheet */}
          <Card sx={{ borderRadius: 3.5, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  3. Subject Marks Entry Sheet
                </Typography>
                <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddSubject}>
                  Add Subject
                </Button>
              </Box>

              <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 2 }}>
                <Table>
                  <TableHead sx={{ bgcolor: 'rgba(255, 255, 255, 0.02)' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Subject Code</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Subject Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Max Marks</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Obtained Marks</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {subjects.map((sub, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <TextField
                            size="small"
                            placeholder="e.g. CS202"
                            value={sub.subjectCode}
                            onChange={(e) => handleSubjectChange(idx, 'subjectCode', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            placeholder="e.g. Database Systems"
                            value={sub.subjectName}
                            onChange={(e) => handleSubjectChange(idx, 'subjectName', e.target.value)}
                          />
                        </TableCell>
                        <TableCell width={110}>
                          <TextField
                            type="number"
                            size="small"
                            value={sub.maxMarks}
                            onChange={(e) => handleSubjectChange(idx, 'maxMarks', Number(e.target.value))}
                          />
                        </TableCell>
                        <TableCell width={110}>
                          <TextField
                            type="number"
                            size="small"
                            value={sub.obtainedMarks}
                            onChange={(e) => handleSubjectChange(idx, 'obtainedMarks', Number(e.target.value))}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            color="error"
                            disabled={subjects.length === 1}
                            onClick={() => handleRemoveSubject(idx)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Side: Local Preview & Actions */}
        <Grid item xs={12} md={4}>
          <Box sx={{ position: 'sticky', top: 24 }}>
            {/* Calculation Card */}
            <Card sx={{ borderRadius: 3.5, border: '1px solid rgba(255, 255, 255, 0.05)', mb: 3, bgcolor: 'rgba(30, 41, 59, 0.2)' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold', mb: 2 }}>
                  MARKS SHEET PREVIEW (REAL-TIME)
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Total Max Marks:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{summaries.total}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Obtained Marks:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{summaries.obtained}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Percentage:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{summaries.percentage}%</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">CGPA Equivalent:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{summaries.cgpa}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Overall Grade:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: summaries.grade === 'F' ? 'error.main' : 'success.main' }}>
                      {summaries.grade}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Result Status:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: summaries.result === 'Fail' ? 'error.main' : 'success.main' }}>
                      {summaries.result}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Submission Cards */}
            <Card sx={{ borderRadius: 3.5, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  startIcon={<SaveIcon />}
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  sx={{ py: 1.5, borderRadius: 2.5 }}
                >
                  Save as Draft
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  color="secondary"
                  startIcon={saving ? <CircularProgress size={20} /> : <SendIcon />}
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  sx={{ py: 1.5, borderRadius: 2.5, fontWeight: 'bold' }}
                >
                  Submit For Admin Approval
                </Button>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ResultForm;
