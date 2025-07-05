import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DeliveryPartner, LoginData, RegisterData } from '@shared/schema';
import { apiRequest } from './queryClient';

interface AuthState {
  partner: DeliveryPartner | null;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updatePartner: (updates: Partial<DeliveryPartner>) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      partner: null,
      isAuthenticated: false,
      
      login: async (data: LoginData) => {
        const response = await apiRequest('POST', '/api/auth/login', data);
        const result = await response.json();
        set({ partner: result.partner, isAuthenticated: true });
      },
      
      register: async (data: RegisterData) => {
        const response = await apiRequest('POST', '/api/auth/register', data);
        const result = await response.json();
        set({ partner: result.partner, isAuthenticated: true });
      },
      
      logout: () => {
        set({ partner: null, isAuthenticated: false });
      },
      
      updatePartner: (updates: Partial<DeliveryPartner>) => {
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
  return partner ? { 'x-partner-id': partner.id.toString() } : {};
};
