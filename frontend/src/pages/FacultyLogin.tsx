import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  Grid,
  Paper,
  Chip,
  Divider,
  Stack,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ComputerIcon from '@mui/icons-material/Computer';
import StorageIcon from '@mui/icons-material/Storage';
import SettingsIcon from '@mui/icons-material/Settings';
import BusinessIcon from '@mui/icons-material/Business';
import ScienceIcon from '@mui/icons-material/Science';
import MemoryIcon from '@mui/icons-material/Memory';
import SchoolIcon from '@mui/icons-material/School';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import LoginIcon from '@mui/icons-material/Login';
import KeyIcon from '@mui/icons-material/Key';

import { loginWithEmail, registerWithEmail } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { PasswordStrengthBar } from '../components/PasswordStrengthBar';

const API_URL = import.meta.env.VITE_API_URL || 'https://collage-managment-system.onrender.com/api';

const DEPARTMENTS = [
  { name: 'Computer Engineering', icon: <ComputerIcon sx={{ fontSize: 44, color: '#10b981' }} />, color: '#10b981', bg: 'rgba(16,185,129,0.06)' },
  { name: 'Information Technology', icon: <StorageIcon sx={{ fontSize: 44, color: '#06b6d4' }} />, color: '#06b6d4', bg: 'rgba(6,182,212,0.06)' },
  { name: 'Mechanical Engineering', icon: <SettingsIcon sx={{ fontSize: 44, color: '#f59e0b' }} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.06)' },
  { name: 'Civil Engineering', icon: <BusinessIcon sx={{ fontSize: 44, color: '#6366f1' }} />, color: '#6366f1', bg: 'rgba(99,102,241,0.06)' },
  { name: 'Chemical Engineering', icon: <ScienceIcon sx={{ fontSize: 44, color: '#ec4899' }} />, color: '#ec4899', bg: 'rgba(236,72,153,0.06)' },
  { name: 'Electronics Engineering', icon: <MemoryIcon sx={{ fontSize: 44, color: '#a855f7' }} />, color: '#a855f7', bg: 'rgba(168,85,247,0.06)' },
];

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

/**
 * Multi-Level Faculty Access Portal
 *
 * WIZARD STEPS:
 * 1  → Department Selection (cards)
 * 2  → Department Secret Code Verification
 * 3  → Choice: "I'm a New Faculty" OR "I Already Have an Account"
 * 4a → REGISTRATION path: Registration Form (dept auto-assigned, no semester code)
 * 4b → EXISTING path: Semester Selection (cards 1–8)
 * 5  → Semester Secret Code Verification → Login Form
 */
const STEP = {
  DEPT_SELECT: 1,
  DEPT_SECRET: 2,
  CHOICE: 3,
  REGISTER: 4,
  SEM_SELECT: 5,
  SEM_SECRET: 6,
  LOGIN: 7,
};

