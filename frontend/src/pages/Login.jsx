import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Box, Card, Container, Typography, TextField, Button, CircularProgress, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Captcha from '../components/Captcha';

export default function Login({ mode, toggleTheme }) {
  const { role } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();
  const isDark = mode === 'dark';

  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [captchaValue, setCaptchaValue] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  
  const [submitting, setSubmitting] = useState(false);

  const isStudent = role === 'student';

  const roleColors = {
    student: { gradient: 'linear-gradient(135deg, #6366f1, #06b6d4)', glow: 'rgba(99, 102, 241, 0.3)' },
    faculty: { gradient: 'linear-gradient(135deg, #10b981, #06b6d4)', glow: 'rgba(16, 185, 129, 0.3)' },
    hod: { gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)', glow: 'rgba(245, 158, 11, 0.3)' },
    principal: { gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)', glow: 'rgba(236, 72, 153, 0.3)' },
    librarian: { gradient: 'linear-gradient(135deg, #f97316, #eab308)', glow: 'rgba(249, 115, 22, 0.3)' },
  };

  const colors = roleColors[role] || roleColors.student;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!captchaValue) {
      return showToast('Please enter the CAPTCHA code.', 'warning');
    }

    setSubmitting(true);
    try {
      await login(credential, password, role, captchaToken, captchaValue);
      showToast('Logged in successfully.', 'success');
      navigate('/dashboard');
    } catch (err) {
      showToast(err.response?.data?.message || 'Login failed. Invalid credentials.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: isDark ? '#0f172a' : '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* background */}

      {/* Back to portal selection */}
      <IconButton
        component={Link}
        to="/portal"
        sx={{
          position: 'absolute',
          top: { xs: 16, sm: 24 },
          left: { xs: 16, sm: 24 },
          bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
          backdropFilter: 'blur(12px)',
          border: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          color: isDark ? '#94A3B8' : '#475569',
          '&:hover': {
            bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
          },
        }}
      >
        <ArrowBackIcon />
      </IconButton>

      {/* Dark Mode Toggle */}
      <IconButton
        onClick={toggleTheme}
        sx={{
          position: 'absolute',
          top: { xs: 16, sm: 24 },
          right: { xs: 16, sm: 24 },
          bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
          backdropFilter: 'blur(12px)',
          border: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
          color: isDark ? '#f59e0b' : '#6366f1',
          width: 44,
          height: 44,
          transition: 'all 0.3s ease',
          '&:hover': {
            bgcolor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.1)',
            transform: 'rotate(20deg) scale(1.08)',
          },
        }}
      >
        {isDark ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>

      <Container sx={{ position: 'relative', zIndex: 1, width: 480, maxWidth: '100%', mx: 'auto', px: { xs: 2, sm: 3 } }}>
        <Card
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: '12px',
            background: isDark ? '#1e293b' : '#ffffff',
            border: '1px solid',
            borderColor: isDark ? '#334155' : '#e5e7eb',
            boxShadow: isDark
              ? '0 4px 12px rgba(0,0,0,0.3)'
              : '0 4px 12px rgba(0,0,0,0.05)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 1,
              textTransform: 'capitalize',
              color: isDark ? '#e5e7eb' : '#111827',
            }}
          >
            {role} Portal
          </Typography>
          <Typography variant="body2" sx={{ color: isDark ? '#9ca3af' : '#4b5563', mb: 4 }}>
            Enter your credentials and solve the CAPTCHA to continue.
          </Typography>

          <form onSubmit={handleLoginSubmit}>
            <TextField
              fullWidth
              required
              label={isStudent ? 'Enrollment Number' : 'Username or Email'}
              placeholder={isStudent ? 'e.g. EN12345' : 'e.g. admin@edutech.com'}
              value={credential}
              onChange={(e) => setCredential(e.target.value)}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              required
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 1 }}
            />

            {/* Captcha module challenge */}
            <Captcha
              onCaptchaLoaded={setCaptchaToken}
              value={captchaValue}
              onChange={setCaptchaValue}
            />

            <Button
              fullWidth
              size="large"
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{
                mt: 3,
                height: 48,
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontWeight: 600,
                background: '#4f46e5',
                boxShadow: 'none',
                '&:hover': {
                  background: '#4338ca',
                  boxShadow: 'none',
                },
              }}
            >
              {submitting ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </form>
        </Card>
      </Container>
    </Box>
  );
}
