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
  CircularProgress,
  Alert,
  Chip,
  LinearProgress,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EngineeringIcon from '@mui/icons-material/Engineering';
import ComputerIcon from '@mui/icons-material/Computer';
import MemoryIcon from '@mui/icons-material/Memory';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ScienceIcon from '@mui/icons-material/Science';
import ElectricalServicesIcon from '@mui/icons-material/ElectricalServices';

import { loginWithEmail } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LoadingOverlay } from '../components/LoadingOverlay';

const API_URL = import.meta.env.VITE_API_URL || 'https://collage-managment-system.onrender.com/api';

// ─── Department Config ────────────────────────────────────────────────────────
const DEPARTMENTS = [
  { name: 'Computer Engineering',    color: '#6366f1', icon: <ComputerIcon sx={{ fontSize: 36 }} /> },
  { name: 'Information Technology',  color: '#06b6d4', icon: <MemoryIcon sx={{ fontSize: 36 }} /> },
  { name: 'Mechanical Engineering',  color: '#f59e0b', icon: <PrecisionManufacturingIcon sx={{ fontSize: 36 }} /> },
  { name: 'Civil Engineering',       color: '#10b981', icon: <AccountTreeIcon sx={{ fontSize: 36 }} /> },
  { name: 'Chemical Engineering',    color: '#8b5cf6', icon: <ScienceIcon sx={{ fontSize: 36 }} /> },
  { name: 'Electronics Engineering', color: '#ec4899', icon: <ElectricalServicesIcon sx={{ fontSize: 36 }} /> },
];

// ─── Step labels ──────────────────────────────────────────────────────────────
const STEP_LABELS = [
  'Master Code',
  'Department',
  'Dept. Verification',
  'Faculty Login',
];

type Step = 'master' | 'department' | 'deptSecret' | 'login';

