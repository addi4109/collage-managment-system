const API_URL = import.meta.env.VITE_API_URL || 'https://collage-managment-system.onrender.com/api';

const getHeaders = () => {
  const token = localStorage.getItem('eh_token') || sessionStorage.getItem('eh_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface AssignmentPayload {
  title: string;
  description: string;
  courseName: string;
  dueDate: string;
  attachment?: string; // Optional base64 Data URI
  attachmentName?: string;
}

export const createAssignment = async (payload: AssignmentPayload) => {
  const res = await fetch(`${API_URL}/assignments`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to create assignment.');
  }
  return data;
};

export const getAssignments = async () => {
  const res = await fetch(`${API_URL}/assignments`, {
    method: 'GET',
    headers: getHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch assignments.');
  }
  return data;
};
