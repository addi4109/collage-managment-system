import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Divider,
  Paper,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import WarningIcon from '@mui/icons-material/Warning';
import TimerIcon from '@mui/icons-material/Timer';
import SchoolIcon from '@mui/icons-material/School';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { getStudentResult } from '../services/examService';
import { useToast } from '../context/ToastContext';

export const ExamResult: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ exam: any; attempt: any; questions: any[] } | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchResult();
  }, [id]);

  const fetchResult = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStudentResult(id!);
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to retrieve exam results.');
      toast.error(err.message || 'Failed to retrieve exam results.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 12 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error || !result) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
        <Alert severity="error" sx={{ borderRadius: 2, mb: 3 }}>
          {error || 'Results not available yet or exam not found.'}
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/exams/student')}
          sx={{ borderRadius: 2 }}
        >
          Back to Exam Hub
        </Button>
      </Box>
    );
  }

  const { exam, attempt, questions } = result;

  // Map student's answer lookup
  const studentAnswersMap = new Map<string, string>();
  if (attempt.answers && Array.isArray(attempt.answers)) {
    attempt.answers.forEach((ans: any) => {
      studentAnswersMap.set(ans.questionId, ans.selectedAnswer);
    });
  }

  const getDurationString = () => {
    if (!attempt.startTime || !attempt.endTime) return 'N/A';
    const start = new Date(attempt.startTime).getTime();
    const end = new Date(attempt.endTime).getTime();
    const elapsedSeconds = Math.floor((end - start) / 1000);
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    return `${mins}m ${secs}s`;
  };

  const scorePercentage = exam.totalMarks > 0 ? Math.round((attempt.score / exam.totalMarks) * 100) : 0;

  // Grade color helper
  const getScoreColor = () => {
    if (attempt.status === 'blocked') return 'error.main';
    if (scorePercentage >= 75) return 'success.main';
    if (scorePercentage >= 50) return 'warning.main';
    return 'error.main';
  };

  return (
    <Box sx={{ mt: 1, maxWidth: 1000, mx: 'auto', px: 2 }} className="animate-fade-in">
      {/* Title Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Exam Result Sheet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Course: {exam.courseName} | Exam: {exam.title}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/exams/student')}
          sx={{ borderRadius: 3, px: 3 }}
        >
          Exams List
        </Button>
      </Box>

      <Grid container spacing={4}>
        {/* Left Side: Summary Metrics */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              borderRadius: 4,
              background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              position: 'sticky',
              top: 24,
            }}
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <SchoolIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
              
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                OVERALL SCORE
              </Typography>

              {/* Big Score Box */}
              <Box
                sx={{
                  display: 'inline-flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 140,
                  height: 140,
                  borderRadius: '50%',
                  border: '4px solid',
                  borderColor: getScoreColor(),
                  my: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                }}
              >
                <Typography variant="h3" sx={{ fontWeight: 900, color: getScoreColor() }}>
                  {attempt.score}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  out of {exam.totalMarks}
                </Typography>
              </Box>

              <Typography variant="h6" sx={{ fontWeight: 700, mt: 1, color: getScoreColor() }}>
                {scorePercentage}%
              </Typography>

              <Divider sx={{ my: 3, opacity: 0.1 }} />

              {/* Stats details */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Status:</Typography>
                  <Chip
                    label={attempt.status === 'blocked' ? 'BLOCKED' : 'SUBMITTED'}
                    color={attempt.status === 'blocked' ? 'error' : 'success'}
                    size="small"
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <TimerIcon fontSize="small" /> Time Spent:
                    </Box>
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {getDurationString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <WarningIcon fontSize="small" /> Proctor Warnings:
                    </Box>
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      color: attempt.warnings > 0 ? 'error.main' : 'text.primary',
                    }}
                  >
                    {attempt.warnings} / 3
                  </Typography>
                </Box>
              </Box>

              {attempt.status === 'blocked' && (
                <Alert severity="error" sx={{ mt: 3, borderRadius: 2, textAlign: 'left' }}>
                  This attempt was auto-submitted and locked because the student reached the 3-strike proctor warning threshold.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Side: Detailed Question Review */}
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Question Breakdown
            </Typography>

            {questions.map((q, index) => {
              const studentAns = studentAnswersMap.get(q._id) || '';
              const isCorrect = studentAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
              const isNotAttempted = !studentAns;

              return (
                <Card
                  key={q._id}
                  sx={{
                    borderRadius: 3.5,
                    border: '1px solid',
                    borderColor: isNotAttempted
                      ? 'rgba(255, 255, 255, 0.05)'
                      : isCorrect
                      ? 'rgba(74, 222, 128, 0.2)'
                      : 'rgba(248, 113, 113, 0.2)',
                    backgroundColor: 'rgba(30, 41, 59, 0.2)',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Question {index + 1}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip
                          label={`${q.marks || 1} Marks`}
                          size="small"
                          variant="outlined"
                          sx={{ opacity: 0.8 }}
                        />
                        {isNotAttempted ? (
                          <Chip label="Unanswered" color="default" size="small" />
                        ) : isCorrect ? (
                          <Chip
                            icon={<CheckCircleIcon />}
                            label="Correct"
                            color="success"
                            size="small"
                          />
                        ) : (
                          <Chip
                            icon={<CancelIcon />}
                            label="Incorrect"
                            color="error"
                            size="small"
                          />
                        )}
                      </Box>
                    </Box>

                    <Typography variant="body1" sx={{ mb: 3, fontWeight: 500 }}>
                      {q.question}
                    </Typography>

                    {/* Options list */}
                    <Grid container spacing={1.5}>
                      {q.options.map((option: string, optIdx: number) => {
                        const isThisOptionCorrect = option.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
                        const isThisOptionSelected = option.trim().toLowerCase() === studentAns.trim().toLowerCase();

                        // Border/color helpers
                        let borderStyle = '1px solid rgba(255, 255, 255, 0.05)';
                        let bgColor = 'transparent';
                        let textColor = 'text.primary';

                        if (isThisOptionCorrect) {
                          borderStyle = '2px solid #2e7d32'; // green border
                          bgColor = 'rgba(46, 125, 50, 0.15)'; // light green bg
                          textColor = '#a5d6a7';
                        } else if (isThisOptionSelected && !isCorrect) {
                          borderStyle = '2px solid #d32f2f'; // red border
                          bgColor = 'rgba(211, 47, 47, 0.15)'; // light red bg
                          textColor = '#ef9a9a';
                        }

                        return (
                          <Grid item xs={12} key={optIdx}>
                            <Paper
                              elevation={0}
                              sx={{
                                p: 2,
                                border: borderStyle,
                                borderRadius: 2.5,
                                backgroundColor: bgColor,
                                color: textColor,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: '1px solid',
                                  borderColor: isThisOptionCorrect ? '#a5d6a7' : isThisOptionSelected ? '#ef9a9a' : 'rgba(255, 255, 255, 0.2)',
                                  fontWeight: 'bold',
                                  fontSize: '0.875rem',
                                }}
                              >
                                {String.fromCharCode(65 + optIdx)}
                              </Box>
                              <Typography variant="body2" sx={{ fontWeight: isThisOptionCorrect || isThisOptionSelected ? 600 : 400 }}>
                                {option}
                              </Typography>
                              
                              <Box sx={{ ml: 'auto' }}>
                                {isThisOptionCorrect && (
                                  <Typography variant="caption" sx={{ color: '#a5d6a7', fontWeight: 'bold' }}>
                                    Correct Key
                                  </Typography>
                                )}
                                {!isCorrect && isThisOptionSelected && (
                                  <Typography variant="caption" sx={{ color: '#ef9a9a', fontWeight: 'bold' }}>
                                    Your Answer
                                  </Typography>
                                )}
                              </Box>
                            </Paper>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ExamResult;
