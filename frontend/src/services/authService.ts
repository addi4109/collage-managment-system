import { UserProfile, UserRole } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('eh_token') || sessionStorage.getItem('eh_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const loginWithEmail = async (
  email: string,
  password: string,
  rememberMe = true,
  role?: UserRole
): Promise<UserProfile> => {
  const resolvedRole = role || (email.includes('admin') ? 'admin' : email.includes('faculty') ? 'faculty' : 'student');
  const endpoint = `${API_URL}/auth/login-${resolvedRole}`;
  
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.message || 'Login failed. Please verify credentials.');
  }

  if (data.token) {
    if (rememberMe) {
      localStorage.setItem('eh_token', data.token);
      sessionStorage.removeItem('eh_token');
    } else {
      sessionStorage.setItem('eh_token', data.token);
      localStorage.removeItem('eh_token');
    }
  }

  try {
    const localUsersStr = localStorage.getItem('eh_users');
    const localUsers = localUsersStr ? JSON.parse(localUsersStr) : [];
    if (!localUsers.some((u: any) => u.uid === data.user.uid)) {
      localUsers.push(data.user);
      localStorage.setItem('eh_users', JSON.stringify(localUsers));
    }
  } catch (e) {
    console.error('Error syncing user to mock database:', e);
  }

  return data.user;
};

export const registerWithEmail = async (
  email: string,
  password: string,
  name: string,
  role: UserRole,
  authCode?: string
): Promise<UserProfile> => {
  if (role === 'admin') {
    throw new Error('Public registration of administrators is disabled.');
  }

  const endpoint = role === 'faculty' 
    ? `${API_URL}/auth/register-faculty` 
    : `${API_URL}/auth/register-student`;

  const body: any = { name, email, password };
  if (role === 'faculty') {
    body.authCode = authCode;
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.message || 'Registration failed.');
  }

  if (data.token) {
    localStorage.setItem('eh_token', data.token);
    sessionStorage.removeItem('eh_token');
  }

  try {
    const localUsersStr = localStorage.getItem('eh_users');
    const localUsers = localUsersStr ? JSON.parse(localUsersStr) : [];
    if (!localUsers.some((u: any) => u.uid === data.user.uid)) {
      localUsers.push(data.user);
      localStorage.setItem('eh_users', JSON.stringify(localUsers));
    }
  } catch (e) {
    console.error('Error syncing user to mock database:', e);
  }

  return data.user;
};

export const logoutUser = async (): Promise<void> => {
  try {
    const token = localStorage.getItem('eh_token') || sessionStorage.getItem('eh_token');
    if (token) {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: getHeaders(),
      });
    }
  } catch (error) {
    console.error('Logout request error:', error);
  } finally {
    localStorage.removeItem('eh_token');
    sessionStorage.removeItem('eh_token');
  }
};

export const resetPassword = async (email: string): Promise<void> => {
  const res = await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to request password reset link.');
  }
};
