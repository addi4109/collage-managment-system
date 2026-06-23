import { UserProfile } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('eh_token') || sessionStorage.getItem('eh_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const getUserProfile = async (uid?: string): Promise<UserProfile | null> => {
  if (uid) {
    // Keep parameter for signature compatibility
  }
  const token = localStorage.getItem('eh_token') || sessionStorage.getItem('eh_token');
  if (!token) return null;

  try {
    const res = await fetch(`${API_URL}/users/profile`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('eh_token');
        sessionStorage.removeItem('eh_token');
      }
      return null;
    }
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const createUserProfile = async (
  uid: string,
  email: string,
  name: string,
  role: any,
  additionalData: any = {}
): Promise<UserProfile> => {
  return {
    uid,
    email,
    name,
    role,
    status: 'active',
    ...additionalData,
  };
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
  if (uid) {
    // Keep parameter for signature compatibility
  }
  try {
    await fetch(`${API_URL}/users/profile`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
  }
};
