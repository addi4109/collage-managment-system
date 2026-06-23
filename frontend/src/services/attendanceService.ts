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

export const getAttendanceRecords = async (studentId?: string, date?: string, sessionId?: string) => {
  let url = `${API_URL}/attendance/records`;
  const params = new URLSearchParams();
  if (studentId) params.append('studentId', studentId);
  if (date) params.append('date', date);
  if (sessionId) params.append('sessionId', sessionId);
  
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

export interface SessionDetails {
  _id: string;
  facultyId: string;
  facultyName: string;
  courseName: string;
  sessionTitle: string;
  department?: string;
  date: string;
  startTime: string;
  duration: number;
  description?: string;
  status: 'created' | 'active' | 'ended';
  sessionToken?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionAttendanceRecord {
  studentId: string;
  studentName: string;
  rollNumber: string;
  checkInTime: string;
  status: 'Present' | 'Absent';
}

export interface SessionAttendanceResponse {
  session: SessionDetails;
  presentStudents: SessionAttendanceRecord[];
  totalPresent: number;
}

export const getFacultySessions = async (): Promise<SessionDetails[]> => {
  const res = await fetch(`${API_URL}/attendance/sessions/faculty`, {
    method: 'GET',
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch faculty sessions.');
  }
  return data;
};

export const getSessionAttendance = async (sessionId: string): Promise<SessionAttendanceResponse> => {
  const res = await fetch(`${API_URL}/attendance/session/${sessionId}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch session attendance.');
  }
  return data;
};

export const checkInStudent = async (sessionToken: string) => {
  const res = await fetch(`${API_URL}/attendance/checkin`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ sessionToken }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to check-in student.');
  }
  return data;
};
