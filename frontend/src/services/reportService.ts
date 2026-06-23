const API_URL = import.meta.env.VITE_API_URL || 'https://collage-managment-system.onrender.com/api';

const getHeaders = () => {
  const token = localStorage.getItem('eh_token') || sessionStorage.getItem('eh_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface SubjectMarks {
  _id?: string;
  subjectName: string;
  internalMarks: number;
  externalMarks?: number | null;
  totalMarks: number;
}

export interface ReportPayload {
  studentId: string;
  courseName: string;
  month: string;
  year: number;
  totalClasses: number;
  attendedClasses: number;
  attendancePercentage: number;
  subjects: SubjectMarks[];
  remarks: string;
  performanceGrade: string;
  behaviorComment?: string;
  improvementSuggestions?: string;
}

export interface Report extends ReportPayload {
  _id: string;
  studentName: string;
  facultyId: string;
  facultyName: string;
  status: 'draft' | 'published';
  lastUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentListItem {
  _id: string;
  name: string;
  email: string;
}

export interface AttendanceStats {
  totalClasses: number;
  attendedClasses: number;
  attendancePercentage: number;
}

export const createReport = async (payload: ReportPayload): Promise<Report> => {
  const res = await fetch(`${API_URL}/reports/create`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to create report.');
  }
  return data;
};

export const updateReport = async (id: string, payload: Partial<ReportPayload>): Promise<Report> => {
  const res = await fetch(`${API_URL}/reports/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to update report.');
  }
  return data;
};

export const publishReport = async (id: string): Promise<Report> => {
  const res = await fetch(`${API_URL}/reports/publish/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to publish report.');
  }
  return data;
};

export const deleteReport = async (id: string): Promise<{ message: string }> => {
  const res = await fetch(`${API_URL}/reports/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to delete report.');
  }
  return data;
};

export const getFacultyReports = async (): Promise<Report[]> => {
  const res = await fetch(`${API_URL}/reports/faculty`, {
    method: 'GET',
    headers: getHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch faculty reports.');
  }
  return data;
};

export const getStudentReports = async (studentId: string): Promise<Report[]> => {
  const res = await fetch(`${API_URL}/reports/student/${studentId}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch student reports.');
  }
  return data;
};

export const getStudentsList = async (): Promise<StudentListItem[]> => {
  const res = await fetch(`${API_URL}/reports/students`, {
    method: 'GET',
    headers: getHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch students list.');
  }
  return data;
};

export const getAttendanceStats = async (
  studentId: string,
  month: string,
  year: number
): Promise<AttendanceStats> => {
  const res = await fetch(
    `${API_URL}/reports/attendance-stats?studentId=${studentId}&month=${month}&year=${year}`,
    {
      method: 'GET',
      headers: getHeaders(),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch attendance stats.');
  }
  return data;
};
