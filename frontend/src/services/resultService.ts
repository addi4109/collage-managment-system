const API_URL = import.meta.env.VITE_API_URL || 'https://collage-managment-system.onrender.com/api';

const getHeaders = () => {
  const token = localStorage.getItem('eh_token') || sessionStorage.getItem('eh_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface SubjectMarks {
  subjectCode: string;
  subjectName: string;
  maxMarks: number;
  obtainedMarks: number;
  grade?: string;
  status?: 'Pass' | 'Fail';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  adminRemark?: string;
}

export interface ResultPayload {
  studentId: string;
  studentName: string;
  rollNumber?: string;
  courseName?: string;
  semester?: string;
  academicYear?: string;
  subjects: SubjectMarks[];
  attendancePercentage?: number;
  internalMarksTotal?: number;
  practicalMarksTotal?: number;
  theoryMarksTotal?: number;
}

export interface ResultResponse extends ResultPayload {
  _id: string;
  facultyId: string;
  facultyName?: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  cgpa: number;
  overallGrade: string;
  overallResult: 'Pass' | 'Fail';
  status: 'draft' | 'submitted' | 'verification_pending' | 'ready_for_declaration' | 'declared';
  reviewedBy?: string;
  reviewedAt?: string;
  declaredBy?: string;
  declaredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentDropdownItem {
  studentId: string;
  studentName: string;
  studentEmail: string;
  rollNumber: string;
  department: string;
}

// Faculty service calls
export const getStudentsDropdown = async (): Promise<StudentDropdownItem[]> => {
  const res = await fetch(`${API_URL}/results/students`, {
    method: 'GET',
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to retrieve students list.');
  return data;
};

export const createResult = async (payload: ResultPayload): Promise<{ success: boolean; result: ResultResponse }> => {
  const res = await fetch(`${API_URL}/results/create`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create result.');
  return data;
};

export const updateResult = async (id: string, payload: Partial<ResultPayload>): Promise<{ success: boolean; result: ResultResponse }> => {
  const res = await fetch(`${API_URL}/results/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update result.');
  return data;
};

export const submitResult = async (id: string): Promise<{ success: boolean; result: ResultResponse }> => {
  const res = await fetch(`${API_URL}/results/${id}/submit`, {
    method: 'POST',
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to submit result.');
  return data;
};

export const getFacultyResults = async (): Promise<ResultResponse[]> => {
  const res = await fetch(`${API_URL}/results/faculty`, {
    method: 'GET',
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to load faculty results.');
  return data;
};

export const getResultById = async (id: string): Promise<ResultResponse> => {
  const res = await fetch(`${API_URL}/results/${id}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch result details.');
  return data;
};

// Admin service calls
export const getPendingResults = async (): Promise<ResultResponse[]> => {
  const res = await fetch(`${API_URL}/results/pending`, {
    method: 'GET',
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to load pending results.');
  return data;
};

export const approveSubject = async (resultId: string, subjectIndex: number): Promise<{ success: boolean; result: ResultResponse }> => {
  const res = await fetch(`${API_URL}/results/${resultId}/subject/${subjectIndex}/approve`, {
    method: 'POST',
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to approve subject.');
  return data;
};

export const rejectSubject = async (resultId: string, subjectIndex: number, remark: string): Promise<{ success: boolean; result: ResultResponse }> => {
  const res = await fetch(`${API_URL}/results/${resultId}/subject/${subjectIndex}/reject`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ remark }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to reject subject.');
  return data;
};

export const declareResult = async (id: string): Promise<{ success: boolean; result: ResultResponse }> => {
  const res = await fetch(`${API_URL}/results/${id}/declare`, {
    method: 'POST',
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to declare result.');
  return data;
};

// Student service calls
export const getStudentResults = async (): Promise<ResultResponse[]> => {
  const res = await fetch(`${API_URL}/results/student`, {
    method: 'GET',
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to retrieve your results.');
  return data;
};
