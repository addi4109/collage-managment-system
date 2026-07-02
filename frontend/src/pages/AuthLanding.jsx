import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Card, Grid, Button, IconButton, useTheme } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

export default function AuthLanding({ mode, toggleTheme }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = mode === 'dark';

  const portals = [
    {
      role: 'student',
      title: 'Student Portal',
      description: 'Access academic timetables, course resources, submit homework assignments, scan attendance QR, and view report cards.',
      icon: <SchoolIcon sx={{ fontSize: 48 }} />,
      gradient: 'linear-gradient(135deg, #6366f1, #06b6d4)',
      glowColor: 'rgba(99, 102, 241, 0.5)',
      btnColor: '#6366f1',
    },
    {
      role: 'faculty',
      title: 'Faculty Portal',
      description: 'Manage timetables, publish assignment tasks, evaluate student submissions, trigger class attendance QRs, and view logs.',
      icon: <PersonIcon sx={{ fontSize: 48 }} />,
      gradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
      glowColor: 'rgba(16, 185, 129, 0.5)',
      btnColor: '#10b981',
    },
    {
      role: 'admin',
      title: 'Admin Portal',
      description: 'Administer system resources, create timetables, adjust notice boards, manage user role configurations, and audit departments.',
      icon: <AdminPanelSettingsIcon sx={{ fontSize: 48 }} />,
      gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
      glowColor: 'rgba(245, 158, 11, 0.5)',
      btnColor: '#f59e0b',
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: isDark
          ? 'linear-gradient(180deg, #0B0F19 0%, #0d1225 40%, #111827 100%)'
          : 'linear-gradient(180deg, #f0f4ff 0%, #e8ecf8 40%, #f8fafc 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        py: 4,
      }}
    >
      {/* Ambient background glow orbs */}
      {isDark && (
        <>
          <Box
            sx={{
              position: 'absolute',
              top: '-15%',
              left: '-10%',
              width: '500px',
              height: '500px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
              filter: 'blur(80px)',
              pointerEvents: 'none',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: '-20%',
              right: '-10%',
              width: '600px',
              height: '600px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)',
              filter: 'blur(100px)',
              pointerEvents: 'none',
            }}
          />
        </>
      )}
      {/* Dark Mode Toggle Button - Top Right */}
      <IconButton
        onClick={toggleTheme}
        sx={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 1000,
          bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
          backdropFilter: 'blur(12px)',
          border: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
          color: isDark ? '#f59e0b' : '#6366f1',
          width: 48,
          height: 48,
          transition: 'all 0.3s ease',
          '&:hover': {
            bgcolor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.1)',
            transform: 'rotate(20deg) scale(1.08)',
          },
        }}
      >
        {isDark ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Title Section */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              fontStyle: 'italic',
              mb: 2,
              letterSpacing: '-0.02em',
              background: isDark
                ? 'linear-gradient(135deg, #818CF8 0%, #06b6d4 50%, #22d3ee 100%)'
                : 'linear-gradient(135deg, #4F46E5 0%, #0891B2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: { xs: '2.5rem', md: '3.5rem' },
            }}
          >
            EduTech Hub
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 400,
              color: isDark ? '#94A3B8' : '#475569',
              maxWidth: 600,
              mx: 'auto',
              fontSize: { xs: '0.95rem', md: '1.15rem' },
            }}
          >
            Unified Management Portal for Students, Instructors, and Administrators
          </Typography>
        </Box>

        {/* Portal Cards */}
        <Grid container spacing={4} justifyContent="center">
          {portals.map((portal, idx) => (
            <Grid item xs={12} sm={6} md={4} key={portal.role}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: '20px',
                  background: isDark
                    ? 'linear-gradient(145deg, rgba(17, 24, 39, 0.9) 0%, rgba(15, 20, 35, 0.95) 100%)'
                    : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                  border: '1px solid',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'default',
                  animation: `fadeInUp 0.6s ${idx * 0.15}s ease-out both`,
                  '@keyframes fadeInUp': {
                    from: { opacity: 0, transform: 'translateY(30px)' },
                    to: { opacity: 1, transform: 'translateY(0)' },
                  },
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                    boxShadow: isDark
                      ? `0 20px 60px ${portal.glowColor.replace('0.5', '0.15')}, 0 0 40px ${portal.glowColor.replace('0.5', '0.08')}`
                      : `0 20px 60px rgba(0,0,0,0.08)`,
                  },
                  '&::before': isDark ? {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: portal.gradient,
                    opacity: 0.7,
                  } : {},
                }}
              >
                <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', height: '100%' }}>
                  {/* Icon Container */}
                  <Box
                    sx={{
                      mb: 3,
                      width: 80,
                      height: 80,
                      borderRadius: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isDark
                        ? `linear-gradient(135deg, ${portal.glowColor.replace('0.5', '0.15')}, ${portal.glowColor.replace('0.5', '0.05')})`
                        : `linear-gradient(135deg, ${portal.glowColor.replace('0.5', '0.1')}, ${portal.glowColor.replace('0.5', '0.03')})`,
                      border: '1px solid',
                      borderColor: isDark
                        ? portal.glowColor.replace('0.5', '0.2')
                        : portal.glowColor.replace('0.5', '0.1'),
                      color: portal.btnColor,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {portal.icon}
                  </Box>

                  {/* Title */}
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      mb: 2,
                      color: isDark ? '#F8FAFC' : '#0F172A',
                    }}
                  >
                    {portal.title}
                  </Typography>

                  {/* Description */}
                  <Typography
                    variant="body2"
                    sx={{
                      color: isDark ? '#94A3B8' : '#64748B',
                      lineHeight: 1.7,
                      mb: 4,
                      flexGrow: 1,
                    }}
                  >
                    {portal.description}
                  </Typography>

                  {/* CTA Button */}
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => navigate(`/login/${portal.role}`)}
                    sx={{
                      py: 1.5,
                      borderRadius: '12px',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      background: portal.gradient,
                      textTransform: 'none',
                      boxShadow: isDark
                        ? `0 4px 20px ${portal.glowColor.replace('0.5', '0.3')}`
                        : `0 4px 16px ${portal.glowColor.replace('0.5', '0.2')}`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: portal.gradient,
                        boxShadow: isDark
                          ? `0 8px 30px ${portal.glowColor.replace('0.5', '0.45')}`
                          : `0 8px 24px ${portal.glowColor.replace('0.5', '0.3')}`,
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    Enter {portal.title.replace(' Portal', '')} Portal
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography
            variant="caption"
            sx={{
              color: isDark ? '#475569' : '#94A3B8',
              fontSize: '0.8rem',
            }}
          >
            © {new Date().getFullYear()} EduTech Hub • Unified Campus Management Suite
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
