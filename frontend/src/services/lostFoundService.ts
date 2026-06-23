const API_URL = import.meta.env.VITE_API_URL || 'https://collage-managment-system.onrender.com/api';

const getHeaders = () => {
  const token = localStorage.getItem('eh_token') || sessionStorage.getItem('eh_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface LostFoundReply {
  _id?: string;
  studentId: string;
  studentName: string;
  message: string;
  contactInfo?: string;
  createdAt: string;
}

export interface LostFoundPayload {
  title: string;
  description: string;
  type: 'lost' | 'found';
  location?: string;
  date: string;
  imageUrl?: string;
  status?: 'active' | 'resolved';
}

export interface LostFoundItem extends LostFoundPayload {
  _id: string;
  createdBy: string;
  createdByName: string;
  replies: LostFoundReply[];
  createdAt: string;
  updatedAt: string;
}

export const createLostFound = async (payload: LostFoundPayload): Promise<LostFoundItem> => {
  const res = await fetch(`${API_URL}/lostfound/create`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to create Lost & Found entry.');
  }
  return data;
};

export const getLostFound = async (): Promise<LostFoundItem[]> => {
  const res = await fetch(`${API_URL}/lostfound`, {
    method: 'GET',
    headers: getHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch Lost & Found items.');
  }
  return data;
};

export const updateLostFound = async (id: string, payload: Partial<LostFoundPayload>): Promise<LostFoundItem> => {
  const res = await fetch(`${API_URL}/lostfound/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to update Lost & Found entry.');
  }
  return data;
};

export const deleteLostFound = async (id: string): Promise<{ message: string }> => {
  const res = await fetch(`${API_URL}/lostfound/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to delete Lost & Found entry.');
  }
  return data;
};

export const addReply = async (
  id: string,
  payload: { message: string; contactInfo?: string }
): Promise<{ message: string; reply: LostFoundReply }> => {
  const res = await fetch(`${API_URL}/lostfound/reply/${id}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to submit reply.');
  }
  return data;
};

export const getReplies = async (id: string): Promise<LostFoundReply[]> => {
  const res = await fetch(`${API_URL}/lostfound/replies/${id}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch replies.');
  }
  return data;
};