export const FacultyLogin: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, setUser } = useAuth();

  const [step, setStep] = useState<Step>('master');
  const [selectedDept, setSelectedDept] = useState('');
  const [masterCode, setMasterCode] = useState('');
  const [deptSecretCode, setDeptSecretCode] = useState('');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [captchaText, setCaptchaText] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateCaptcha = useCallback(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 5; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    setCaptchaText(result);
    setCaptchaInput('');
    setCaptchaError(null);
  }, []);

  useEffect(() => { generateCaptcha(); }, [generateCaptcha]);
  useEffect(() => {
    if (user && user.role === 'faculty') navigate('/faculty/dashboard');
  }, [user, navigate]);

  // Restore session state
  useEffect(() => {
    const savedStep = sessionStorage.getItem('fac_step') as Step | null;
    const savedDept = sessionStorage.getItem('fac_dept');
    if (savedStep && savedDept) {
      setStep(savedStep);
      setSelectedDept(savedDept);
    }
  }, []);

  const saveSession = (s: Step, d: string) => {
    sessionStorage.setItem('fac_step', s);
    sessionStorage.setItem('fac_dept', d);
  };

  const clearSession = () => {
    sessionStorage.removeItem('fac_step');
    sessionStorage.removeItem('fac_dept');
  };

  const currentStepIndex = { master: 0, department: 1, deptSecret: 2, login: 3 }[step];

  const goBack = () => {
    setErrorMsg(null);
    const prev: Record<Step, Step> = { master: 'master', department: 'master', deptSecret: 'department', login: 'deptSecret' };
    const prevStep = prev[step];
    setStep(prevStep);
    saveSession(prevStep, prevStep === 'department' ? '' : selectedDept);
    if (prevStep === 'department') setSelectedDept('');
  };

  // ─── Step 1: Verify Master Code ───────────────────────────────────────────
  const handleVerifyMaster = async () => {
    if (!masterCode.trim()) { setErrorMsg('Please enter the master faculty code.'); return; }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_URL}/departments/verify-master`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterCode }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMasterCode('');
        setStep('department');
        saveSession('department', '');
      } else {
        setErrorMsg(data.message || 'Invalid master code. Access denied.');
      }
    } catch {
      setErrorMsg('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2: Select Department ────────────────────────────────────────────
  const handleSelectDept = (deptName: string) => {
    setSelectedDept(deptName);
    setDeptSecretCode('');
    setErrorMsg(null);
    setStep('deptSecret');
    saveSession('deptSecret', deptName);
  };

  // ─── Step 3: Verify Department Secret ────────────────────────────────────
  const handleVerifyDeptSecret = async () => {
    if (!deptSecretCode.trim()) { setErrorMsg('Please enter the department secret code.'); return; }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_URL}/departments/verify-secret`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departmentName: selectedDept, secretCode: deptSecretCode }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDeptSecretCode('');
        setStep('login');
        saveSession('login', selectedDept);
      } else {
        setErrorMsg(data.message || 'Incorrect department code. Access denied.');
      }
    } catch {
      setErrorMsg('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 4: Faculty Login ────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    let hasError = false;
    if (!loginUsername.trim()) { toast.warning('Username is required.'); hasError = true; }
    if (!loginPassword) { toast.warning('Password is required.'); hasError = true; }
    if (!captchaInput) { setCaptchaError('Captcha is required.'); hasError = true; }
    else if (captchaInput.trim().toLowerCase() !== captchaText.toLowerCase()) {
      setCaptchaError('Incorrect captcha. Please try again.');
      generateCaptcha();
      return;
    }
    if (hasError) return;

    setLoading(true);
    try {
      const userProfile = await loginWithEmail(loginUsername.trim(), loginPassword, rememberMe, 'faculty');
      clearSession();
      setUser(userProfile);
      toast.success(`Welcome, ${userProfile.name}! Redirecting to dashboard...`);
      setTimeout(() => navigate('/faculty/dashboard'), 1200);
    } catch (err: any) {
      const errMsg = err.message || '';
      if (errMsg.includes('pending') || errMsg.includes('approval')) {
        toast.error('Your account is awaiting admin approval.');
      } else if (errMsg.includes('rejected')) {
        toast.error('Your account has been rejected. Contact administration.');
      } else if (errMsg.includes('suspended')) {
        toast.error('Your account has been suspended.');
      } else {
        toast.error('Invalid username or password.');
      }
      generateCaptcha();
    } finally {
      setLoading(false);
    }
  };

  // ─── UI ───────────────────────────────────────────────────────────────────
  const renderProgressBar = () => (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        {STEP_LABELS.map((label, i) => (
          <Typography
            key={label}
            variant="caption"
            sx={{
              fontWeight: i === currentStepIndex ? 700 : 400,
              color: i === currentStepIndex ? '#10b981' : i < currentStepIndex ? '#6ee7b7' : 'text.disabled',
              fontSize: '0.7rem',
              textAlign: 'center',
              flex: 1,
            }}
          >
            {i < currentStepIndex ? '✓ ' : ''}{label}
          </Typography>
        ))}
      </Box>
      <LinearProgress
        variant="determinate"
        value={(currentStepIndex / (STEP_LABELS.length - 1)) * 100}
        sx={{ height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.08)', '& .MuiLinearProgress-bar': { bgcolor: '#10b981' } }}
      />
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at 15% 25%, rgba(16,185,129,0.12) 0%, rgba(6,182,212,0.04) 90%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <LoadingOverlay open={loading} message="Verifying..." />
      <Container maxWidth={step === 'department' ? 'md' : 'sm'}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
            <EngineeringIcon sx={{ color: '#10b981', fontSize: 36 }} />
            <Typography variant="h3" className="gradient-text-green" sx={{ fontWeight: 900 }}>
              Faculty Portal
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Secure multi-step access verification
          </Typography>
        </Box>

        <Card elevation={0} className="glass-panel" sx={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            {renderProgressBar()}

            {errorMsg && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setErrorMsg(null)}>
                {errorMsg}
              </Alert>
            )}

            {/* ── STEP 1: Master Code ─────────────────────────────────── */}
            {step === 'master' && (
              <Box>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <LockIcon sx={{ fontSize: 48, color: '#10b981', mb: 1 }} />
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Master Faculty Code
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Enter the master secret code to access the faculty portal.
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  type="password"
                  label="Master Secret Code"
                  value={masterCode}
                  onChange={(e) => { setMasterCode(e.target.value); setErrorMsg(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyMaster()}
                  variant="outlined"
                  autoFocus
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><LockIcon color="action" /></InputAdornment>,
                  }}
                  sx={{ mb: 3 }}
                />
                <Button
                  fullWidth variant="contained" size="large"
                  onClick={handleVerifyMaster}
                  disabled={loading || !masterCode.trim()}
                  sx={{ height: 48, fontWeight: 700, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
                >
                  {loading ? <CircularProgress size={22} color="inherit" /> : 'Verify & Continue →'}
                </Button>
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Button size="small" onClick={() => navigate('/')} startIcon={<ArrowBackIcon />} sx={{ color: 'text.secondary' }}>
                    Back to Portals
                  </Button>
                </Box>
              </Box>
            )}

            {/* ── STEP 2: Department Selection ────────────────────────── */}
            {step === 'department' && (
              <Box>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Select Your Department
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Choose the department you are assigned to.
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  {DEPARTMENTS.map((dept) => (
                    <Grid item xs={12} sm={6} key={dept.name}>
                      <Card
                        onClick={() => handleSelectDept(dept.name)}
                        sx={{
                          cursor: 'pointer',
                          border: `2px solid transparent`,
                          borderRadius: 2,
                          transition: 'all 0.25s ease',
                          background: `linear-gradient(135deg, ${dept.color}15 0%, ${dept.color}08 100%)`,
                          '&:hover': {
                            borderColor: dept.color,
                            transform: 'translateY(-3px)',
                            boxShadow: `0 8px 24px ${dept.color}30`,
                          },
                        }}
                      >
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '12px !important' }}>
                          <Box sx={{ color: dept.color }}>{dept.icon}</Box>
                          <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                            {dept.name}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Button size="small" onClick={goBack} startIcon={<ArrowBackIcon />} sx={{ color: 'text.secondary' }}>
                    Back
                  </Button>
                </Box>
              </Box>
            )}

            {/* ── STEP 3: Department Secret Code ─────────────────────── */}
            {step === 'deptSecret' && (
              <Box>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Chip
                    label={selectedDept}
                    sx={{ bgcolor: 'rgba(16,185,129,0.1)', color: '#10b981', fontWeight: 700, mb: 2 }}
                  />
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Department Verification
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Enter the secret code for {selectedDept}.
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  type="password"
                  label="Department Secret Code"
                  value={deptSecretCode}
                  onChange={(e) => { setDeptSecretCode(e.target.value); setErrorMsg(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyDeptSecret()}
                  variant="outlined"
                  autoFocus
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><LockIcon color="action" /></InputAdornment>,
                  }}
                  sx={{ mb: 3 }}
                />
                <Button
                  fullWidth variant="contained" size="large"
                  onClick={handleVerifyDeptSecret}
                  disabled={loading || !deptSecretCode.trim()}
                  sx={{ height: 48, fontWeight: 700, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
                >
                  {loading ? <CircularProgress size={22} color="inherit" /> : 'Verify Department →'}
                </Button>
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Button size="small" onClick={goBack} startIcon={<ArrowBackIcon />} sx={{ color: 'text.secondary' }}>
                    Back to Departments
                  </Button>
                </Box>
              </Box>
            )}

            {/* ── STEP 4: Faculty Login ───────────────────────────────── */}
            {step === 'login' && (
              <Box>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <CheckCircleIcon sx={{ fontSize: 40, color: '#10b981', mb: 1 }} />
                  <Chip
                    label={`✓ ${selectedDept} — Verified`}
                    sx={{ bgcolor: 'rgba(16,185,129,0.12)', color: '#10b981', fontWeight: 700, mb: 2 }}
                  />
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Faculty Sign In
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Enter your faculty credentials to access the dashboard.
                  </Typography>
                </Box>

                <form onSubmit={handleLogin} noValidate>
                  <TextField
                    fullWidth
                    label="Username"
                    type="text"
                    margin="normal"
                    variant="outlined"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    autoFocus
                    autoComplete="username"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><PersonIcon color="action" /></InputAdornment>,
                    }}
                    disabled={loading}
                  />
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    margin="normal"
                    variant="outlined"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    autoComplete="current-password"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><LockIcon color="action" /></InputAdornment>,
                    }}
                    disabled={loading}
                  />

                  {/* Captcha */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2, mb: 1 }}>
                    <Box
                      sx={{
                        flexGrow: 1, height: 48,
                        bgcolor: 'rgba(255,255,255,0.05)',
                        border: '1px dashed rgba(255,255,255,0.15)',
                        borderRadius: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        letterSpacing: 6, fontSize: '1.25rem', fontWeight: 700,
                        color: '#6ee7b7', fontFamily: 'monospace', userSelect: 'none',
                        position: 'relative', overflow: 'hidden',
                        background: 'linear-gradient(45deg, rgba(16,185,129,0.08) 0%, rgba(6,182,212,0.08) 100%)',
                      }}
                    >
                      <Box sx={{ position: 'absolute', width: '150%', height: 2, bgcolor: 'rgba(255,255,255,0.08)', transform: 'rotate(12deg)' }} />
                      <span style={{ transform: 'rotate(-3deg)' }}>{captchaText}</span>
                    </Box>
                    <Button variant="outlined" color="success" onClick={generateCaptcha} sx={{ height: 48, minWidth: 80 }} disabled={loading}>
                      Refresh
                    </Button>
                  </Box>
                  <TextField
                    fullWidth label="Enter Captcha" variant="outlined"
                    value={captchaInput}
                    onChange={(e) => { setCaptchaInput(e.target.value); setCaptchaError(null); }}
                    error={!!captchaError} helperText={captchaError}
                    disabled={loading} sx={{ mb: 1 }}
                  />

                  <FormControlLabel
                    control={<Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} color="success" size="small" />}
                    label={<Typography variant="body2" color="text.secondary">Remember Me</Typography>}
                    sx={{ mb: 2 }}
                  />

                  <Button
                    fullWidth type="submit" variant="contained" size="large"
                    disabled={loading || !loginUsername.trim() || !loginPassword || !captchaInput}
                    sx={{ height: 48, fontWeight: 700, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
                  >
                    {loading ? <CircularProgress size={22} color="inherit" /> : 'Log In to Faculty Dashboard'}
                  </Button>
                </form>

                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Button size="small" onClick={goBack} startIcon={<ArrowBackIcon />} sx={{ color: 'text.secondary' }}>
                    Back
                  </Button>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};
