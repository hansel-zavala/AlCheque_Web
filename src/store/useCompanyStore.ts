import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Company {
  id: string;
  name: string;
  rfc?: string | null;
  currency: string;
  role?: string;
}

interface CompanyState {
  activeCompany: Company | null;
  setActiveCompany: (company: Company) => void;
  clearActiveCompany: () => void;
}

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set) => ({
      activeCompany: null,
      setActiveCompany: (company) => set({ activeCompany: company }),
      clearActiveCompany: () => set({ activeCompany: null }),
    }),
    {
      name: 'alcheque-company-storage', 
      storage: createJSONStorage(() => localStorage), 
    }
  )
);
