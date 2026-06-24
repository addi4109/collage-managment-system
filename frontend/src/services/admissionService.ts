const API_URL = import.meta.env.VITE_API_URL || 'https://collage-managment-system.onrender.com/api';

const getHeaders = () => {
  const token = localStorage.getItem('eh_token') || sessionStorage.getItem('eh_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface AdmissionRequest {
  _id: string;
  name: string;
  username: string;
  rollNumber: string;
  enrollmentNumber?: string;
  department: string;
  year: string;
  semester: string;
  email?: string;
  phone?: string;
  parentName?: string;
  parentMobile?: string;
  address?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdByFaculty: {
    _id: string;
    name: string;
    email: string;
  } | string;
  createdAt: string;
}

export const createAdmissionRequest = async (payload: any): Promise<{ success: boolean; message: string; admission: AdmissionRequest }> => {
  const res = await fetch(`${API_URL}/admissions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to submit admission request.');
  }
  return data;
};

export const getAdmissionRequests = async (): Promise<AdmissionRequest[]> => {
  const res = await fetch(`${API_URL}/admissions`, {
    method: 'GET',
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch admission requests.');
  }
  return data;
};

export const approveAdmissionRequest = async (id: string): Promise<{ success: boolean; message: string }> => {
  const res = await fetch(`${API_URL}/admissions/${id}/approve`, {
    method: 'POST',
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to approve admission request.');
  }
  return data;
};

export const rejectAdmissionRequest = async (id: string): Promise<{ success: boolean; message: string }> => {
  const res = await fetch(`${API_URL}/admissions/${id}/reject`, {
    method: 'POST',
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to reject admission request.');
  }
  return data;
};

export const deleteAdmissionRequest = async (id: string): Promise<{ success: boolean; message: string }> => {
  const res = await fetch(`${API_URL}/admissions/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to delete admission request.');
  }
  return data;
};
