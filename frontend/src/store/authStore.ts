import { useAuth } from '../context/AuthContext';

export const useAuthStore = () => {
  return useAuth();
};

export default useAuthStore;
