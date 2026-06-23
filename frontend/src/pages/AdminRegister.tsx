import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Card, CardContent, Typography, Box, Alert, Button } from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

export const AdminRegister: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at 10% 20%, rgba(245, 158, 11, 0.08) 0%, rgba(6, 182, 212, 0.03) 90.2%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="xs">
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <AdminPanelSettingsIcon sx={{ fontSize: 60, color: '#f59e0b', mb: 2 }} />
          <Typography variant="h3" component="h1" className="gradient-text-orange" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.025em' }}>
            Admin Register
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Administrator Registration Policy
          </Typography>
        </Box>

        <Card elevation={0} className="glass-panel" sx={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Alert severity="warning" variant="outlined" sx={{ mb: 3, borderRadius: 2, textAlign: 'left' }}>
              Admin accounts can only be created by an authorized administrator.
            </Alert>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
              Public registration of administrators is disabled on this portal for security reasons. Existing administrators can create new admin accounts from within the Admin Control Console.
            </Typography>

            <Button
              fullWidth
              variant="contained"
              color="warning"
              onClick={() => navigate('/')}
              sx={{
                height: 48,
                fontWeight: 600,
                backgroundColor: '#f59e0b',
                '&:hover': {
                  backgroundColor: '#d97706',
                },
              }}
            >
              Back to Home
            </Button>

            <Box sx={{ mt: 3 }}>
              <Link to="/admin/login" style={{ color: '#f59e0b', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
                Go to Admin Login
              </Link>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};
