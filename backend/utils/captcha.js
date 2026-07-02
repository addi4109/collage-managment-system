import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * Generate a random text CAPTCHA (5-6 alphanumeric characters).
 * Returns the display text and a signed JWT containing the answer.
 */
export const generateCaptcha = () => {
  // Generate random alphanumeric string (uppercase + digits, no confusing chars)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // excluded I,O,0,1 to avoid confusion
  const length = Math.random() > 0.5 ? 6 : 5;
  let captchaText = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    captchaText += chars[bytes[i] % chars.length];
  }

  // Encrypt the correct answer into a signed token expiring in 3 minutes
  const captchaToken = jwt.sign(
    { answer: captchaText },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '3m' }
  );

  return {
    captchaText,
    captchaToken,
  };
};

export const verifyCaptcha = (captchaToken, userAnswer) => {
  try {
    if (!captchaToken || userAnswer === undefined || userAnswer === null) {
      return false;
    }
    const decoded = jwt.verify(captchaToken, process.env.JWT_SECRET || 'fallback_secret');
    // Case-insensitive comparison
    return decoded.answer.toUpperCase() === String(userAnswer).toUpperCase().trim();
  } catch (err) {
    // Expired or invalid token
    return false;
  }
};
