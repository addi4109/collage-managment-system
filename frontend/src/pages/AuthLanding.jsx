import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Card, Grid, Button, IconButton, useTheme, Tooltip } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
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
      role: 'hod',
      title: 'HOD Portal',
      description: 'Oversee department faculty, manage students, view reports, approve applications, and handle academic processes.',
      icon: <PersonIcon sx={{ fontSize: 48 }} />, // can be updated later
      gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
      glowColor: 'rgba(245, 158, 11, 0.5)',
      btnColor: '#f59e0b',
    },

    {
      role: 'principal',
      title: 'Principal Portal',
      description: 'Super admin access to all departments, oversee college analytics, create and manage HODs, and monitor all activities.',
      icon: <AdminPanelSettingsIcon sx={{ fontSize: 48 }} />, // can be updated later
      gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)',
      glowColor: 'rgba(236, 72, 153, 0.5)',
      btnColor: '#ec4899',
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: isDark ? '#0f172a' : '#f9fafb',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        py: 4,
      }}
    >
      {/* background */}
      {/* Librarian Login Icon - Top Right, left of dark mode toggle */}
      <Tooltip title="Librarian Login" placement="bottom">
        <IconButton
          onClick={() => navigate('/login/librarian')}
          sx={{
            position: 'absolute',
            top: { xs: 16, sm: 24 },
            right: { xs: 72, sm: 80 },
            zIndex: 1000,
            bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            backdropFilter: 'blur(12px)',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            color: isDark ? '#f97316' : '#ea580c',
            width: 48,
            height: 48,
            transition: 'all 0.3s ease',
            '&:hover': {
              bgcolor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.1)',
              transform: 'scale(1.08)',
            },
          }}
        >
          <LibraryBooksIcon />
        </IconButton>
      </Tooltip>

      {/* Dark Mode Toggle Button - Top Right */}
      <IconButton
        onClick={toggleTheme}
        sx={{
          position: 'absolute',
          top: { xs: 16, sm: 24 },
          right: { xs: 16, sm: 24 },
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

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1, pt: { xs: 6, sm: 0 }, px: { md: 4 } }}>
        {/* Title Section */}
        <Box sx={{ textAlign: 'center', mb: { xs: 4, sm: 6, md: 8 }, mt: { xs: 2, sm: 0 } }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              fontStyle: 'normal',
              mb: 2,
              letterSpacing: '-0.01em',
              color: isDark ? '#e5e7eb' : '#111827',
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
            }}
          >
            EduTech Hub
          </Typography>
          <Typography
              variant="h6"
              sx={{
                fontWeight: 400,
                color: isDark ? '#9ca3af' : '#4b5563',
                maxWidth: 600,
                mx: 'auto',
                px: { xs: 2, sm: 0 },
                fontSize: { xs: '0.9rem', sm: '1rem', md: '1.05rem' },
              }}
            >
              Unified Management Portal for Students, Instructors, and Administrators
            </Typography>
        </Box>

        {/* Portal Cards */}
          <Grid container spacing={{ xs: 2, sm: 3 }} justifyContent="center" sx={{ maxWidth: '1400px', mx: 'auto', px: { xs: 1, sm: 0 } }}>
          {portals.map((portal) => (
            <Grid item xs={12} sm={6} md={3} key={portal.role}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: '12px',
                  background: isDark ? '#1e293b' : '#ffffff',
                  border: '1px solid',
                  borderColor: isDark ? '#334155' : '#e5e7eb',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'box-shadow 0.2s ease',
                  cursor: 'default',
                  '&:hover': {
                    boxShadow: isDark
                      ? '0 4px 12px rgba(0,0,0,0.3)'
                      : '0 4px 12px rgba(0,0,0,0.05)',
                  },
                }}
              >
                <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', height: '100%' }}>
                  {/* Icon Container */}
                  <Box
                    sx={{
                      mb: 3,
                      width: 56,
                      height: 56,
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isDark ? '#334155' : '#f3f4f6',
                      color: isDark ? '#e5e7eb' : '#374151',
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
                      py: 1.25,
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      background: isDark ? '#4f46e5' : '#4f46e5',
                      textTransform: 'none',
                      boxShadow: 'none',
                      '&:hover': {
                        background: '#4338ca',
                        boxShadow: 'none',
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
