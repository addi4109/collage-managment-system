import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const AuthLanding: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { verifyFaculty, verifyAdmin } = useAuth();
  const [passcodeModalOpen, setPasscodeModalOpen] = useState(false);
  const [targetRole, setTargetRole] = useState<'faculty' | 'admin' | null>(null);
  const [passcode, setPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePortalClick = (role: 'student' | 'faculty' | 'admin') => {
    if (role === 'student') {
      navigate('/student/login');
    } else if (role === 'faculty') {
      navigate('/faculty/login');
    } else {
      setTargetRole(role);
      setPasscode('');
      setErrorMsg(null);
      setPasscodeModalOpen(true);
    }
  };

  const handleVerifyPasscode = () => {
    if (!targetRole) return;
    
    let isCorrect = false;
    if (targetRole === 'admin') {
      isCorrect = verifyAdmin(passcode);
    } else if (targetRole === 'faculty') {
      isCorrect = verifyFaculty(passcode);
    }
    
    if (isCorrect) {
      setPasscodeModalOpen(false);
      navigate(`/${targetRole}/login`);
    } else {
      const msg = targetRole === 'admin' ? 'Invalid admin access code.' : 'Invalid faculty access code.';
      setErrorMsg(msg);
      toast.error(msg);
    }
  };

  const portalCards = [
    {
      role: 'student' as const,
      title: 'Student Portal',
      description: 'Access academic timetables, course resources, submit homework assignments, scan attendance QR, and view report cards.',
      icon: <SchoolIcon sx={{ fontSize: 50, color: '#6366f1' }} />,
      buttonText: 'Enter Student Portal',
      color: '#6366f1',
    },
    {
      role: 'faculty' as const,
      title: 'Faculty Portal',
      description: 'Manage timetables, publish assignment tasks, evaluate student submissions, trigger class attendance QRs, and view logs.',
      icon: <WorkspacePremiumIcon sx={{ fontSize: 50, color: '#10b981' }} />,
      buttonText: 'Enter Faculty Portal',
      color: '#10b981',
    },
    {
      role: 'admin' as const,
      title: 'Admin Portal',
      description: 'Administer system resources, create timetables, adjust notice boards, manage user role configurations, and audit departments.',
      icon: <AdminPanelSettingsIcon sx={{ fontSize: 50, color: '#f59e0b' }} />,
      buttonText: 'Enter Admin Portal',
      color: '#f59e0b',
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.05) 90.2%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 6,
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ mb: 6, textAlign: 'center' }} className="animate-fade-in">
          <Typography
            variant="h2"
            component="h1"
            className="gradient-text"
            sx={{ fontWeight: 900, mb: 1, letterSpacing: '-0.025em' }}
          >
            EduTech Hub
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
            Unified Management Portal for Students, Instructors, and Administrators
          </Typography>
        </Box>

        <Grid container spacing={4} justifyContent="center" className="animate-fade-in">
          {portalCards.map((card) => (
            <Grid item xs={12} md={4} key={card.title}>
              <Card
                className="glass-panel"
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  transition: 'transform 0.3s ease, border-color 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    borderColor: `${card.color}60`,
                  },
                }}
              >
                <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', textAlign: 'center' }}>
                  <Box sx={{ p: 2, borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.03)', mb: 3 }}>
                    {card.icon}
                  </Box>
                  <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mb: 2 }}>
                    {card.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 4, flexGrow: 1, lineHeight: 1.6 }}>
                    {card.description}
                  </Typography>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => handlePortalClick(card.role)}
                    sx={{
                      height: 48,
                      fontWeight: 600,
                      backgroundColor: card.color,
                      '&:hover': {
                        backgroundColor: card.color,
                        filter: 'brightness(1.1)',
                      },
                    }}
                  >
                    {card.buttonText}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Secret Access Code Modal */}
      <Dialog
        open={passcodeModalOpen}
        onClose={() => setPasscodeModalOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            bgcolor: '#111827',
            backgroundImage: 'none',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', pb: 1, color: 'text.primary' }}>
          Secret Access Code Needed
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            To protect access to the {targetRole?.toUpperCase()} Portal, please type the required authorization secret code:
          </Typography>
          {errorMsg && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {errorMsg}
            </Alert>
          )}
          <TextField
            autoFocus
            fullWidth
            type="password"
            label="Secret Access Code"
            variant="outlined"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleVerifyPasscode();
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setPasscodeModalOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleVerifyPasscode}
            variant="contained"
            color={targetRole === 'admin' ? 'warning' : 'secondary'}
          >
            Verify Code
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
