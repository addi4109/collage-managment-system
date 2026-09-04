import * as authService from '../services/authService.js';
import { generateCaptcha } from '../utils/captcha.js';

export const getCaptcha = async (req, res) => {
  try {
    const captcha = generateCaptcha();
    res.status(200).json(captcha);
  } catch (err) {
    res.status(500).json({ message: 'Error generating CAPTCHA.' });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { credential, password, role, captchaToken, captchaValue } = req.body;

    if (!credential || !password || !role) {
      return res.status(400).json({ message: 'Missing login credentials.' });
    }

    const data = await authService.login({
      credential,
      password,
      role,
      captchaToken,
      captchaValue,
    });

    // Set Refresh Token as HTTP-only cookie
    res.cookie('refreshToken', data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      user: data.user,
      accessToken: data.accessToken,
    });
  } catch (err) {
    console.error('Login controller error:', err.message);
    res.status(401).json({ message: err.message });
  }
};

export const refreshSession = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required.' });
    }

    const data = await authService.refresh(refreshToken);
    res.status(200).json({ accessToken: data.accessToken });
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};

export const logoutUser = async (req, res) => {
  try {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    res.status(200).json({ message: 'Logged out successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Logout failed.' });
  }
};

export const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }
    res.status(200).json({ user: req.user });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving profile context.' });
  }
};
