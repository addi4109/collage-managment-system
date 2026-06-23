import React from 'react';
import { Backdrop, CircularProgress, Typography, Box } from '@mui/material';

interface LoadingOverlayProps {
  open: boolean;
  message: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ open, message }) => {
  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.drawer + 999,
        flexDirection: 'column',
        backdropFilter: 'blur(4px)',
        backgroundColor: 'rgba(15, 23, 42, 0.7)'
      }}
      open={open}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <CircularProgress color="primary" size={50} sx={{ mb: 2 }} />
        <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: '0.025em' }}>
          {message}
        </Typography>
        <Typography variant="body2" color="rgba(255, 255, 255, 0.6)" sx={{ mt: 1 }}>
          Please wait...
        </Typography>
      </Box>
    </Backdrop>
  );
};
export default LoadingOverlay;
