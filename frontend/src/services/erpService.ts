const API_URL = import.meta.env.VITE_API_URL || 'https://collage-managment-system.onrender.com/api';

const getHeaders = () => {
  const token = localStorage.getItem('eh_token') || sessionStorage.getItem('eh_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ── PLACEMENT TYPINGS & API ──
export interface PlacementDrive {
  _id: string;
  companyName: string;
  jobProfile: string;
  ctcPackage: string;
  driveDate: string;
  eligibilityCriteria?: string;
  department: string;
  year: string;
  semester: string;
  eligibleStudents: string[]; // User IDs
  selectedStudents: {
    studentId: string;
    studentName: string;
    rollNumber: string;
    packageOffered: string;
  }[];
}

export const createPlacementDrive = async (payload: any): Promise<{ success: boolean; drive: PlacementDrive }> => {
  const res = await fetch(`${API_URL}/erp/placements`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create placement drive.');
  return data;
};

export const getPlacementDrives = async (): Promise<PlacementDrive[]> => {
  const res = await fetch(`${API_URL}/erp/placements`, {
    method: 'GET',
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch placement drives.');
  return data;
};

export const applyToPlacementDrive = async (driveId: string): Promise<{ success: boolean; message: string; drive: PlacementDrive }> => {
  const res = await fetch(`${API_URL}/erp/placements/${driveId}/apply`, {
    method: 'POST',
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to apply to drive.');
  return data;
};

export const updatePlacementSelections = async (driveId: string, selectedStudents: any[]): Promise<{ success: boolean; message: string; drive: PlacementDrive }> => {
  const res = await fetch(`${API_URL}/erp/placements/${driveId}/selections`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ selectedStudents }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update selection results.');
  return data;
};

// ── LIBRARY TYPINGS & API ──
export interface Book {
  _id: string;
  title: string;
  author: string;
  isbn?: string;
  category?: string;
  status: 'available' | 'issued';
  issuedTo?: string | null;
  issuedStudentName?: string;
  issuedRollNumber?: string;
  issuedDate?: string | null;
  dueDate?: string | null;
  fineAmount?: number;
}

export const addBook = async (payload: any): Promise<{ success: boolean; book: Book }> => {
  const res = await fetch(`${API_URL}/erp/library/books`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to add book to library.');
  return data;
};

export const getBooks = async (search?: string): Promise<Book[]> => {
  const queryParam = search ? `?search=${encodeURIComponent(search)}` : '';
  const res = await fetch(`${API_URL}/erp/library/books${queryParam}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch library books.');
  return data;
};

export const issueBook = async (bookId: string, rollNumber: string, days?: number): Promise<{ success: boolean; message: string; book: Book }> => {
  const res = await fetch(`${API_URL}/erp/library/books/${bookId}/issue`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ rollNumber, days }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to issue book.');
  return data;
};

export const returnBook = async (bookId: string): Promise<{ success: boolean; message: string; book: Book; finePaid: number }> => {
  const res = await fetch(`${API_URL}/erp/library/books/${bookId}/return`, {
    method: 'POST',
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to return book.');
  return data;
};

// ── FEES TYPINGS & API ──
export interface FeeRecord {
  _id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  department: string;
  year: string;
  semester: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: 'paid' | 'unpaid' | 'partial';
  paymentHistory: {
    amountPaid: number;
    transactionId: string;
    paymentMode: string;
    paymentDate: string;
  }[];
}

export const getStudentFeeDetails = async (): Promise<FeeRecord[]> => {
  const res = await fetch(`${API_URL}/erp/fees`, {
    method: 'GET',
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch fee details.');
  return data;
};

export const payFee = async (payload: { amount: number; transactionId: string; paymentMode: string }): Promise<{ success: boolean; message: string; fee: FeeRecord }> => {
  const res = await fetch(`${API_URL}/erp/fees/pay`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to submit payment.');
  return data;
};

export const setFeeStructure = async (payload: { studentId: string; totalAmount: number }): Promise<{ success: boolean; fee: FeeRecord }> => {
  const res = await fetch(`${API_URL}/erp/fees/structure`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update fee structure.');
  return data;
};

// ── ACADEMIC CALENDAR TYPINGS & API ──
export interface CalendarEvent {
  _id: string;
  title: string;
  description?: string;
  type: 'event' | 'holiday' | 'exam';
  startDate: string;
  endDate: string;
  department: string;
  year: string;
  semester: string;
}

export const addCalendarEvent = async (payload: any): Promise<{ success: boolean; event: CalendarEvent }> => {
  const res = await fetch(`${API_URL}/erp/events`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to add calendar event.');
  return data;
};

export const getCalendarEvents = async (): Promise<CalendarEvent[]> => {
  const res = await fetch(`${API_URL}/erp/events`, {
    method: 'GET',
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch calendar events.');
  return data;
};

// ── CERTIFICATES API ──
export interface CertificateDetails {
  studentName: string;
  rollNumber: string;
  enrollmentNumber: string;
  department: string;
  year: string;
  semester: string;
  type: 'bonafide' | 'leaving' | 'internship';
  verificationCode: string;
  dateGenerated: string;
  collegeName: string;
  status: string;
}

export const requestCertificate = async (type: 'bonafide' | 'leaving' | 'internship'): Promise<{ success: boolean; certificate: CertificateDetails }> => {
  const res = await fetch(`${API_URL}/erp/certificates/request`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ type }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to generate certificate.');
  return data;
};
