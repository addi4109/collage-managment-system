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
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import { loginWithEmail } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LoadingOverlay } from '../components/LoadingOverlay';

export const StudentLogin: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, setUser } = useAuth();

  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);
  const [localLoading, setLocalLoading] = useState(false);

  const [captchaText, setCaptchaText] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState<string | null>(null);

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result);
    setCaptchaInput('');
    setCaptchaError(null);
  };

  useEffect(() => { generateCaptcha(); }, []);

  useEffect(() => {
    if (user) navigate('/student/dashboard');
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (localLoading) return;

    let hasError = false;
    if (!username.trim()) {
      setUsernameError('Username is required.');
      hasError = true;
    }
    if (!password) {
      setPasswordError('Password is required.');
      hasError = true;
    }
    if (!captchaInput) {
      setCaptchaError('Captcha verification is required.');
      hasError = true;
    } else if (captchaInput.trim().toLowerCase() !== captchaText.toLowerCase()) {
      setCaptchaError('Incorrect captcha. Please try again.');
      generateCaptcha();
      return;
    }
    if (hasError) return;

    setLocalLoading(true);
    try {
      const userProfile = await loginWithEmail(username.trim(), password, rememberMe, 'student');
      setUser(userProfile);
      toast.success('Login successful. Welcome!');
      setTimeout(() => navigate('/student/dashboard'), 1200);
    } catch (err: any) {
      const errMsg = err.message || '';
      if (errMsg.includes('pending') || errMsg.includes('not yet active')) {
        toast.error('Your account is not yet active. Contact your faculty.');
      } else if (errMsg.includes('suspended')) {
        toast.error('Your account has been suspended. Contact administration.');
      } else {
        toast.error('Invalid username or password.');
      }
      generateCaptcha();
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
      <LoadingOverlay open={localLoading} message="Signing in..." />
      <Container maxWidth="xs">
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" className="gradient-text" sx={{ fontWeight: 800, mb: 1 }}>
            Student Login
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enter the credentials provided by your faculty
          </Typography>
        </Box>

        <Card elevation={0} className="glass-panel" sx={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <CardContent sx={{ p: 4 }}>
            <form onSubmit={handleSubmit} noValidate>
              <TextField
                fullWidth
                label="Username"
                type="text"
                margin="normal"
                variant="outlined"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setUsernameError(null); }}
                error={!!usernameError}
                helperText={usernameError}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                disabled={localLoading}
                required
                autoComplete="username"
              />

              <TextField
                fullWidth
                label="Password"
                type="password"
                margin="normal"
                variant="outlined"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(null); }}
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
                autoComplete="current-password"
              />

              {/* Captcha */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2, mb: 1 }}>
                <Box
                  sx={{
                    flexGrow: 1,
                    height: 48,
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px dashed rgba(255, 255, 255, 0.15)',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    letterSpacing: 6,
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: '#a5b4fc',
                    fontFamily: 'monospace',
                    userSelect: 'none',
                    position: 'relative',
                    overflow: 'hidden',
                    background: 'linear-gradient(45deg, rgba(99,102,241,0.1) 0%, rgba(6,182,212,0.1) 100%)',
                  }}
                >
                  <Box sx={{ position: 'absolute', width: '150%', height: 2, bgcolor: 'rgba(255,255,255,0.08)', transform: 'rotate(15deg)' }} />
                  <Box sx={{ position: 'absolute', width: '150%', height: 2, bgcolor: 'rgba(255,255,255,0.08)', transform: 'rotate(-10deg)' }} />
                  <span style={{ transform: 'rotate(-3deg)' }}>{captchaText}</span>
                </Box>
                <Button variant="outlined" onClick={generateCaptcha} sx={{ height: 48, minWidth: 80 }} disabled={localLoading}>
                  Refresh
                </Button>
              </Box>

              <TextField
                fullWidth
                label="Enter Captcha"
                variant="outlined"
                value={captchaInput}
                onChange={(e) => { setCaptchaInput(e.target.value); setCaptchaError(null); }}
                error={!!captchaError}
                helperText={captchaError}
                disabled={localLoading}
                required
                sx={{ mb: 2 }}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      color="primary"
                      size="small"
                      disabled={localLoading}
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
                disabled={localLoading || !captchaInput}
                sx={{ mb: 2, height: 48, fontWeight: 600 }}
              >
                {localLoading ? 'Signing In...' : 'Log In'}
              </Button>
            </form>

            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
              <Link to="/" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.85rem' }}>
                ← Back to Portals
              </Link>
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Don't have credentials? Contact your faculty member.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};
