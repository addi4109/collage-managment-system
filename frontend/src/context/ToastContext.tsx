import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

interface ToastContextType {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<AlertColor>('info');

  const showToast = useCallback((msg: string, sev: AlertColor) => {
    setMessage(msg);
    setSeverity(sev);
    setOpen(true);
  }, []);

  const success = useCallback((msg: string) => showToast(msg, 'success'), [showToast]);
  const error = useCallback((msg: string) => showToast(msg, 'error'), [showToast]);
  const warning = useCallback((msg: string) => showToast(msg, 'warning'), [showToast]);
  const info = useCallback((msg: string) => showToast(msg, 'info'), [showToast]);

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  return (
    <ToastContext.Provider value={{ success, error, warning, info }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ mt: 7 }}
      >
        <Alert
          onClose={handleClose}
          severity={severity}
          variant="filled"
          elevation={6}
          sx={{
            width: '100%',
            borderRadius: 2,
            fontWeight: 600,
            color: '#fff',
            '&.MuiAlert-filledSuccess': { bgcolor: '#10b981' },
            '&.MuiAlert-filledError': { bgcolor: '#ef4444' },
            '&.MuiAlert-filledWarning': { bgcolor: '#f59e0b' },
            '&.MuiAlert-filledInfo': { bgcolor: '#3b82f6' },
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
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
