import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  RadioGroup,
  FormControlLabel,
  Radio,
  LinearProgress,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  Chip,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CameraAltIcon from '@mui/icons-material/CameraAlt';

import { startExamAttempt, submitExamAttempt } from '../services/examService';
import { useWebcamMonitor } from '../hooks/useWebcamMonitor';
import { useToast } from '../context/ToastContext';

export const TakeExam: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [, setAttempt] = useState<any>(null);

  // Exam taking state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [examActive, setExamActive] = useState(false);

  // Fullscreen & Webcam setup states
  const [isFullscreenRequired, setIsFullscreenRequired] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [warnings, setWarnings] = useState(0);

  // Ref for video element
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Fetch / Init exam attempt on mount
  useEffect(() => {
    if (!id) return;
    initAttempt();
  }, [id]);

  const initAttempt = async () => {
    setLoading(true);
    try {
      const res = await startExamAttempt(id!);
      setExam(res.exam);
      setQuestions(res.questions);
      setAttempt(res.attempt);
      
      // Calculate remaining duration
      const durationSec = res.exam.duration * 60;
      const timeElapsedSec = Math.floor((Date.now() - new Date(res.attempt.startTime).getTime()) / 1000);
      const remaining = Math.max(0, durationSec - timeElapsedSec);
      setTimeLeft(remaining);

      // Prepopulate existing answers if resuming
      if (res.attempt.answers && res.attempt.answers.length > 0) {
        const mapped: Record<string, string> = {};
        res.attempt.answers.forEach((ans: any) => {
          mapped[ans.questionId] = ans.selectedAnswer;
        });
        setAnswers(mapped);
      }
      
      setWarnings(res.attempt.warnings);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to start exam.');
      navigate('/exams/student');
    } finally {
      setLoading(false);
    }
  };

  // Convert local answers record into answers payload array
  const getAnswersArray = () => {
    return Object.entries(answers).map(([questionId, selectedAnswer]) => ({
      questionId,
      selectedAnswer,
    }));
  };

  // Bind proctoring webcam hook
  const { stream, cameraActive, error: cameraError, triggerMockFaceNotDetected, triggerMockMultipleFaces } = useWebcamMonitor({
    examId: id!,
    active: examActive && !isBlocked,
    onBlock: () => {
      setIsBlocked(true);
      setExamActive(false);
      exitFullscreen();
    },
    onWarning: (warningsCount) => {
      setWarnings(warningsCount);
      toast.warning(`Warning issued! Total warnings: ${warningsCount}/3`);
    },
    getCurrentAnswers: getAnswersArray,
  });

  // Attach stream to video tag
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Handle Fullscreen enter
  const enterFullscreen = async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      }
      setIsFullscreenRequired(false);
      setExamActive(true);
    } catch (err) {
      console.error(err);
      toast.error('Failed to trigger fullscreen mode. This is required to start.');
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.warn(err));
    }
  };

  // Timer countdown
  useEffect(() => {
    if (!examActive || timeLeft <= 0 || isBlocked) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [examActive, timeLeft, isBlocked]);

  const handleSelectOption = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleAutoSubmit = async () => {
    setExamActive(false);
    exitFullscreen();
    toast.info('Time is up! Submitting exam attempt automatically...');
    await performSubmit();
  };

  const handleManualSubmit = async () => {
    if (window.confirm('Are you sure you want to finalize and submit your exam attempt?')) {
      setExamActive(false);
      exitFullscreen();
      await performSubmit();
    }
  };

  const performSubmit = async () => {
    setLoading(true);
    try {
      const answersArray = getAnswersArray();
      await submitExamAttempt(exam._id, answersArray);
      toast.success('Exam attempt submitted successfully!');
      navigate('/exams/student');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit answers.');
      setExamActive(true); // allow re-try submit on fail
    } finally {
      setLoading(false);
    }
  };

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  if (loading && !exam) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  // SCREEN 1: REQUIRE FULLSCREEN & WEBCAM PERMISSIONS STAGE
  if (isFullscreenRequired && !isBlocked) {
    return (
      <ContainerCard title="Exam Verification Protocol">
        <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
          This exam requires active proctoring protocols:
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CameraAltIcon color="primary" />
            <Typography variant="body2">Webcam must remain <b>active</b> and visible at all times.</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <WarningAmberIcon color="warning" />
            <Typography variant="body2">Tab switches, window exits, or exiting fullscreen issues a strike.</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <WarningAmberIcon color="error" />
            <Typography variant="body2"><b>3 strikes</b> results in automatic blocker and immediate submission.</Typography>
          </Box>
        </Box>
        <Button variant="contained" size="large" fullWidth onClick={enterFullscreen} sx={{ py: 1.5, fontWeight: 'bold' }}>
          Grant Video Protocol & Enter Fullscreen
        </Button>
      </ContainerCard>
    );
  }

  // SCREEN 2: BLOCKED due to Proctor Violations
  if (isBlocked) {
    return (
      <ContainerCard title="Attempt Terminated & Blocked">
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          Your attempt has been blocked due to multiple proctoring violations (3/3 warnings reached).
        </Alert>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Your answers submitted up to the violation threshold have been automatically logged and graded.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/exams/student')} fullWidth>
          Return to Exam List
        </Button>
      </ContainerCard>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  // SCREEN 3: EXAM TAKING VIEWPORT
  return (
    <Box sx={{ mt: 1 }} className="animate-fade-in">
      <Grid container spacing={3}>
        {/* MCQ Question Sheet */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 'bold' }}>
                  Question {currentIndex + 1} of {questions.length}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  Marks: {currentQuestion?.marks || 1}
                </Typography>
              </Box>
              
              <LinearProgress variant="determinate" value={progressPercent} sx={{ mb: 4, height: 6, borderRadius: 3 }} />

              {currentQuestion && (
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 4, lineHeight: 1.4 }}>
                    {currentQuestion.question}
                  </Typography>

                  <RadioGroup
                    value={answers[currentQuestion._id] || ''}
                    onChange={(e) => handleSelectOption(currentQuestion._id, e.target.value)}
                  >
                    <Grid container spacing={2}>
                      {currentQuestion.options.map((option: string, idx: number) => {
                        const isSelected = answers[currentQuestion._id] === option;
                        return (
                          <Grid item xs={12} key={idx}>
                            <Paper
                              elevation={0}
                              sx={{
                                p: 2,
                                border: '1px solid',
                                borderColor: isSelected ? 'primary.main' : 'rgba(255, 255, 255, 0.05)',
                                borderRadius: 3,
                                backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.05)' : 'background.default',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                '&:hover': {
                                  borderColor: 'primary.light',
                                  backgroundColor: 'rgba(255, 255, 255, 0.01)',
                                },
                              }}
                              onClick={() => handleSelectOption(currentQuestion._id, option)}
                            >
                              <FormControlLabel
                                value={option}
                                control={<Radio color="primary" />}
                                label={<Typography sx={{ fontWeight: 500 }}>{option}</Typography>}
                                sx={{ margin: 0, width: '100%' }}
                              />
                            </Paper>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </RadioGroup>
                </Box>
              )}

              <Divider sx={{ my: 4, opacity: 0.05 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="outlined"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex(currentIndex - 1)}
                  sx={{ borderRadius: 2 }}
                >
                  Previous
                </Button>
                {currentIndex < questions.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={() => setCurrentIndex(currentIndex + 1)}
                    sx={{ borderRadius: 2 }}
                  >
                    Next Question
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleManualSubmit}
                    sx={{ borderRadius: 2, fontWeight: 'bold' }}
                  >
                    Submit Exam
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Proctoring HUD and Timer Sidebar */}
        <Grid item xs={12} md={4}>
          <Grid container spacing={3}>
            {/* Timer card */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1 }}>
                    TIME REMAINING
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 900,
                      my: 1,
                      color: timeLeft <= 60 ? 'error.main' : 'primary.main',
                      animation: timeLeft <= 60 ? 'blink 1s infinite' : 'none',
                      '@keyframes blink': {
                        '0%': { opacity: 0.6 },
                        '50%': { opacity: 1 },
                        '100%': { opacity: 0.6 },
                      },
                    }}
                  >
                    {formatTime(timeLeft)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Proctor PiP Camera */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.05)', overflow: 'hidden' }}>
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      Proctoring Camera Feed
                    </Typography>
                    <Chip
                      label={cameraActive ? 'SECURE' : 'OFFLINE'}
                      size="small"
                      color={cameraActive ? 'success' : 'error'}
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      paddingTop: '75%', // 4:3 Aspect Ratio
                      bgcolor: '#000',
                      borderRadius: 2.5,
                      overflow: 'hidden',
                    }}
                  >
                    {cameraError ? (
                      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
                        <Typography variant="caption" color="error.light">
                          {cameraError}
                        </Typography>
                      </Box>
                    ) : (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transform: 'scaleX(-1)', // Mirror image
                        }}
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Proctor log warning strikes */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Proctor Violation Strikes
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, my: 1.5 }}>
                    {[1, 2, 3].map((val) => (
                      <Box
                        key={val}
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid',
                          borderColor: warnings >= val ? 'error.main' : 'rgba(255, 255, 255, 0.08)',
                          bgcolor: warnings >= val ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                          color: warnings >= val ? 'error.light' : 'text.disabled',
                          fontWeight: 'bold',
                        }}
                      >
                        {val}
                      </Box>
                    ))}
                  </Box>
                  <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mt: 2 }}>
                    Total warnings: {warnings} of 3. Stay inside fullscreen and do not switch windows.
                  </Typography>
                  
                  {/* Mock Proctor Violation Triggers (For Testing) */}
                  <Divider sx={{ my: 2, opacity: 0.05 }} />
                  <Typography variant="caption" color="primary" display="block" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Mock Proctor Triggers (Testing Hub)
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Button size="small" variant="outlined" fullWidth onClick={triggerMockFaceNotDetected}>
                        No Face
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button size="small" variant="outlined" fullWidth onClick={triggerMockMultipleFaces}>
                        Multi Face
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

// Layout Helper Wrapper
const ContainerCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  return (
    <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
      <Card sx={{ maxWidth: 460, width: '100%', borderRadius: 4, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>
            {title}
          </Typography>
          {children}
        </CardContent>
      </Card>
    </Box>
  );
};
export default TakeExam;
