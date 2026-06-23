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
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import ShieldIcon from '@mui/icons-material/Shield';
import { registerWithEmail } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PasswordStrengthBar } from '../components/PasswordStrengthBar';
import { LoadingOverlay } from '../components/LoadingOverlay';

export const FacultyRegister: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, setUser, loading, setLoading, isFacultyVerified } = useAuth();

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [secretCode, setSecretCode] = useState('');
  const [secretError, setSecretError] = useState<string | null>(null);

  // Enforce memory-only verification guard
  useEffect(() => {
    if (!isFacultyVerified && !user) {
      navigate('/');
    }
  }, [isFacultyVerified, user, navigate]);

  // Validate name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!val.trim()) {
      setNameError('Full name is required.');
    } else {
      setNameError(null);
    }
  };

  // Validate email
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

  // Validate password
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

  // Validate confirm password
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

  // Validate secret code
  const handleSecretCodeChange = (val: string) => {
    setSecretCode(val);
    if (!val) {
      setSecretError('Secret access code is required.');
    } else if (val !== 'faculty123') {
      setSecretError('Invalid faculty access code.');
    } else {
      setSecretError(null);
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
    if (!password) {
      setPasswordError('Password is required.');
      hasError = true;
    }
    if (!confirmPassword) {
      setConfirmError('Please confirm your password.');
      hasError = true;
    }
    if (!secretCode) {
      setSecretError('Secret access code is required.');
      hasError = true;
    } else if (secretCode !== 'faculty123') {
      setSecretError('Invalid faculty access code.');
      hasError = true;
    }

    if (hasError || emailError || passwordError || confirmError || secretError) {
      toast.warning('Please correct all validation errors.');
      return;
    }

    setLoading(true);
    try {
      const userProfile = await registerWithEmail(email, password, name, 'faculty', secretCode);
      toast.success('Faculty account created successfully.');
      toast.info('Redirecting to login...');
      setUser(userProfile);
      setTimeout(() => {
        navigate('/faculty/dashboard');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      if (err.message && (err.message.includes('already exists') || err.message.includes('duplicate'))) {
        toast.error('Faculty account already exists.');
      } else if (!navigator.onLine) {
        toast.error('No internet connection detected.');
      } else if (err.message && (err.message.includes('fetch') || err.message.includes('network') || err.message.includes('ECONNREFUSED'))) {
        toast.error('Server is temporarily unavailable.');
      } else {
        toast.error('Unable to create faculty account.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at 10% 20%, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.03) 90.2%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <LoadingOverlay open={loading} message="Creating faculty account..." />
      <Container maxWidth="xs">
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" className="gradient-text-green" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.025em' }}>
            Faculty Register
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Register your faculty member account
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
                disabled={loading}
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
                disabled={loading}
                required
              />

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
                disabled={loading}
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
                disabled={loading}
                required
              />

              <TextField
                fullWidth
                label="Faculty Secret Code"
                type="password"
                margin="normal"
                variant="outlined"
                value={secretCode}
                onChange={(e) => handleSecretCodeChange(e.target.value)}
                error={!!secretError}
                helperText={secretError}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ShieldIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                disabled={loading}
                required
              />

              <Button
                fullWidth
                variant="contained"
                color="success"
                type="submit"
                size="large"
                disabled={loading || !!nameError || !!emailError || !!passwordError || !!confirmError || !!secretError}
                sx={{
                  mt: 3,
                  mb: 2,
                  height: 48,
                  fontWeight: 600,
                  backgroundColor: '#10b981',
                  '&:hover': {
                    backgroundColor: '#059669',
                  },
                }}
              >
                Create Faculty Account
              </Button>
            </form>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link to="/" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.85rem' }}>
                ← Back to Portals
              </Link>
              <Link to="/faculty/login" style={{ color: '#10b981', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
                Already registered? Sign In
              </Link>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};
