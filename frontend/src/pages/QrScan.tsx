import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  Grid,
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import { useAuthStore } from '../store/authStore';
import { checkIn } from '../services/sessionService';
import { Html5QrcodeScanner } from 'html5-qrcode';

export const QrScan: React.FC = () => {
  const { user } = useAuthStore();
  const [manualToken, setManualToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Initialize html5-qrcode scanner
  useEffect(() => {
    if (!scanning) return;

    // Short timeout to let the container render in DOM
    const timer = setTimeout(() => {
      try {
        const scanner = new Html5QrcodeScanner(
          'reader',
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          /* verbose= */ false
        );

        scannerRef.current = scanner;

        scanner.render(
          async (decodedText) => {
            // Stop scanning once code is detected
            setScanning(false);
            try {
              scanner.clear();
            } catch (err) {
              console.warn('Error clearing scanner:', err);
            }
            await handleProcessToken(decodedText);
          },
          () => {
            // Silent error log to avoid flooding console during scanning
          }
        );
      } catch (err) {
        console.error('Failed to initialize HTML5 QR scanner:', err);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (err) {
          console.warn('Cleanup scanner error:', err);
        }
      }
    };
  }, [scanning]);

  // Handle Token marking logic (shared between manual input and camera scan)
  const handleProcessToken = async (token: string) => {
    if (!user) return;
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      let sessionToken = token;
      try {
        const parsed = JSON.parse(token);
        if (parsed.sessionToken) {
          sessionToken = parsed.sessionToken;
        }
      } catch (e) {
        // Not a JSON payload, treat token as raw sessionToken
      }

      const result = await checkIn(sessionToken);
      if (result.success) {
        setSuccessMsg(
          `Success! Your attendance has been marked for: ${result.courseName} - ${result.sessionTitle}.`
        );
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Verification failed. QR code may be invalid or expired.');
      // Re-enable scanning if failed
      setScanning(true);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    handleProcessToken(manualToken.trim());
  };

  const handleResetScanner = () => {
    setSuccessMsg(null);
    setErrorMsg(null);
    setManualToken('');
    setScanning(true);
  };

  return (
    <Box sx={{ mt: 2 }} className="animate-fade-in">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800 }}>
          Check-In (Scan QR)
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Scan the lecture QR code displayed by your faculty to mark your attendance.
        </Typography>
      </Box>

      {successMsg && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={handleResetScanner}>
          {successMsg}
        </Alert>
      )}

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={handleResetScanner}>
          {errorMsg}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Side: Camera Scanner Container */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CameraAltIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Camera Scanner Viewport
                </Typography>
              </Box>
              <Divider sx={{ mb: 3, opacity: 0.08 }} />

              {successMsg ? (
                <Paper
                  sx={{
                    p: 5,
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    border: '1px dashed rgba(16, 185, 129, 0.3)',
                    borderRadius: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 280,
                  }}
                >
                  <CheckCircleOutlineIcon color="success" sx={{ fontSize: 60, mb: 1 }} />
                  <Typography variant="h6" color="success.light" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Check-In Complete
                  </Typography>
                  <Button variant="outlined" color="primary" onClick={handleResetScanner}>
                    Scan Another QR Code
                  </Button>
                </Paper>
              ) : scanning ? (
                <Box>
                  <Box
                    id="reader"
                    sx={{
                      width: '100%',
                      maxWidth: 400,
                      mx: 'auto',
                      overflow: 'hidden',
                      borderRadius: 3,
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      '& video': {
                        borderRadius: '12px !important',
                      },
                      '& #reader__scan_region': {
                        bgcolor: 'background.default',
                      },
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
                    Align the QR Code inside the scanner box. Ensure camera permissions are active.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ py: 6 }}>
                  <CircularProgress sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Processing check-in data...
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Side: Manual Check-In Override */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <QrCodeScannerIcon color="secondary" />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Manual Sandbox Bypass
                </Typography>
              </Box>
              <Divider sx={{ mb: 3, opacity: 0.08 }} />

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                If camera is not supported or if you are running in the browser simulator, copy the session hash from the generator page and paste it below:
              </Typography>

              <form onSubmit={handleManualSubmit}>
                <TextField
                  fullWidth
                  label="Session Attendance Token"
                  placeholder="session_xxxx|course_xxxx|timestamp"
                  variant="outlined"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  disabled={loading}
                  sx={{ mb: 3 }}
                  required
                />

                <Button
                  type="submit"
                  variant="outlined"
                  color="secondary"
                  fullWidth
                  disabled={loading || !manualToken.trim()}
                  startIcon={loading ? <CircularProgress size={16} /> : <QrCodeScannerIcon />}
                  sx={{ height: 44 }}
                >
                  {loading ? 'Submitting...' : 'Submit Token Manually'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
export default QrScan;
