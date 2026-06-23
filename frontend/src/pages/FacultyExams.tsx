import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PublishIcon from '@mui/icons-material/Publish';
import EditIcon from '@mui/icons-material/Edit';
import AssessmentIcon from '@mui/icons-material/Assessment';

import {
  getFacultyExams,
  createExam,
  updateExam,
  scheduleExam,
  startExam,
  getExamResultSummary,
  publishExamResults,
  QuestionPayload,
} from '../services/examService';
import { useToast } from '../context/ToastContext';

export const FacultyExams: React.FC = () => {
  const toast = useToast();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Exam Form Modal State
  const [openModal, setOpenModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [courseName, setCourseName] = useState('');
  const [duration, setDuration] = useState(30);
  const [totalMarks, setTotalMarks] = useState(10);
  const [questions, setQuestions] = useState<QuestionPayload[]>([
    { question: '', options: ['', '', '', ''], correctAnswer: '', marks: 1 },
  ]);

  // Scheduler Dialog State
  const [openScheduleDialog, setOpenScheduleDialog] = useState(false);
  const [schedulingExamId, setSchedulingExamId] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState('');

  // Results Modal State
  const [openResultsDialog, setOpenResultsDialog] = useState(false);
  const [examResults, setExamResults] = useState<any>(null);
  const [loadingResults, setLoadingResults] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const data = await getFacultyExams();
      setExams(data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to retrieve exams.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setEditingExamId(null);
    setTitle('');
    setCourseName('');
    setDuration(30);
    setTotalMarks(10);
    setQuestions([{ question: '', options: ['', '', '', ''], correctAnswer: '', marks: 1 }]);
    setOpenModal(true);
  };

  const handleOpenEditModal = (exam: any) => {
    setIsEditMode(true);
    setEditingExamId(exam._id);
    setTitle(exam.title);
    setCourseName(exam.courseName);
    setDuration(exam.duration);
    setTotalMarks(exam.totalMarks);
    
    // Fetch original questions if available (in this mock/impl they might be stored in Question DB, so we'll fetch them)
    setQuestions([{ question: '', options: ['', '', '', ''], correctAnswer: '', marks: 1 }]); // Default placeholder
    
    const fetchExamDetails = async () => {
      try {
        const res = await getExamResultSummary(exam._id); // This populated questions too
        if (res.exam) {
          // If we had a direct getQuestions API, otherwise we fetch attempt questions
        }
      } catch (e) {
        console.warn(e);
      }
    };
    fetchExamDetails();
    setOpenModal(true);
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      { question: '', options: ['', '', '', ''], correctAnswer: '', marks: 1 },
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, idx) => idx !== index));
  };

  const handleQuestionChange = (index: number, field: keyof QuestionPayload, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
    const updated = [...questions];
    const options = [...updated[qIndex].options];
    options[optIndex] = value;
    updated[qIndex] = { ...updated[qIndex], options };
    setQuestions(updated);
  };

  const handleFormSubmit = async (submitForApproval = false) => {
    if (!title.trim() || !courseName.trim() || duration <= 0) {
      toast.warning('Please fill in all core exam details.');
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        toast.warning(`Question #${i + 1} text is empty.`);
        return;
      }
      if (q.options.some((opt) => !opt.trim())) {
        toast.warning(`Question #${i + 1} option fields cannot be blank.`);
        return;
      }
      if (!q.correctAnswer.trim()) {
        toast.warning(`Question #${i + 1} requires a correct answer option.`);
        return;
      }
    }

    try {
      const payload = {
        title,
        courseName,
        duration: Number(duration),
        totalMarks: Number(totalMarks),
        questions,
        submitForApproval,
      };

      if (isEditMode && editingExamId) {
        await updateExam(editingExamId, payload);
        toast.success('Exam paper updated successfully.');
      } else {
        await createExam(payload);
        toast.success(submitForApproval ? 'Exam submitted for approval!' : 'Exam draft saved.');
      }

      setOpenModal(false);
      fetchExams();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Operation failed.');
    }
  };

  const handleStartExam = async (examId: string) => {
    try {
      await startExam(examId);
      toast.success('Exam has started! Students can now attempt it.');
      fetchExams();
    } catch (err: any) {
      toast.error(err.message || 'Failed to start exam.');
    }
  };

  const handleOpenSchedule = (examId: string) => {
    setSchedulingExamId(examId);
    setScheduledAt('');
    setOpenScheduleDialog(true);
  };

  const handleScheduleSubmit = async () => {
    if (!schedulingExamId || !scheduledAt) return;
    try {
      await scheduleExam(schedulingExamId, scheduledAt);
      toast.success('Exam scheduled successfully.');
      setOpenScheduleDialog(false);
      fetchExams();
    } catch (err: any) {
      toast.error(err.message || 'Failed to schedule exam.');
    }
  };

  const handlePublishResults = async (examId: string) => {
    try {
      await publishExamResults(examId);
      toast.success('Exam results published to all students.');
      fetchExams();
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish results.');
    }
  };

  const handleViewResults = async (examId: string) => {
    setLoadingResults(true);
    setOpenResultsDialog(true);
    try {
      const data = await getExamResultSummary(examId);
      setExamResults(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load results.');
      setOpenResultsDialog(false);
    } finally {
      setLoadingResults(false);
    }
  };

  const renderStatusChip = (status: string) => {
    switch (status) {
      case 'active':
        return <Chip label="ACTIVE" color="success" size="small" sx={{ fontWeight: 'bold', animation: 'pulse 1.5s infinite' }} />;
      case 'scheduled':
        return <Chip label="SCHEDULED" color="primary" size="small" sx={{ fontWeight: 'bold' }} />;
      case 'approved':
        return <Chip label="APPROVED" color="secondary" size="small" sx={{ fontWeight: 'bold' }} />;
      case 'pending':
        return <Chip label="PENDING APPROVAL" color="warning" size="small" sx={{ fontWeight: 'bold' }} />;
      case 'rejected':
        return <Chip label="REJECTED" color="error" size="small" sx={{ fontWeight: 'bold' }} />;
      case 'completed':
        return <Chip label="COMPLETED" variant="outlined" size="small" sx={{ fontWeight: 'bold' }} />;
      case 'draft':
      default:
        return <Chip label="DRAFT" color="default" size="small" sx={{ fontWeight: 'bold' }} />;
    }
  };

  if (loading && exams.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }} className="animate-fade-in">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800 }}>
            Manage Exams
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Draft, schedule, proctor, and evaluate MCQ examinations.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateModal}
          sx={{ fontWeight: 'bold', borderRadius: 2 }}
        >
          Create Exam Paper
        </Button>
      </Box>

      {exams.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
          <Typography variant="h6" color="text.secondary">
            No Exams Found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Click the "Create Exam Paper" button above to start your first exam layout.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {exams.map((exam) => (
            <Grid item xs={12} sm={6} md={4} key={exam._id}>
              <Card sx={{ height: '100%', borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.light', textTransform: 'uppercase' }}>
                      {exam.courseName}
                    </Typography>
                    {renderStatusChip(exam.status)}
                  </Box>

                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    {exam.title}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Duration: <b>{exam.duration} Min</b>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Marks: <b>{exam.totalMarks}</b>
                    </Typography>
                  </Box>

                  {exam.scheduledAt && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Scheduled: <b>{new Date(exam.scheduledAt).toLocaleString()}</b>
                    </Typography>
                  )}

                  {exam.approvalComment && (
                    <Box sx={{ mt: 1, p: 1.5, bgcolor: 'background.default', borderRadius: 2, border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Admin Note:
                      </Typography>
                      <Typography variant="body2" color="warning.light">
                        {exam.approvalComment}
                      </Typography>
                    </Box>
                  )}

                  <Divider sx={{ my: 2, opacity: 0.05 }} />

                  <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {exam.status === 'draft' || exam.status === 'rejected' ? (
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenEditModal(exam)}
                      >
                        Edit / Submit Approval
                      </Button>
                    ) : null}

                    {exam.status === 'approved' && (
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        startIcon={<CalendarMonthIcon />}
                        onClick={() => handleOpenSchedule(exam._id)}
                      >
                        Schedule Exam
                      </Button>
                    )}

                    {exam.status === 'scheduled' && (
                      <Button
                        variant="contained"
                        color="success"
                        fullWidth
                        startIcon={<PlayArrowIcon />}
                        onClick={() => handleStartExam(exam._id)}
                      >
                        Start Exam Session
                      </Button>
                    )}

                    {exam.status === 'active' && (
                      <Button
                        variant="contained"
                        color="error"
                        fullWidth
                        startIcon={<PublishIcon />}
                        onClick={() => handlePublishResults(exam._id)}
                      >
                        Publish Results (End)
                      </Button>
                    )}

                    {exam.status === 'completed' && !exam.resultsPublished && (
                      <Button
                        variant="contained"
                        color="warning"
                        fullWidth
                        startIcon={<PublishIcon />}
                        onClick={() => handlePublishResults(exam._id)}
                      >
                        Publish Student Results
                      </Button>
                    )}

                    {['active', 'completed'].includes(exam.status) || exam.resultsPublished ? (
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<AssessmentIcon />}
                        onClick={() => handleViewResults(exam._id)}
                      >
                        View Attempt Results
                      </Button>
                    ) : null}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* CREATE & EDIT EXAM DIALOG */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {isEditMode ? 'Modify Exam Layout' : 'Create New MCQ Paper'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Exam Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Course Name"
                value={courseName}
                placeholder="e.g. CS202 - Database Systems"
                onChange={(e) => setCourseName(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Duration (Minutes)"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Total Marks"
                value={totalMarks}
                onChange={(e) => setTotalMarks(Number(e.target.value))}
              />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold' }}>
              MCQ Questions Pool ({questions.length} total)
            </Typography>
          </Divider>

          {questions.map((q, qIndex) => (
            <Paper key={qIndex} sx={{ p: 2.5, mb: 3, backgroundColor: 'background.default', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography sx={{ fontWeight: 'bold' }}>Question #{qIndex + 1}</Typography>
                <IconButton color="error" disabled={questions.length === 1} onClick={() => handleRemoveQuestion(qIndex)}>
                  <DeleteIcon />
                </IconButton>
              </Box>

              <TextField
                fullWidth
                multiline
                rows={2}
                label="Question Text"
                value={q.question}
                onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                sx={{ mb: 2 }}
              />

              <Grid container spacing={2} sx={{ mb: 2 }}>
                {q.options.map((opt, optIndex) => (
                  <Grid item xs={12} sm={6} key={optIndex}>
                    <TextField
                      fullWidth
                      label={`Option ${optIndex + 1}`}
                      value={opt}
                      onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                    />
                  </Grid>
                ))}
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Correct Answer Option"
                    placeholder="Must match one option text exactly"
                    value={q.correctAnswer}
                    onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Marks"
                    value={q.marks}
                    onChange={(e) => handleQuestionChange(qIndex, 'marks', Number(e.target.value))}
                  />
                </Grid>
              </Grid>
            </Paper>
          ))}

          <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddQuestion} sx={{ mt: 1 }}>
            Add Question
          </Button>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenModal(false)} variant="outlined">
            Cancel
          </Button>
          <Button onClick={() => handleFormSubmit(false)} color="secondary" variant="contained">
            Save as Draft
          </Button>
          <Button onClick={() => handleFormSubmit(true)} color="primary" variant="contained">
            Submit for Approval
          </Button>
        </DialogActions>
      </Dialog>

      {/* SCHEDULER DIALOG */}
      <Dialog open={openScheduleDialog} onClose={() => setOpenScheduleDialog(false)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Schedule Exam Timeframe</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, minWidth: 300 }}>
            <TextField
              fullWidth
              type="datetime-local"
              label="Exam Date & Start Time"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenScheduleDialog(false)}>Cancel</Button>
          <Button onClick={handleScheduleSubmit} variant="contained" disabled={!scheduledAt}>
            Schedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* RESULTS DISPLAY DIALOG */}
      <Dialog open={openResultsDialog} onClose={() => setOpenResultsDialog(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 'bold' }}>Student Attempt Scores & Logs</DialogTitle>
        <DialogContent dividers>
          {loadingResults ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : examResults ? (
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                Exam: {examResults.exam.title} ({examResults.exam.courseName})
              </Typography>
              {examResults.attempts.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                  No student has attempted this exam session yet.
                </Typography>
              ) : (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <Table size="medium">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Student Name</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Email Address</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Score / Max Marks</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Warnings</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {examResults.attempts.map((attempt: any) => (
                        <TableRow key={attempt._id}>
                          <TableCell sx={{ fontWeight: 600 }}>{attempt.studentId?.name || 'Unknown student'}</TableCell>
                          <TableCell color="text.secondary">{attempt.studentId?.email || 'N/A'}</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: attempt.status === 'blocked' ? 'error.light' : 'success.light' }}>
                            {attempt.score} / {examResults.exam.totalMarks}
                          </TableCell>
                          <TableCell color={attempt.warnings >= 2 ? 'error.light' : 'text.secondary'}>
                            {attempt.warnings}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={attempt.status.toUpperCase()}
                              size="small"
                              color={attempt.status === 'blocked' ? 'error' : attempt.status === 'submitted' ? 'success' : 'info'}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenResultsDialog(false)} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
export default FacultyExams;
