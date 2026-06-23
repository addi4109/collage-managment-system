const API_URL = import.meta.env.VITE_API_URL || 'https://collage-managment-system.onrender.com/api';

const getHeaders = () => {
  const token = localStorage.getItem('eh_token') || sessionStorage.getItem('eh_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface AttendanceRecordPayload {
  studentId: string;
  status: 'Present' | 'Absent';
}

export const getStudentsForAttendance = async () => {
  const res = await fetch(`${API_URL}/attendance/students`, {
    method: 'GET',
    headers: getHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch student directory.');
  }
  return data;
};

export const markAttendance = async (date: string, records: AttendanceRecordPayload[]) => {
  const res = await fetch(`${API_URL}/attendance/mark`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ date, records }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to submit attendance.');
  }
  return data;
};

export const getAttendanceRecords = async (studentId?: string, date?: string) => {
  let url = `${API_URL}/attendance/records`;
  const params = new URLSearchParams();
  if (studentId) params.append('studentId', studentId);
  if (date) params.append('date', date);
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const res = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch attendance history.');
  }
  return data;
};
