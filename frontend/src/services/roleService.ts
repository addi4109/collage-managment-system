import { UserRole } from '../types';

export const verifyFacultyPasscode = (code: string): boolean => {
  return code === 'faculty123';
};

export const verifyAdminPasscode = (code: string): boolean => {
  return code === 'admin123';
};

export const isAuthorizedRole = (userRole: UserRole, allowedRoles?: UserRole[]): boolean => {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.includes(userRole);
};
