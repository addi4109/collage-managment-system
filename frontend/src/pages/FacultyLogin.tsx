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
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import ShieldIcon from '@mui/icons-material/Shield';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ComputerIcon from '@mui/icons-material/Computer';
import StorageIcon from '@mui/icons-material/Storage';
import SettingsIcon from '@mui/icons-material/Settings';
import BusinessIcon from '@mui/icons-material/Business';
import ScienceIcon from '@mui/icons-material/Science';
import MemoryIcon from '@mui/icons-material/Memory';

import { loginWithEmail, registerWithEmail } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { PasswordStrengthBar } from '../components/PasswordStrengthBar';

const API_URL = import.meta.env.VITE_API_URL || 'https://collage-managment-system.onrender.com/api';

const DEPARTMENTS = [
  { name: 'Computer Engineering', icon: <ComputerIcon sx={{ fontSize: 40, color: '#10b981' }} /> },
  { name: 'Information Technology', icon: <StorageIcon sx={{ fontSize: 40, color: '#06b6d4' }} /> },
  { name: 'Mechanical Engineering', icon: <SettingsIcon sx={{ fontSize: 40, color: '#f59e0b' }} /> },
  { name: 'Civil Engineering', icon: <BusinessIcon sx={{ fontSize: 40, color: '#6366f1' }} /> },
  { name: 'Chemical Engineering', icon: <ScienceIcon sx={{ fontSize: 40, color: '#ec4899' }} /> },
  { name: 'Electronics Engineering', icon: <MemoryIcon sx={{ fontSize: 40, color: '#a855f7' }} /> },
];

