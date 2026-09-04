import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, Slide } from '@mui/material';

const ToastContext = createContext(null);

function SlideTransition(props) {
  return <Slide {...props} direction="left" />;
}

export const ToastProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('info'); // 'success' | 'error' | 'warning' | 'info'

  const showToast = useCallback((msg, type = 'info') => {
    setMessage(msg);
    setSeverity(type);
    setOpen(true);
  }, []);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={handleClose}
        TransitionComponent={SlideTransition}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ marginTop: '64px' }}
      >
        <Alert 
          onClose={handleClose} 
          severity={severity} 
          variant="filled" 
          sx={{ 
            width: '100%', 
            borderRadius: '12px',
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 500,
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
          }}
        >
          {message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
