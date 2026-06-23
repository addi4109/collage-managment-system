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
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import { loginWithEmail } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LoadingOverlay } from '../components/LoadingOverlay';

export const StudentLogin: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, setUser, loading, setLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    if (user) {
      navigate('/student/dashboard');
    }
  }, [user, navigate]);

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
    if (!val) {
      setPasswordError('Password is required.');
    } else {
      setPasswordError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    let hasError = false;
    if (!email) {
      setEmailError('Email address is required.');
      hasError = true;
    }
    if (!password) {
      setPasswordError('Password is required.');
      hasError = true;
    }

    if (hasError || emailError || passwordError) {
      toast.warning('Please correct all validation errors.');
      return;
    }

    setLoading(true);
    try {
      const userProfile = await loginWithEmail(email, password, rememberMe, 'student');
      setUser(userProfile);
      toast.success('Login successful. Redirecting to Student Dashboard...');
      setTimeout(() => {
        navigate('/student/dashboard');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.message || '';
      
      if (errMsg.includes('pending') || errMsg.includes('approval')) {
        toast.error('Your account is pending administrator approval.');
      } else if (errMsg.includes('rejected')) {
        toast.error('Your account request has been rejected.');
      } else if (errMsg.includes('suspended')) {
        toast.error('Your account has been suspended. Contact administration.');
      } else if (err.status === 401 || errMsg.includes('credentials') || errMsg.includes('password') || errMsg.includes('found') || errMsg.includes('Invalid')) {
        toast.error('Invalid email or password.');
      } else if (!navigator.onLine) {
        toast.error('No internet connection detected.');
      } else if (errMsg.includes('fetch') || errMsg.includes('network') || errMsg.includes('ECONNREFUSED')) {
        toast.error('Server is temporarily unavailable.');
      } else {
        toast.error('Unable to sign in. Please try again later.');
      }
    } finally {
      setLoading(false);
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
      <LoadingOverlay open={loading} message="Signing in..." />
      <Container maxWidth="xs">
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" className="gradient-text" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.025em' }}>
            Student Login
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Access your course syllabi, assignments, and grades
          </Typography>
        </Box>

        <Card elevation={0} className="glass-panel" sx={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <CardContent sx={{ p: 4 }}>
            <form onSubmit={handleSubmit} noValidate>
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

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, mb: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      color="primary"
                      size="small"
                    />
                  }
                  label={<Typography variant="body2" color="text.secondary">Remember Me</Typography>}
                />
              </Box>

              <Button
                fullWidth
                variant="contained"
                color="primary"
                type="submit"
                size="large"
                disabled={loading || !!emailError || !!passwordError}
                sx={{ mb: 2, height: 48, fontWeight: 600 }}
              >
                Log In
              </Button>
            </form>

            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'center' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <Link to="/" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.85rem' }}>
                  ← Back to Portals
                </Link>
                <Link to="/student/register" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
                  Register Account
                </Link>
              </Box>
              <Link to="/forgot-password" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
                Forgot Password?
              </Link>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};
