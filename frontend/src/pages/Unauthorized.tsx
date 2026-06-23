import React from 'react';
import { Container, Typography, Button, Box, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SecurityIcon from '@mui/icons-material/Security';

export const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
        }}
      >
        <Paper
          elevation={0}
          className="glass-panel"
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 4,
          }}
        >
          <SecurityIcon color="error" sx={{ fontSize: 80, mb: 2 }} />
          <Typography variant="h4" gutterBottom className="gradient-text" sx={{ fontWeight: 'bold' }}>
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            You do not have the credentials required to access this dashboard.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/')}
            sx={{ px: 4 }}
          >
            Go to My Home
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};
export default Unauthorized;
