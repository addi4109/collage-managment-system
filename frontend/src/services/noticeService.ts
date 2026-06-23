const API_URL = import.meta.env.VITE_API_URL || 'https://collage-managment-system.onrender.com/api';

const getHeaders = () => {
  const token = localStorage.getItem('eh_token') || sessionStorage.getItem('eh_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface NoticePayload {
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface Notice {
  _id: string;
  title: string;
  message: string;
  createdBy: string;
  createdByName: string;
  role: 'faculty' | 'admin';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

export const createNotice = async (payload: NoticePayload): Promise<Notice> => {
  const res = await fetch(`${API_URL}/notices/create`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to create notice.');
  }
  return data;
};

export const getNotices = async (): Promise<Notice[]> => {
  const res = await fetch(`${API_URL}/notices`, {
    method: 'GET',
    headers: getHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch notices.');
  }
  return data;
};

export const deleteNotice = async (id: string): Promise<{ message: string }> => {
  const res = await fetch(`${API_URL}/notices/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to delete notice.');
  }
  return data;
};
