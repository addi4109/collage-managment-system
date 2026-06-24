import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { getUserProfile } from '../services/userService';


interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearState: () => void;
  isFacultyVerified: boolean;
  isAdminVerified: boolean;
  verifyFaculty: (code: string) => boolean;
  verifyAdmin: (code: string) => boolean;
  clearPortalVerifications: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [loading, setLoadingState] = useState(true);
  const [error, setErrorState] = useState<string | null>(null);

  const [isFacultyVerified, setIsFacultyVerified] = useState(false);
  const [isAdminVerified, setIsAdminVerified] = useState(false);

  const setUser = (user: UserProfile | null) => {
    setUserState(user);
    setLoadingState(false);
  };

  const setLoading = (loadVal: boolean) => {
    setLoadingState(loadVal);
  };

  const setError = (errVal: string | null) => {
    setErrorState(errVal);
    setLoadingState(false);
  };

  const clearState = () => {
    setUserState(null);
    setErrorState(null);
    setLoadingState(false);
  };

  const verifyFaculty = (code: string): boolean => {
    const isCorrect = code === 'faculty123';
    setIsFacultyVerified(isCorrect);
    return isCorrect;
  };

  const verifyAdmin = (code: string): boolean => {
    const isCorrect = code === 'admin123';
    setIsAdminVerified(isCorrect);
    return isCorrect;
  };

  const clearPortalVerifications = () => {
    setIsFacultyVerified(false);
    setIsAdminVerified(false);
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('eh_token') || sessionStorage.getItem('eh_token');
      if (token) {
        setLoadingState(true);
        try {
          const profile = await getUserProfile();
          if (profile) {
            setUserState(profile);
          } else {
            // Profile fetch returned null — token is invalid/expired or
            // the account is pending/rejected/suspended (403 handled in userService)
            localStorage.removeItem('eh_token');
            sessionStorage.removeItem('eh_token');
            setUserState(null);
          }
        } catch (err: any) {
          console.error('JWT session restore error:', err);
          localStorage.removeItem('eh_token');
          sessionStorage.removeItem('eh_token');
          setErrorState(err.message || 'Authentication session restore error');
          setUserState(null);
        } finally {
          setLoadingState(false);
        }
      } else {
        setUserState(null);
        setLoadingState(false);
      }
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        setUser,
        setLoading,
        setError,
        clearState,
        isFacultyVerified,
        isAdminVerified,
        verifyFaculty,
        verifyAdmin,
        clearPortalVerifications,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