export const FacultyLogin: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, setUser } = useAuth();

  const [step, setStep] = useState<number>(() => {
    const saved = sessionStorage.getItem('fac_step');
    return saved ? parseInt(saved, 10) : STEP.DEPT_SELECT;
  });

  const [selectedDept, setSelectedDept] = useState(() => sessionStorage.getItem('fac_dept') || '');
  const [deptSecretCode, setDeptSecretCode] = useState('');
  const [selectedSem, setSelectedSem] = useState<number>(() => {
    const saved = sessionStorage.getItem('fac_sem');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [semSecretCode, setSemSecretCode] = useState('');

  // Login form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Register form states
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'faculty') navigate('/faculty/dashboard');
      else if (user.role === 'admin') navigate('/admin/dashboard');
      else navigate('/student/dashboard');
    }
  }, [user, navigate]);

  // Persist wizard step & selections
  useEffect(() => {
    sessionStorage.setItem('fac_step', step.toString());
    sessionStorage.setItem('fac_dept', selectedDept);
    sessionStorage.setItem('fac_sem', selectedSem.toString());
  }, [step, selectedDept, selectedSem]);

  const resetWizard = () => {
    sessionStorage.removeItem('fac_step');
    sessionStorage.removeItem('fac_dept');
    sessionStorage.removeItem('fac_sem');
    setStep(STEP.DEPT_SELECT);
    setSelectedDept('');
    setDeptSecretCode('');
    setSelectedSem(0);
    setSemSecretCode('');
    setLoginEmail('');
    setLoginPassword('');
    setRegisterName('');
    setRegisterEmail('');
    setRegisterPassword('');
    setRegisterConfirmPassword('');
  };

  /* ── STEP 1: Select Department ── */
  const handleSelectDept = (deptName: string) => {
    setSelectedDept(deptName);
    setDeptSecretCode('');
    setStep(STEP.DEPT_SECRET);
  };

  /* ── STEP 2: Verify Department Secret ── */
  const handleVerifyDeptSecret = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptSecretCode) {
      toast.warning('Please enter the Department Secret Code.');
      return;
    }
    setLoading(true);
    setLoadingMsg(`Verifying ${selectedDept} Secret Code…`);
    try {
      const res = await fetch(`${API_URL}/departments/verify-secret`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departmentName: selectedDept, secretCode: deptSecretCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Invalid Department Secret Code.');
      toast.success(`${selectedDept} verified!`);
      setStep(STEP.CHOICE);
    } catch (err: any) {
      toast.error(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  /* ── STEP 4b: Select Semester ── */
  const handleSelectSem = (semNum: number) => {
    setSelectedSem(semNum);
    setSemSecretCode('');
    setStep(STEP.SEM_SECRET);
  };

  /* ── STEP 5: Verify Semester Secret ── */
  const handleVerifySemSecret = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!semSecretCode) {
      toast.warning('Please enter the Semester Secret Code.');
      return;
    }
    setLoading(true);
    setLoadingMsg(`Verifying Semester ${selectedSem} Secret Code…`);
    try {
      const res = await fetch(`${API_URL}/departments/verify-semester`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departmentName: selectedDept,
          semesterNumber: selectedSem,
          secretCode: semSecretCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Invalid Semester Secret Code.');
      toast.success(`Semester ${selectedSem} access granted!`);
      setStep(STEP.LOGIN);
    } catch (err: any) {
      toast.error(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  /* ── STEP 6 (Login path): Faculty Sign In ── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.warning('Please provide both email and password.');
      return;
    }
    setLoading(true);
    setLoadingMsg('Authenticating faculty credentials…');
    try {
      const userProfile = await loginWithEmail(loginEmail, loginPassword, rememberMe, 'faculty');
      setUser(userProfile);
      toast.success('Login successful. Loading dashboard…');
      navigate('/faculty/dashboard');
    } catch (err: any) {
      const errMsg = err.message || '';
      if (errMsg.includes('pending') || errMsg.includes('approval')) {
        toast.error('Your account is pending administrator approval.');
      } else if (errMsg.includes('rejected')) {
        toast.error('Your registration was rejected. Contact admin.');
      } else if (errMsg.includes('suspended')) {
        toast.error('Your account is suspended. Contact admin.');
      } else {
        toast.error(errMsg || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── STEP 4 (Register path): Faculty Registration ── */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName || !registerEmail || !registerPassword || !registerConfirmPassword) {
      toast.warning('Please fill in all fields.');
      return;
    }
    if (registerPassword !== registerConfirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (registerPassword.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setLoadingMsg('Submitting registration request…');
    try {
      await registerWithEmail(
        registerEmail,
        registerPassword,
        registerName,
        'faculty',
        deptSecretCode,
        selectedDept
      );
      toast.success('Registration submitted! Awaiting Admin Approval.');
      // Switch to login flow after registration
      setLoginEmail(registerEmail);
      setStep(STEP.CHOICE);
    } catch (err: any) {
      toast.error(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Step label helper ── */
  const getStepLabel = () => {
    switch (step) {
      case STEP.DEPT_SELECT: return 'Step 1 of 4 — Select Your Department';
      case STEP.DEPT_SECRET: return 'Step 2 of 4 — Department Verification';
      case STEP.CHOICE: return 'Step 3 of 4 — Faculty Access Type';
      case STEP.REGISTER: return 'New Faculty Registration';
      case STEP.SEM_SELECT: return 'Step 3 of 4 — Select Your Semester';
      case STEP.SEM_SECRET: return 'Step 4 of 4 — Semester Verification';
      case STEP.LOGIN: return `Faculty Login — ${selectedDept} · Semester ${selectedSem}`;
      default: return '';
    }
  };

  const isWide = step === STEP.DEPT_SELECT || step === STEP.SEM_SELECT;
  const deptObj = DEPARTMENTS.find((d) => d.name === selectedDept);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at 10% 20%, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.03) 90.2%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 6,
        px: 2,
      }}
    >
      <LoadingOverlay open={loading} message={loadingMsg} />

      <Container maxWidth={isWide ? 'md' : 'xs'}>
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography
            variant="h3"
            component="h1"
            className="gradient-text-green"
            sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.025em' }}
          >
            Faculty Portal
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {getStepLabel()}
          </Typography>
          {selectedDept && step > STEP.DEPT_SELECT && (
            <Chip
              label={selectedDept}
              size="small"
              sx={{
                mt: 1,
                backgroundColor: deptObj ? deptObj.bg : 'rgba(255,255,255,0.06)',
                color: deptObj ? deptObj.color : 'inherit',
                fontWeight: 600,
                border: `1px solid ${deptObj ? deptObj.color : 'rgba(255,255,255,0.1)'}`,
              }}
            />
          )}
          {selectedSem > 0 && step >= STEP.SEM_SECRET && (
            <Chip
              label={`Semester ${selectedSem}`}
              size="small"
              sx={{ mt: 1, ml: 1, backgroundColor: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid #6366f1', fontWeight: 600 }}
            />
          )}
        </Box>

        <Card elevation={0} className="glass-panel" sx={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>

            {/* ─── STEP 1: Department Selection ─── */}
            {step === STEP.DEPT_SELECT && (
              <Box>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, textAlign: 'center' }}>
                  Select Your Department
                </Typography>
                <Grid container spacing={2}>
                  {DEPARTMENTS.map((dept) => (
                    <Grid item xs={12} sm={6} key={dept.name}>
                      <Paper
                        elevation={0}
                        onClick={() => handleSelectDept(dept.name)}
                        sx={{
                          p: 3,
                          textAlign: 'center',
                          cursor: 'pointer',
                          borderRadius: 2,
                          background: dept.bg,
                          border: `1px solid ${dept.color}22`,
                          transition: 'transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            borderColor: dept.color,
                            boxShadow: `0 8px 24px ${dept.color}30`,
                          },
                        }}
                      >
                        <Box sx={{ mb: 1.5 }}>{dept.icon}</Box>
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                          {dept.name}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Link to="/" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.85rem' }}>
                    ← Back to Portals
                  </Link>
                </Box>
              </Box>
            )}

            {/* ─── STEP 2: Department Secret Code ─── */}
            {step === STEP.DEPT_SECRET && (
              <form onSubmit={handleVerifyDeptSecret}>
                <Box sx={{ mb: 2, textAlign: 'center' }}>
                  {deptObj && <Box sx={{ mb: 1 }}>{deptObj.icon}</Box>}
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {selectedDept}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Enter the Department Secret Code to continue.
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  label="Department Secret Code"
                  type="password"
                  margin="normal"
                  value={deptSecretCode}
                  onChange={(e) => setDeptSecretCode(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <KeyIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  required
                />
                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  sx={{ mt: 3, mb: 2, height: 48, fontWeight: 600, backgroundColor: deptObj?.color || '#10b981', '&:hover': { filter: 'brightness(0.9)' } }}
                >
                  Verify Department Access
                </Button>
                <Button
                  fullWidth
                  startIcon={<ArrowBackIcon />}
                  onClick={() => setStep(STEP.DEPT_SELECT)}
                  color="inherit"
                  size="small"
                >
                  Choose Another Department
                </Button>
              </form>
            )}

            {/* ─── STEP 3: New / Existing Choice ─── */}
            {step === STEP.CHOICE && (
              <Box>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 700, textAlign: 'center' }}>
                  How would you like to proceed?
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
                  Department access verified for <strong>{selectedDept}</strong>.
                </Typography>
                <Stack spacing={2}>
                  <Paper
                    elevation={0}
                    onClick={() => setStep(STEP.REGISTER)}
                    sx={{
                      p: 3,
                      cursor: 'pointer',
                      borderRadius: 2,
                      background: 'rgba(16,185,129,0.04)',
                      border: '1px solid rgba(16,185,129,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      transition: 'border-color 0.18s, transform 0.18s',
                      '&:hover': { borderColor: '#10b981', transform: 'translateY(-2px)' },
                    }}
                  >
                    <HowToRegIcon sx={{ fontSize: 40, color: '#10b981' }} />
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>
                        New Faculty Registration
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Create a new account under {selectedDept}
                      </Typography>
                    </Box>
                  </Paper>

                  <Paper
                    elevation={0}
                    onClick={() => setStep(STEP.SEM_SELECT)}
                    sx={{
                      p: 3,
                      cursor: 'pointer',
                      borderRadius: 2,
                      background: 'rgba(99,102,241,0.04)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      transition: 'border-color 0.18s, transform 0.18s',
                      '&:hover': { borderColor: '#6366f1', transform: 'translateY(-2px)' },
                    }}
                  >
                    <LoginIcon sx={{ fontSize: 40, color: '#6366f1' }} />
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>
                        I Already Have an Account
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Continue to Semester Verification → Sign In
                      </Typography>
                    </Box>
                  </Paper>
                </Stack>

                <Divider sx={{ my: 3 }} />
                <Button
                  fullWidth
                  startIcon={<ArrowBackIcon />}
                  onClick={() => setStep(STEP.DEPT_SELECT)}
                  color="inherit"
                  size="small"
                >
                  Back to Department Selection
                </Button>
              </Box>
            )}

            {/* ─── STEP 4 (Register path): Registration Form ─── */}
            {step === STEP.REGISTER && (
              <form onSubmit={handleRegister}>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
                  New Faculty Registration
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Your account will be created under <strong>{selectedDept}</strong> and will require Admin approval before you can log in.
                </Typography>
                <TextField
                  fullWidth
                  label="Full Name"
                  type="text"
                  margin="normal"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon color="action" /></InputAdornment> }}
                  required
                />
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  margin="normal"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon color="action" /></InputAdornment> }}
                  required
                />
                <TextField
                  fullWidth
                  label="Department"
                  type="text"
                  margin="normal"
                  value={selectedDept}
                  disabled
                  helperText="Auto-assigned based on department verification."
                />
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  margin="normal"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon color="action" /></InputAdornment> }}
                  required
                />
                <PasswordStrengthBar passwordVal={registerPassword} />
                <TextField
                  fullWidth
                  label="Confirm Password"
                  type="password"
                  margin="normal"
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon color="action" /></InputAdornment> }}
                  required
                />
                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  sx={{ mt: 2, mb: 2, height: 48, fontWeight: 600, backgroundColor: '#10b981', '&:hover': { backgroundColor: '#059669' } }}
                >
                  Submit Registration
                </Button>
                <Button
                  fullWidth
                  startIcon={<ArrowBackIcon />}
                  onClick={() => setStep(STEP.CHOICE)}
                  color="inherit"
                  size="small"
                >
                  Back
                </Button>
              </form>
            )}

            {/* ─── STEP 5: Semester Selection ─── */}
            {step === STEP.SEM_SELECT && (
              <Box>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 700, textAlign: 'center' }}>
                  Select Your Semester
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                  Choose the semester you are assigned to teach in <strong>{selectedDept}</strong>.
                </Typography>
                <Grid container spacing={2}>
                  {SEMESTERS.map((sem) => (
                    <Grid item xs={6} sm={3} key={sem}>
                      <Paper
                        elevation={0}
                        onClick={() => handleSelectSem(sem)}
                        sx={{
                          p: 2.5,
                          textAlign: 'center',
                          cursor: 'pointer',
                          borderRadius: 2,
                          background: 'rgba(99,102,241,0.04)',
                          border: '1px solid rgba(99,102,241,0.15)',
                          transition: 'transform 0.18s, border-color 0.18s, box-shadow 0.18s',
                          '&:hover': {
                            transform: 'translateY(-3px)',
                            borderColor: '#6366f1',
                            boxShadow: '0 6px 20px rgba(99,102,241,0.25)',
                          },
                        }}
                      >
                        <SchoolIcon sx={{ fontSize: 32, color: '#6366f1', mb: 0.5 }} />
                        <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                          Sem {sem}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Semester {sem}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
                <Divider sx={{ my: 3 }} />
                <Button
                  fullWidth
                  startIcon={<ArrowBackIcon />}
                  onClick={() => setStep(STEP.CHOICE)}
                  color="inherit"
                  size="small"
                >
                  Back to Access Type
                </Button>
              </Box>
            )}

            {/* ─── STEP 6: Semester Secret Code ─── */}
            {step === STEP.SEM_SECRET && (
              <form onSubmit={handleVerifySemSecret}>
                <Box sx={{ mb: 2, textAlign: 'center' }}>
                  <SchoolIcon sx={{ fontSize: 48, color: '#6366f1', mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Semester {selectedSem} Verification
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Enter the secret code for <strong>Semester {selectedSem}</strong>.
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  label={`Semester ${selectedSem} Secret Code`}
                  type="password"
                  margin="normal"
                  value={semSecretCode}
                  onChange={(e) => setSemSecretCode(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <KeyIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  required
                />
                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  sx={{ mt: 3, mb: 2, height: 48, fontWeight: 600, backgroundColor: '#6366f1', '&:hover': { backgroundColor: '#4f46e5' } }}
                >
                  Verify Semester Access
                </Button>
                <Button
                  fullWidth
                  startIcon={<ArrowBackIcon />}
                  onClick={() => setStep(STEP.SEM_SELECT)}
                  color="inherit"
                  size="small"
                >
                  Choose Another Semester
                </Button>
              </form>
            )}

            {/* ─── STEP 7: Faculty Login ─── */}
            {step === STEP.LOGIN && (
              <form onSubmit={handleLogin}>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
                  Faculty Sign In
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Signing in to <strong>{selectedDept}</strong> · <strong>Semester {selectedSem}</strong>
                </Typography>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  margin="normal"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon color="action" /></InputAdornment> }}
                  required
                />
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  margin="normal"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon color="action" /></InputAdornment> }}
                  required
                />
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        color="success"
                        size="small"
                      />
                    }
                    label={<Typography variant="body2" color="text.secondary">Remember Me</Typography>}
                  />
                </Box>
                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  sx={{ mb: 2, height: 48, fontWeight: 600, backgroundColor: '#10b981', '&:hover': { backgroundColor: '#059669' } }}
                >
                  Sign In
                </Button>
                <Button
                  fullWidth
                  startIcon={<ArrowBackIcon />}
                  onClick={() => setStep(STEP.SEM_SECRET)}
                  color="inherit"
                  size="small"
                >
                  Back
                </Button>
              </form>
            )}

            {/* Reset Wizard (all steps except DEPT_SELECT) */}
            {step !== STEP.DEPT_SELECT && (
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button
                  onClick={resetWizard}
                  color="error"
                  size="small"
                  sx={{ fontSize: '0.75rem', opacity: 0.7, '&:hover': { opacity: 1 } }}
                >
                  Reset Entire Wizard
                </Button>
              </Box>
            )}

          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};
