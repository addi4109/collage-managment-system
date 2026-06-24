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
  MenuItem,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import { registerWithEmail } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PasswordStrengthBar } from '../components/PasswordStrengthBar';
import { LoadingOverlay } from '../components/LoadingOverlay';

export const StudentRegister: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, setUser } = useAuth();

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [department, setDepartment] = useState('');
  const [departmentError, setDepartmentError] = useState<string | null>(null);
  const [semester, setSemester] = useState('');
  const [semesterError, setSemesterError] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmError, setConfirmError] = useState<string | null>(null);

  useEffect(() => {
    if (user) navigate('/student/dashboard');
  }, [user, navigate]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!val.trim()) {
      setNameError('Full name is required.');
    } else {
      setNameError(null);
    }
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (!val) {
      setEmailError('Email address is required.');
    } else if (!/\S+@\S+\.\S+/.test(val)) {
      setEmailError('Enter a valid email address.');
    } else {
      setEmailError(null);
    }
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    
    if (confirmPassword && val !== confirmPassword) {
      setConfirmError('Passwords do not match.');
    } else {
      setConfirmError(null);
    }

    if (!val) {
      setPasswordError('Password is required.');
    } else if (val.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
    } else if (!/[A-Z]/.test(val) || !/[a-z]/.test(val) || !/[0-9]/.test(val) || !/[^A-Za-z0-9]/.test(val)) {
      setPasswordError('Password must contain uppercase, lowercase, numbers, and special characters.');
    } else {
      setPasswordError(null);
    }
  };

  const handleConfirmChange = (val: string) => {
    setConfirmPassword(val);
    if (!val) {
      setConfirmError('Please confirm your password.');
    } else if (password !== val) {
      setConfirmError('Passwords do not match.');
    } else {
      setConfirmError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;
    if (!name.trim()) {
      setNameError('Full name is required.');
      hasError = true;
    }
    if (!email) {
      setEmailError('Email address is required.');
      hasError = true;
    }
    if (!department) {
      setDepartmentError('Department selection is required.');
      hasError = true;
    }
    if (!semester) {
      setSemesterError('Semester selection is required.');
      hasError = true;
    }
    if (!password) {
      setPasswordError('Password is required.');
      hasError = true;
    }
    if (!confirmPassword) {
      setConfirmError('Please confirm your password.');
      hasError = true;
    }

    if (hasError || emailError || departmentError || semesterError || passwordError || confirmError) {
      toast.warning('Please correct all validation errors before submitting.');
      return;
    }

    setLocalLoading(true);
    try {
      const userProfile = await registerWithEmail(email, password, name, 'student', undefined, department, semester);
      toast.success('Student account created successfully.');
      toast.info('Redirecting to login...');
      setUser(userProfile);
      setTimeout(() => {
        navigate('/student/dashboard');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      if (err.message && (err.message.includes('already exists') || err.message.includes('duplicate'))) {
        toast.error('An account with this email already exists.');
      } else if (!navigator.onLine) {
        toast.error('No internet connection detected.');
      } else if (err.message && (err.message.includes('fetch') || err.message.includes('network') || err.message.includes('ECONNREFUSED'))) {
        toast.error('Server is temporarily unavailable.');
      } else {
        toast.error('Unable to create account. Please try again later.');
      }
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.12) 0%, rgba(6, 182, 212, 0.03) 90.2%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <LoadingOverlay open={localLoading} message="Creating your account..." />
      <Container maxWidth="xs">
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" className="gradient-text" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.025em' }}>
            Student Register
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create your new student account instantly
          </Typography>
        </Box>

        <Card elevation={0} className="glass-panel" sx={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <CardContent sx={{ p: 4 }}>
            <form onSubmit={handleSubmit} noValidate>
              <TextField
                fullWidth
                label="Full Name"
                type="text"
                margin="normal"
                variant="outlined"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                error={!!nameError}
                helperText={nameError}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                disabled={localLoading}
                required
              />

              <TextField
                fullWidth
                label="Email Address"
                type="email"
                margin="normal"
                variant="outlined"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                error={!!emailError}
                helperText={emailError}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                disabled={localLoading}
                required
              />

              <TextField
                fullWidth
                select
                label="Department"
                margin="normal"
                variant="outlined"
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  setDepartmentError(null);
                }}
                error={!!departmentError}
                helperText={departmentError}
                disabled={localLoading}
                required
              >
                <MenuItem value="Computer Engineering">Computer Engineering</MenuItem>
                <MenuItem value="Mechanical Engineering">Mechanical Engineering</MenuItem>
                <MenuItem value="Civil Engineering">Civil Engineering</MenuItem>
                <MenuItem value="Chemical Engineering">Chemical Engineering</MenuItem>
                <MenuItem value="Information Technology">Information Technology</MenuItem>
                <MenuItem value="Electronics Engineering">Electronics Engineering</MenuItem>
                <MenuItem value="Electrical Engineering">Electrical Engineering</MenuItem>
              </TextField>

              <TextField
                fullWidth
                select
                label="Semester"
                margin="normal"
                variant="outlined"
                value={semester}
                onChange={(e) => {
                  setSemester(e.target.value);
                  setSemesterError(null);
                }}
                error={!!semesterError}
                helperText={semesterError}
                disabled={localLoading}
                required
              >
                <MenuItem value="Semester 1">Semester 1</MenuItem>
                <MenuItem value="Semester 2">Semester 2</MenuItem>
                <MenuItem value="Semester 3">Semester 3</MenuItem>
                <MenuItem value="Semester 4">Semester 4</MenuItem>
                <MenuItem value="Semester 5">Semester 5</MenuItem>
                <MenuItem value="Semester 6">Semester 6</MenuItem>
                <MenuItem value="Semester 7">Semester 7</MenuItem>
                <MenuItem value="Semester 8">Semester 8</MenuItem>
              </TextField>

              <TextField
                fullWidth
                label="Password"
                type="password"
                margin="normal"
                variant="outlined"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                error={!!passwordError}
                helperText={passwordError}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                disabled={localLoading}
                required
              />

              <PasswordStrengthBar passwordVal={password} />

              <TextField
                fullWidth
                label="Confirm Password"
                type="password"
                margin="normal"
                variant="outlined"
                value={confirmPassword}
                onChange={(e) => handleConfirmChange(e.target.value)}
                error={!!confirmError}
                helperText={confirmError}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                disabled={localLoading}
                required
              />

              <Button
                fullWidth
                variant="contained"
                color="primary"
                type="submit"
                size="large"
                disabled={localLoading || !!nameError || !!emailError || !!departmentError || !!semesterError || !department || !semester || !!passwordError || !!confirmError}
                sx={{ mt: 3, mb: 2, height: 48, fontWeight: 600 }}
              >
                {localLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link to="/" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.85rem' }}>
                ← Back to Portals
              </Link>
              <Link to="/student/login" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
                Already registered? Sign In
              </Link>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};
