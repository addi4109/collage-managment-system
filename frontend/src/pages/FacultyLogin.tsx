import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  InputAdornment,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EngineeringIcon from '@mui/icons-material/Engineering';
import ComputerIcon from '@mui/icons-material/Computer';
import MemoryIcon from '@mui/icons-material/Memory';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ScienceIcon from '@mui/icons-material/Science';
import ElectricalServicesIcon from '@mui/icons-material/ElectricalServices';
import RefreshIcon from '@mui/icons-material/Refresh';

import { loginWithEmail } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LoadingOverlay } from '../components/LoadingOverlay';

const DEPARTMENTS = [
  { name: 'Computer Engineering',    color: '#6366f1', icon: <ComputerIcon sx={{ fontSize: 40 }} /> },
  { name: 'Information Technology',  color: '#06b6d4', icon: <MemoryIcon sx={{ fontSize: 40 }} /> },
  { name: 'Mechanical Engineering',  color: '#f59e0b', icon: <PrecisionManufacturingIcon sx={{ fontSize: 40 }} /> },
  { name: 'Civil Engineering',       color: '#10b981', icon: <AccountTreeIcon sx={{ fontSize: 40 }} /> },
  { name: 'Chemical Engineering',    color: '#8b5cf6', icon: <ScienceIcon sx={{ fontSize: 40 }} /> },
  { name: 'Electronics Engineering', color: '#ec4899', icon: <ElectricalServicesIcon sx={{ fontSize: 40 }} /> },
];

export const FacultyLogin: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, setUser } = useAuth();

  const [step, setStep] = useState<'departments' | 'login'>('departments');
  const [selectedDept, setSelectedDept] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe] = useState(true);

  // Captcha State
  const [captchaText, setCaptchaText] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const generateCaptcha = useCallback(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result);
    setCaptchaInput('');
    setCaptchaError(null);
  }, []);

  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  useEffect(() => {
    if (user && user.role === 'faculty') {
      navigate('/faculty/dashboard');
    }
  }, [user, navigate]);

  const handleSelectDept = (deptName: string) => {
    setSelectedDept(deptName);
    setStep('login');
    generateCaptcha();
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!username.trim() || !password) {
      toast.warning('Please enter both username and password.');
      return;
    }

    if (!captchaInput.trim()) {
      setCaptchaError('Captcha verification is required.');
      return;
    }

    if (captchaInput.trim().toLowerCase() !== captchaText.toLowerCase()) {
      setCaptchaError('Incorrect captcha code. Please try again.');
      generateCaptcha();
      return;
    }

    setLoading(true);
    try {
      const userProfile = await loginWithEmail(
        username.trim(),
        password,
        rememberMe,
        'faculty',
        selectedDept
      );
      setUser(userProfile);
      toast.success(`Welcome back, Prof. ${userProfile.name}!`);
      setTimeout(() => navigate('/faculty/dashboard'), 1000);
    } catch (err: any) {
      toast.error(err.message || 'Login failed. Please check credentials.');
      generateCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDepts = () => {
    setStep('departments');
    setUsername('');
    setPassword('');
    setCaptchaInput('');
    setCaptchaError(null);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'radial-gradient(circle at 50% 50%, #111827 0%, #030712 100%)',
        py: 6,
      }}
    >
      <Container maxWidth={step === 'departments' ? 'lg' : 'sm'}>
        {loading && <LoadingOverlay open={loading} message="Authenticating credentials..." />}

        {/* ── Title block ────────────────────────────────────── */}
        <Box sx={{ textAlign: 'center', mb: 6 }} className="animate-fade-in">
          <Typography
            variant="h3"
            fontWeight={900}
            className="gradient-text-green"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              letterSpacing: '-0.05em',
            }}
          >
            <EngineeringIcon sx={{ fontSize: 44, color: '#10b981' }} />
            Faculty Access Portal
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1.5, fontWeight: 500 }}>
            {step === 'departments'
              ? 'Select your department to continue to login'
              : `Logged in department: ${selectedDept}`}
          </Typography>
        </Box>

        {/* ── Step 1: Department Cards ───────────────────────── */}
        {step === 'departments' && (
          <Grid container spacing={3} className="animate-slide-up">
            {DEPARTMENTS.map((dept) => (
              <Grid item xs={12} sm={6} md={4} key={dept.name}>
                <Card
                  onClick={() => handleSelectDept(dept.name)}
                  elevation={0}
                  className="glass-panel"
                  sx={{
                    cursor: 'pointer',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    py: 4,
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      borderColor: dept.color,
                      boxShadow: `0 12px 30px -10px ${dept.color}35`,
                      '& .dept-icon-box': {
                        transform: 'scale(1.15)',
                        backgroundColor: `${dept.color}15`,
                        color: dept.color,
                      },
                    },
                  }}
                >
                  <Box
                    className="dept-icon-box"
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      color: 'text.secondary',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2.5,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    {dept.icon}
                  </Box>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    textAlign="center"
                    sx={{ px: 2, fontSize: '1.1rem' }}
                  >
                    {dept.name}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* ── Step 2: Login Form ────────────────────────────── */}
        {step === 'login' && (
          <Card
            elevation={0}
            className="glass-panel"
            sx={{
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <IconButton onClick={handleBackToDepts} color="inherit" size="small">
                  <ArrowBackIcon />
                </IconButton>
                <Box>
                  <Typography variant="h5" fontWeight={800}>
                    Faculty Credentials
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Portal: {selectedDept}
                  </Typography>
                </Box>
              </Box>

              <form onSubmit={handleLoginSubmit}>
                <Grid container spacing={2.5}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Username or Email"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      variant="outlined"
                      autoFocus
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      variant="outlined"
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  {/* ── Captcha Block ── */}
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                        p: 2,
                        borderRadius: 2.5,
                        backgroundColor: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        mb: 1,
                      }}
                    >
                      <Box
                        sx={{
                          fontSize: '1.4rem',
                          fontWeight: 800,
                          fontFamily: 'monospace',
                          letterSpacing: '8px',
                          color: '#10b981',
                          textShadow: '0 0 10px rgba(16,185,129,0.3)',
                          userSelect: 'none',
                          pl: 1,
                        }}
                      >
                        {captchaText}
                      </Box>
                      <Tooltip title="Regenerate Captcha">
                        <IconButton size="small" onClick={generateCaptcha} color="success">
                          <RefreshIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Enter verification code shown above"
                      value={captchaInput}
                      onChange={(e) => {
                        setCaptchaInput(e.target.value);
                        setCaptchaError(null);
                      }}
                      error={!!captchaError}
                      helperText={captchaError}
                      required
                    />
                  </Grid>

                  <Grid item xs={12} sx={{ mt: 1 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      type="submit"
                      disabled={loading}
                      sx={{
                        py: 1.5,
                        fontWeight: 700,
                        fontSize: '1rem',
                        boxShadow: '0 4px 20px -5px rgba(16,185,129,0.4)',
                      }}
                    >
                      {loading ? <CircularProgress size={24} color="inherit" /> : 'Log In to Dashboard'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
};
