import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Card, CardContent, Typography, TextField, Button, Box, InputAdornment } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import { resetPassword } from '../services/authService';
import { useToast } from '../context/ToastContext';
import { LoadingOverlay } from '../components/LoadingOverlay';

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setEmailError('Email address is required.');
      return;
    }
    if (emailError) {
      toast.warning('Please correct the email validation error.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      toast.success('Password reset instructions have been sent to your email.');
      setTimeout(() => {
        navigate('/');
      }, 2500);
    } catch (err: any) {
      console.error(err);
      toast.error('Unable to send reset instructions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.1) 0%, rgba(6, 182, 212, 0.03) 90.2%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <LoadingOverlay open={loading} message="Sending password reset link..." />
      <Container maxWidth="xs">
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" className="gradient-text" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.025em' }}>
            Reset Password
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enter your email to receive recovery instructions
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

              <Button
                fullWidth
                variant="contained"
                color="primary"
                type="submit"
                size="large"
                disabled={loading || !!emailError}
                sx={{ mt: 2, mb: 2, height: 48, fontWeight: 600 }}
              >
                Send Reset Link
              </Button>
            </form>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Link to="/" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.85rem' }}>
                ← Back to Login
              </Link>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};
export default ForgotPassword;
