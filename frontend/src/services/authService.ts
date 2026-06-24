import { UserProfile, UserRole } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'https://collage-managment-system.onrender.com/api';

const getHeaders = () => {
  const token = localStorage.getItem('eh_token') || sessionStorage.getItem('eh_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const loginWithEmail = async (
  email: string,
  password: string,
  rememberMe = true,
  role?: UserRole,
  department?: string
): Promise<UserProfile> => {
  const resolvedRole = role || (email.includes('admin') ? 'admin' : email.includes('faculty') ? 'faculty' : 'student');
  const endpoint = `${API_URL}/auth/login-${resolvedRole}`;
  
  const body: any = { email, password };
  if (resolvedRole === 'faculty' && department) {
    body.department = department;
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.message || 'Login failed. Please verify credentials.');
  }

  if (data.token) {
    if (rememberMe) {
      localStorage.setItem('eh_token', data.token);
      sessionStorage.removeItem('eh_token');
    } else {
      sessionStorage.setItem('eh_token', data.token);
      localStorage.removeItem('eh_token');
    }
  }

  // Map minimal backend user details to full frontend UserProfile schema
  const mappedUser: UserProfile & { id?: string; department?: string; semester?: string; departments?: string[]; activeDepartment?: string } = {
    uid: data.user.id || data.user.uid || '',
    id: data.user.id || data.user.uid || '',
    name: data.user.name || '',
    role: (data.user.role || resolvedRole) as UserRole,
    email: email, // Copy local login email input
    status: 'active',
    department: data.user.department || '',
    semester: data.user.semester || '',
    departments: data.user.departments || [],
    activeDepartment: data.user.activeDepartment || '',
    assignedSemesters: data.user.assignedSemesters || [],
    assignedSubjects: data.user.assignedSubjects || [],
  };

  try {
    const localUsersStr = localStorage.getItem('eh_users');
    const localUsers = localUsersStr ? JSON.parse(localUsersStr) : [];
    if (!localUsers.some((u: any) => u.uid === mappedUser.uid)) {
      localUsers.push(mappedUser);
      localStorage.setItem('eh_users', JSON.stringify(localUsers));
    }
  } catch (e) {
    console.error('Error syncing user to mock database:', e);
  }

  return mappedUser;
};

export const registerWithEmail = async (
  email: string,
  password: string,
  name: string,
  role: UserRole,
  authCode?: string,
  department?: string,
  semester?: string
): Promise<UserProfile> => {
  if (role === 'admin') {
    throw new Error('Public registration of administrators is disabled.');
  }

  const endpoint = role === 'faculty' 
    ? `${API_URL}/auth/register-faculty` 
    : `${API_URL}/auth/register-student`;

  const body: any = { name, email, password };
  if (role === 'faculty') {
    body.authCode = authCode;
    body.department = department;
    body.departmentSecretCode = authCode;
  } else if (role === 'student') {
    body.department = department;
    body.semester = semester;
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.message || 'Registration failed.');
  }

  // For faculty: registration creates a PENDING account (no token returned).
  // Faculty must wait for admin approval and then log in manually.
  // Do NOT store any token or auto-login for faculty registrations.
  if (role === 'faculty') {
    // Clear any stale token that might exist from a previous session
    localStorage.removeItem('eh_token');
    sessionStorage.removeItem('eh_token');
    return data.user;
  }

  if (data.token) {
    localStorage.setItem('eh_token', data.token);
    sessionStorage.removeItem('eh_token');
  }

  try {
    const localUsersStr = localStorage.getItem('eh_users');
    const localUsers = localUsersStr ? JSON.parse(localUsersStr) : [];
    if (!localUsers.some((u: any) => u.uid === data.user.uid)) {
      localUsers.push(data.user);
      localStorage.setItem('eh_users', JSON.stringify(localUsers));
    }
  } catch (e) {
    console.error('Error syncing user to mock database:', e);
  }

  return data.user;
};

export const getFacultyDepartments = async (): Promise<{ departments: string[]; activeDepartment: string }> => {
  const res = await fetch(`${API_URL}/auth/faculty/departments`, {
    method: 'GET',
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch departments.');
  }
  return data;
};

export const updateActiveDepartment = async (department: string): Promise<any> => {
  const res = await fetch(`${API_URL}/auth/faculty/active-department`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ department }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to update active department.');
  }
  return data;
};

export const logoutUser = async (): Promise<void> => {
  try {
    const token = localStorage.getItem('eh_token') || sessionStorage.getItem('eh_token');
    if (token) {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: getHeaders(),
      });
    }
  } catch (error) {
    console.error('Logout request error:', error);
  } finally {
    localStorage.removeItem('eh_token');
    sessionStorage.removeItem('eh_token');
  }
};

export const resetPassword = async (email: string): Promise<void> => {
  const res = await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to request password reset link.');
  }
};