export const FacultyLogin: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, setUser } = useAuth();

  // Wizard Steps: 1 = Master Code, 2 = Department Select, 3 = Dept Secret Code, 4 = Login/Register
  const [step, setStep] = useState<number>(() => {
    const saved = sessionStorage.getItem('faculty_wizard_step');
    return saved ? parseInt(saved, 10) : 1;
  });

  const [masterCode, setMasterCode] = useState(() => sessionStorage.getItem('faculty_master_code') || '');
  const [selectedDept, setSelectedDept] = useState(() => sessionStorage.getItem('faculty_selected_dept') || '');
  const [deptSecretCode, setDeptSecretCode] = useState(() => sessionStorage.getItem('faculty_dept_secret') || '');

  // Step 4 Tab state: 0 = Sign In, 1 = Register
  const [activeTab, setActiveTab] = useState(0);

  // Sign In states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Register states
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');

  // UI loading states
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');

  useEffect(() => {
    if (user) {
      if (user.role === 'faculty') {
        navigate('/faculty/dashboard');
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    }
  }, [user, navigate]);

  // Persist wizard progress
  useEffect(() => {
    sessionStorage.setItem('faculty_wizard_step', step.toString());
    sessionStorage.setItem('faculty_master_code', masterCode);
    sessionStorage.setItem('faculty_selected_dept', selectedDept);
    sessionStorage.setItem('faculty_dept_secret', deptSecretCode);
  }, [step, masterCode, selectedDept, deptSecretCode]);

  const handleClearSession = () => {
    sessionStorage.removeItem('faculty_wizard_step');
    sessionStorage.removeItem('faculty_master_code');
    sessionStorage.removeItem('faculty_selected_dept');
    sessionStorage.removeItem('faculty_dept_secret');
    setStep(1);
    setMasterCode('');
    setSelectedDept('');
    setDeptSecretCode('');
  };

  // Step 1: Verify Master Code
  const handleVerifyMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterCode) {
      toast.warning('Please enter the Faculty Master Access Code.');
      return;
    }

    setLoading(true);
    setLoadingMsg('Verifying Master Access Code...');
    try {
      const res = await fetch(`${API_URL}/departments/verify-master`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Invalid Master Code.');
      }
      toast.success('Master Access Code verified.');
      setStep(2);
    } catch (err: any) {
      toast.error(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Select Department Card
  const handleSelectDept = (deptName: string) => {
    setSelectedDept(deptName);
    setStep(3);
  };

  // Step 3: Verify Department Secret Code
  const handleVerifyDeptSecret = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptSecretCode) {
      toast.warning('Please enter the Department Secret Code.');
      return;
    }

    setLoading(true);
    setLoadingMsg(`Verifying ${selectedDept} Secret Code...`);
    try {
      const res = await fetch(`${API_URL}/departments/verify-secret`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departmentName: selectedDept, secretCode: deptSecretCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Invalid Department Secret Code.');
      }
      toast.success('Department Access verified.');
      setStep(4);
    } catch (err: any) {
      toast.error(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Login Action
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.warning('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setLoadingMsg('Authenticating faculty credentials...');
    try {
      const userProfile = await loginWithEmail(loginEmail, loginPassword, rememberMe, 'faculty');
      setUser(userProfile);
      toast.success('Faculty login successful. Loading dashboard...');
      navigate('/faculty/dashboard');
    } catch (err: any) {
      const errMsg = err.message || '';
      if (errMsg.includes('pending') || errMsg.includes('approval')) {
        toast.error('Your faculty account is pending administrator approval.');
      } else if (errMsg.includes('rejected')) {
        toast.error('Your registration request was rejected by admin.');
      } else if (errMsg.includes('suspended')) {
        toast.error('Your account is suspended. Contact admin.');
      } else {
        toast.error(errMsg || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Register Action
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

    // Password strength check
    if (registerPassword.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    setLoadingMsg('Creating pending faculty account...');
    try {
      await registerWithEmail(
        registerEmail,
        registerPassword,
        registerName,
        'faculty',
        deptSecretCode,
        selectedDept
      );
      toast.success('Registration request submitted! Awaiting Admin Approval.');
      // Switch back to login tab and auto-fill email
      setLoginEmail(registerEmail);
      setActiveTab(0);
    } catch (err: any) {
      toast.error(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

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
      
      <Container maxWidth={step === 2 ? 'md' : 'xs'}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" className="gradient-text-green" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.025em' }}>
            Faculty Portal
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {step === 1 && 'Step 1: Verify Faculty Master Code'}
            {step === 2 && 'Step 2: Choose Your Department'}
            {step === 3 && `Step 3: Verify ${selectedDept} Secret Code`}
            {step === 4 && `Step 4: Department Access Workspace (${selectedDept})`}
          </Typography>
        </Box>

        <Card elevation={0} className="glass-panel" sx={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <CardContent sx={{ p: 4 }}>

            {/* STEP 1: Faculty Master Access Code */}
            {step === 1 && (
              <form onSubmit={handleVerifyMaster}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                  Enter Master Access Code
                </Typography>
                <TextField
                  fullWidth
                  label="Faculty Master Access Code"
                  type="password"
                  margin="normal"
                  value={masterCode}
                  onChange={(e) => setMasterCode(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <ShieldIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  required
                />
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  type="submit"
                  sx={{ mt: 3, mb: 2, height: 48, fontWeight: 600, backgroundColor: '#10b981', '&:hover': { backgroundColor: '#059669' } }}
                >
                  Verify Master Code
                </Button>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Link to="/" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.85rem' }}>
                    ← Back to Portals
                  </Link>
                </Box>
              </form>
            )}

            {/* STEP 2: Department Selection Cards */}
            {step === 2 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, textAlign: 'center' }}>
                  Select Your Assigned Department
                </Typography>
                <Grid container spacing={3}>
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
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          transition: 'transform 0.2s ease, border-color 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            borderColor: '#10b981',
                            background: 'rgba(16, 185, 129, 0.04)',
                          },
                        }}
                      >
                        <Box sx={{ mb: 2 }}>{dept.icon}</Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {dept.name}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                  <Button startIcon={<ArrowBackIcon />} onClick={() => setStep(1)} color="inherit">
                    Back
                  </Button>
                  <Button onClick={handleClearSession} color="error" size="small">
                    Reset Wizard
                  </Button>
                </Box>
              </Box>
            )}

            {/* STEP 3: Department Secret Code Verification */}
            {step === 3 && (
              <form onSubmit={handleVerifyDeptSecret}>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
                  Verify Department Access
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Please enter the secret code assigned to <strong>{selectedDept}</strong>.
                </Typography>
                <TextField
                  fullWidth
                  label={`${selectedDept} Secret Code`}
                  type="password"
                  margin="normal"
                  value={deptSecretCode}
                  onChange={(e) => setDeptSecretCode(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  required
                />
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  type="submit"
                  sx={{ mt: 3, mb: 2, height: 48, fontWeight: 600, backgroundColor: '#10b981', '&:hover': { backgroundColor: '#059669' } }}
                >
                  Verify Secret Code
                </Button>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                  <Button startIcon={<ArrowBackIcon />} onClick={() => setStep(2)} color="inherit">
                    Choose Another Dept
                  </Button>
                  <Button onClick={handleClearSession} color="error" size="small">
                    Reset
                  </Button>
                </Box>
              </form>
            )}

            {/* STEP 4: Login / Register Workspace */}
            {step === 4 && (
              <Box>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                  <Tabs
                    value={activeTab}
                    onChange={(_, val) => setActiveTab(val)}
                    variant="fullWidth"
                    textColor="inherit"
                    TabIndicatorProps={{ style: { backgroundColor: '#10b981' } }}
                  >
                    <Tab label="Sign In" sx={{ fontWeight: 600 }} />
                    <Tab label="Register" sx={{ fontWeight: 600 }} />
                  </Tabs>
                </Box>

                {/* Tab 1: Faculty Sign In */}
                {activeTab === 0 && (
                  <form onSubmit={handleLogin}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      margin="normal"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                      required
                    />
                    <TextField
                      fullWidth
                      label="Password"
                      type="password"
                      margin="normal"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                      required
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, mb: 2 }}>
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
                      color="success"
                      type="submit"
                      sx={{ mb: 2, height: 48, fontWeight: 600, backgroundColor: '#10b981', '&:hover': { backgroundColor: '#059669' } }}
                    >
                      Sign In
                    </Button>
                  </form>
                )}

                {/* Tab 2: Faculty Registration */}
                {activeTab === 1 && (
                  <form onSubmit={handleRegister}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      type="text"
                      margin="normal"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                      required
                    />
                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      margin="normal"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                      required
                    />
                    <TextField
                      fullWidth
                      label="Selected Department"
                      type="text"
                      margin="normal"
                      value={selectedDept}
                      disabled
                      helperText="Automatically assigned based on department verification."
                    />
                    <TextField
                      fullWidth
                      label="Password"
                      type="password"
                      margin="normal"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
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
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                      required
                    />
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      type="submit"
                      sx={{ mt: 2, mb: 2, height: 48, fontWeight: 600, backgroundColor: '#10b981', '&:hover': { backgroundColor: '#059669' } }}
                    >
                      Submit Registration
                    </Button>
                  </form>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                  <Button startIcon={<ArrowBackIcon />} onClick={() => setStep(3)} color="inherit">
                    Back to Secret Code
                  </Button>
                  <Button onClick={handleClearSession} color="error" size="small">
                    Reset Wizard
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
