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
        background: isDark
          ? 'linear-gradient(180deg, #0B0F19 0%, #0d1225 40%, #111827 100%)'
          : 'linear-gradient(180deg, #f0f4ff 0%, #e8ecf8 40%, #f8fafc 100%)',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      {isDark && (
        <Box
          sx={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.glow.replace('0.3', '0.08')} 0%, transparent 70%)`,
            filter: 'blur(80px)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Back to portal selection */}
      <IconButton
        component={Link}
        to="/portal"
        sx={{
          position: 'absolute',
          top: 24,
          left: 24,
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
          top: 24,
          right: 24,
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

      <Container sx={{ position: 'relative', zIndex: 1, width: 480, maxWidth: '100%', mx: 'auto' }}>
        <Card
          sx={{
            p: 4,
            borderRadius: '24px',
            background: isDark
              ? 'linear-gradient(145deg, rgba(17, 24, 39, 0.9) 0%, rgba(15, 20, 35, 0.95) 100%)'
              : '#ffffff',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            boxShadow: isDark
              ? `0 20px 60px rgba(0,0,0,0.4), 0 0 40px ${colors.glow.replace('0.3', '0.05')}`
              : '0 12px 40px rgba(0,0,0,0.06)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            '&::before': isDark ? {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: colors.gradient,
              opacity: 0.7,
            } : {},
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              mb: 1,
              textTransform: 'capitalize',
              color: isDark ? '#F8FAFC' : '#0F172A',
            }}
          >
            {role} Portal
          </Typography>
          <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', mb: 4 }}>
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
                height: 52,
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: 'bold',
                background: colors.gradient,
                boxShadow: isDark ? `0 4px 20px ${colors.glow}` : `0 4px 16px ${colors.glow}`,
                '&:hover': {
                  background: colors.gradient,
                  boxShadow: isDark ? `0 8px 30px ${colors.glow}` : `0 8px 24px ${colors.glow}`,
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
