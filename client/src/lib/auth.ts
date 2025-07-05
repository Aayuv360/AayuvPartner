import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { IDeliveryPartner, LoginData, RegisterData } from '@shared/schema';
import { apiRequest } from './queryClient';

interface AuthState {
  partner: IDeliveryPartner | null;
  isAuthenticated: boolean;
  login: (data: LoginData | IDeliveryPartner) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updatePartner: (updates: Partial<IDeliveryPartner>) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      partner: null,
      isAuthenticated: false,
      
      login: async (data: LoginData | IDeliveryPartner) => {
        console.log('Auth store login called with:', data);
        
        // If data already contains partner info (from OTP verification), use it directly
        if ('_id' in data) {
          console.log('Setting auth state directly with partner data');
          set({ partner: data, isAuthenticated: true });
          console.log('Auth state updated, user should be logged in');
          return;
        }
        
        // Otherwise, make API call for traditional login
        console.log('Making API call for traditional login');
        const response = await apiRequest('POST', '/api/auth/login', data);
        const result = await response.json();
        set({ partner: result, isAuthenticated: true });
      },
      
      register: async (data: RegisterData) => {
        const response = await apiRequest('POST', '/api/auth/register', data);
        const result = await response.json();
        set({ partner: result, isAuthenticated: true });
      },
      
      logout: () => {
        set({ partner: null, isAuthenticated: false });
      },
      
      updatePartner: (updates: Partial<IDeliveryPartner>) => {
        const currentPartner = get().partner;
        if (currentPartner) {
          set({ partner: { ...currentPartner, ...updates } });
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

// Add auth headers to requests
export const getAuthHeaders = () => {
  const partner = useAuth.getState().partner;
  return partner ? { 'x-partner-id': partner._id.toString() } : {};
};
