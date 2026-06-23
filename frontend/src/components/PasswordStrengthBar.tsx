import React from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';

interface PasswordStrengthBarProps {
  passwordVal: string;
}

export const PasswordStrengthBar: React.FC<PasswordStrengthBarProps> = ({ passwordVal }) => {
  if (!passwordVal) {
    return null;
  }

  let score = 0;
  
  const hasMinLength = passwordVal.length >= 8;
  const hasUppercase = /[A-Z]/.test(passwordVal);
  const hasLowercase = /[a-z]/.test(passwordVal);
  const hasNumber = /[0-9]/.test(passwordVal);
  const hasSpecial = /[^A-Za-z0-9]/.test(passwordVal);

  if (hasMinLength) score += 1;
  if (hasUppercase) score += 1;
  if (hasLowercase) score += 1;
  if (hasNumber) score += 1;
  if (hasSpecial) score += 1;

  const percent = (score / 5) * 100;
  let label = 'Weak';
  let color: 'error' | 'warning' | 'success' = 'error';

  if (score >= 4 && hasMinLength) {
    label = 'Strong';
    color = 'success';
  } else if (score >= 2) {
    label = 'Medium';
    color = 'warning';
  }

  return (
    <Box sx={{ mt: 1, mb: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          Password Strength:
        </Typography>
        <Typography variant="caption" color={`${color}.main`} sx={{ fontWeight: 'bold' }}>
          {label}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percent}
        color={color}
        sx={{ height: 6, borderRadius: 3 }}
      />
      <Box sx={{ mt: 0.5 }}>
        <Typography variant="caption" color={hasMinLength ? 'success.main' : 'text.secondary'} sx={{ display: 'block' }}>
          ✓ Minimum 8 characters
        </Typography>
        <Typography variant="caption" color={(hasUppercase && hasLowercase) ? 'success.main' : 'text.secondary'} sx={{ display: 'block' }}>
          ✓ Uppercase & lowercase letters
        </Typography>
        <Typography variant="caption" color={hasNumber ? 'success.main' : 'text.secondary'} sx={{ display: 'block' }}>
          ✓ At least one number
        </Typography>
        <Typography variant="caption" color={hasSpecial ? 'success.main' : 'text.secondary'} sx={{ display: 'block' }}>
          ✓ At least one special character
        </Typography>
      </Box>
    </Box>
  );
};
export default PasswordStrengthBar;
