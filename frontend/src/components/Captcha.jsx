import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, IconButton, Typography, CircularProgress } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { api } from '../context/AuthContext';

export default function Captcha({ onCaptchaLoaded, value, onChange }) {
  const [captchaText, setCaptchaText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const canvasRef = useRef(null);

  const fetchCaptcha = async () => {
    setLoading(true);
    setError(false);
    onChange(''); // clear previous answer
    try {
      const res = await api.get('/auth/captcha');
      setCaptchaText(res.data.captchaText);
      onCaptchaLoaded(res.data.captchaToken);
    } catch (err) {
      console.error('Failed to load CAPTCHA:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Draw distorted text on canvas
  useEffect(() => {
    if (!captchaText || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Background with subtle noise
    ctx.fillStyle = '#0d1225';
    ctx.fillRect(0, 0, width, height);

    // Draw noise dots
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = `rgba(${Math.random() * 100 + 50}, ${Math.random() * 100 + 50}, ${Math.random() * 150 + 100}, ${Math.random() * 0.3 + 0.1})`;
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw interference lines
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = `rgba(${Math.random() * 100 + 80}, ${Math.random() * 100 + 80}, ${Math.random() * 150 + 100}, ${Math.random() * 0.25 + 0.1})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.bezierCurveTo(
        Math.random() * width, Math.random() * height,
        Math.random() * width, Math.random() * height,
        Math.random() * width, Math.random() * height
      );
      ctx.stroke();
    }

    // Draw each character with slight rotation and varied positioning
    const colors = ['#818CF8', '#22D3EE', '#34D399', '#FBBF24', '#F87171', '#A78BFA'];
    const charWidth = width / (captchaText.length + 1.5);
    const fonts = ['bold 28px Outfit', 'bold 26px Inter', 'italic bold 27px Courier New', 'bold 29px Arial'];

    for (let i = 0; i < captchaText.length; i++) {
      ctx.save();
      const x = charWidth * (i + 0.8);
      const y = height / 2 + (Math.random() * 8 - 4);
      const angle = (Math.random() - 0.5) * 0.4; // ±0.2 radians

      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.font = fonts[Math.floor(Math.random() * fonts.length)];
      ctx.fillStyle = colors[i % colors.length];
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(captchaText[i], 0, 0);
      ctx.restore();
    }
  }, [captchaText]);

  useEffect(() => {
    fetchCaptcha();
  }, []);

  return (
    <Box sx={{ mt: 2, mb: 1 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 1.5,
          p: 1,
          bgcolor: 'rgba(11, 15, 25, 0.6)',
          borderRadius: '12px',
          border: '1px solid',
          borderColor: 'rgba(255,255,255,0.08)',
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', py: 1 }}>
            <CircularProgress size={20} />
          </Box>
        ) : error ? (
          <Typography color="error" variant="body2" sx={{ flex: 1, textAlign: 'center' }}>
            Failed to load CAPTCHA.
          </Typography>
        ) : (
          <canvas
            ref={canvasRef}
            width={220}
            height={50}
            style={{
              borderRadius: '8px',
              flex: 1,
              maxWidth: '220px',
            }}
          />
        )}
        <IconButton
          size="small"
          onClick={fetchCaptcha}
          disabled={loading}
          sx={{
            color: 'text.secondary',
            '&:hover': { color: 'primary.main' },
          }}
        >
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Box>
      <TextField
        fullWidth
        required
        label="Enter the text shown above"
        placeholder="Type the characters"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputProps={{ autoComplete: 'off', spellCheck: false }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
          },
        }}
      />
    </Box>
  );
}
