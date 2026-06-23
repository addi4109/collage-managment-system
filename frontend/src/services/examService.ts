const API_URL = import.meta.env.VITE_API_URL || 'https://collage-managment-system.onrender.com/api';

const getHeaders = () => {
  const token = localStorage.getItem('eh_token') || sessionStorage.getItem('eh_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface QuestionPayload {
  question: string;
  options: string[];
  correctAnswer: string;
  marks?: number;
}

export interface ExamPayload {
  title: string;
  courseName: string;
  duration: number;
  totalMarks: number;
  questions: QuestionPayload[];
  submitForApproval?: boolean;
}

// --- Faculty Services ---

export const createExam = async (payload: ExamPayload) => {
  const res = await fetch(`${API_URL}/exams/create`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create exam.');
  return data;
};

export const updateExam = async (id: string, payload: ExamPayload) => {
  const res = await fetch(`${API_URL}/exams/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update exam.');
  return data;
};

export const scheduleExam = async (id: string, scheduledAt: string) => {
  const res = await fetch(`${API_URL}/exams/${id}/schedule`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ scheduledAt }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to schedule exam.');
  return data;
};

export const startExam = async (id: string) => {
  const res = await fetch(`${API_URL}/exams/${id}/start`, {
    method: 'POST',
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to start exam.');
  return data;
};

export const getFacultyExams = async () => {
  const res = await fetch(`${API_URL}/exams/faculty`, {
    method: 'GET',
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch faculty exams.');
  return data;
};

export const getExamResultSummary = async (id: string) => {
  const res = await fetch(`${API_URL}/exams/result/summary/${id}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch results summary.');
  return data;
};

export const publishExamResults = async (id: string) => {
  const res = await fetch(`${API_URL}/exams/${id}/publish`, {
    method: 'POST',
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to publish results.');
  return data;
};

// --- Admin Services ---

export const getPendingExams = async () => {
  const res = await fetch(`${API_URL}/exams/pending`, {
    method: 'GET',
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch pending exams.');
  return data;
};

export const approveExam = async (id: string, comment?: string) => {
  const res = await fetch(`${API_URL}/exams/${id}/approve`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ comment }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to approve exam.');
  return data;
};

export const rejectExam = async (id: string, comment: string) => {
  const res = await fetch(`${API_URL}/exams/${id}/reject`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ comment }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to reject exam.');
  return data;
};

// --- Student Services ---

export const getAvailableExams = async () => {
  const res = await fetch(`${API_URL}/exams/available`, {
    method: 'GET',
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch available exams.');
  return data;
};

export const startExamAttempt = async (id: string) => {
  const res = await fetch(`${API_URL}/exams/${id}/start-attempt`, {
    method: 'POST',
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to start exam attempt.');
  return data;
};

export const submitExamAttempt = async (id: string, answers: { questionId: string; selectedAnswer: string }[]) => {
  const res = await fetch(`${API_URL}/exams/${id}/submit`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ answers }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to submit exam attempt.');
  return data;
};

export const getStudentResult = async (id: string) => {
  const res = await fetch(`${API_URL}/exams/result/${id}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch exam result.');
  return data;
};

// --- Proctoring Services ---

export const logProctorEvent = async (examId: string, eventType: string, severity: string) => {
  const res = await fetch(`${API_URL}/proctor/log`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ examId, eventType, severity }),
  });
  return res.json();
};

export const incrementWarning = async (
  examId: string,
  eventType: string,
  severity: string,
  answers?: { questionId: string; selectedAnswer: string }[]
) => {
  const res = await fetch(`${API_URL}/proctor/warning`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ examId, eventType, severity, answers }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update warning count.');
  return data;
};
