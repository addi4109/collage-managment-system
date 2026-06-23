const API_URL = import.meta.env.VITE_API_URL || 'https://collage-managment-system.onrender.com/api';

const getHeaders = () => {
  const token = localStorage.getItem('eh_token') || sessionStorage.getItem('eh_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface SessionPayload {
  facultyName: string;
  courseName: string;
  sessionTitle: string;
  department?: string;
  date: string;
  startTime: string;
  duration: number;
  description?: string;
}

export const createSession = async (payload: SessionPayload) => {
  const res = await fetch(`${API_URL}/session/create`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to create attendance session.');
  }
  return data;
};

export const startSession = async (id: string) => {
  const res = await fetch(`${API_URL}/session/start/${id}`, {
    method: 'POST',
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to start session.');
  }
  return data;
};

export const endSession = async (id: string) => {
  const res = await fetch(`${API_URL}/session/end/${id}`, {
    method: 'POST',
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to end session.');
  }
  return data;
};

export const getSessions = async () => {
  const res = await fetch(`${API_URL}/session`, {
    method: 'GET',
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to retrieve sessions.');
  }
  return data;
};

export const checkIn = async (sessionToken: string) => {
  const res = await fetch(`${API_URL}/attendance/checkin`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ sessionToken }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to submit check-in.');
  }
  return data;
};
