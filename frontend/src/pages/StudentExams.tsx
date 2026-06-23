import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  Paper,
} from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import InfoIcon from '@mui/icons-material/Info';
import AssessmentIcon from '@mui/icons-material/Assessment';

import { getAvailableExams } from '../services/examService';
import { useToast } from '../context/ToastContext';

export const StudentExams: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const data = await getAvailableExams();
      setExams(data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to retrieve exams list.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = (examId: string) => {
    navigate(`/exams/take/${examId}`);
  };

  const handleViewResult = (examId: string) => {
    navigate(`/exams/result/${examId}`);
  };

  const renderExamAction = (exam: any) => {
    if (exam.attemptStatus === 'blocked') {
      return (
        <Button fullWidth variant="contained" color="error" disabled sx={{ fontWeight: 'bold', borderRadius: 2 }}>
          BLOCKED (PROCTOR BREACH)
        </Button>
      );
    }

    if (exam.attemptStatus === 'submitted') {
      if (exam.resultsPublished) {
        return (
          <Button
            fullWidth
            variant="contained"
            color="success"
            startIcon={<AssessmentIcon />}
            onClick={() => handleViewResult(exam._id)}
            sx={{ fontWeight: 'bold', borderRadius: 2 }}
          >
            View Score & Feedback
          </Button>
        );
      }
      return (
        <Button fullWidth variant="outlined" color="success" disabled sx={{ fontWeight: 'bold', borderRadius: 2 }}>
          SUBMITTED (AWAITING GRADES)
        </Button>
      );
    }

    if (exam.status === 'active') {
      return (
        <Button
          fullWidth
          variant="contained"
          color="primary"
          startIcon={<PlayCircleOutlineIcon />}
          onClick={() => handleStartExam(exam._id)}
          sx={{ fontWeight: 'bold', borderRadius: 2 }}
        >
          {exam.attemptStatus === 'active' ? 'Resume Exam' : 'Start Exam Now'}
        </Button>
      );
    }

    if (exam.status === 'scheduled') {
      const scheduledDate = new Date(exam.scheduledAt);
      return (
        <Button fullWidth variant="outlined" color="primary" disabled sx={{ fontWeight: 'bold', borderRadius: 2 }}>
          Scheduled: {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Button>
      );
    }

    return (
      <Button fullWidth variant="outlined" disabled sx={{ fontWeight: 'bold', borderRadius: 2 }}>
        Exam Closed
      </Button>
    );
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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800 }}>
          Online Examinations
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View scheduled exam sessions, attempt active assessments, and view graded results.
        </Typography>
      </Box>

      {exams.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
          <InfoIcon color="action" sx={{ fontSize: 48, mb: 1.5 }} />
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
            No Exams Available
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            No scheduled or active examinations are currently registered in your department.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {exams.map((exam) => (
            <Grid item xs={12} sm={6} md={4} key={exam._id}>
              <Card sx={{ height: '100%', borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.light', textTransform: 'uppercase' }}>
                      {exam.courseName}
                    </Typography>
                    {exam.status === 'active' ? (
                      <Chip label="LIVE" color="error" size="small" sx={{ fontWeight: 'bold', animation: 'pulse 1.5s infinite' }} />
                    ) : (
                      <Chip label="SCHEDULED" color="info" variant="outlined" size="small" sx={{ fontWeight: 'bold' }} />
                    )}
                  </Box>

                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    {exam.title}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Duration: <b>{exam.duration} Minutes</b>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Marks: <b>{exam.totalMarks} Marks</b>
                    </Typography>
                    {exam.scheduledAt && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Date:{' '}
                        <b>
                          {new Date(exam.scheduledAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </b>
                      </Typography>
                    )}
                  </Box>

                  <Divider sx={{ my: 2, opacity: 0.05 }} />

                  <Box sx={{ mt: 'auto' }}>
                    {renderExamAction(exam)}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};
export default StudentExams;
