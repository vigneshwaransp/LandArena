import { create } from 'zustand';

export type Language = 'en' | 'ta' | 'hi';

export interface UserSession {
  sub: string;
  email: string;
  name: string;
  role: string;
  department?: string;
}

interface AppState {
  user: UserSession | null;
  language: Language;
  isAssistantOpen: boolean;
  activeRecordId: string | null;
  notifications: any[];
  setUser: (user: UserSession | null) => void;
  setLanguage: (lang: Language) => void;
  toggleAssistant: () => void;
  setAssistantOpen: (open: boolean) => void;
  setActiveRecordId: (id: string | null) => void;
  setNotifications: (notifs: any[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: {
    sub: 'demo-admin-id',
    email: 'admin@example.com',
    name: 'Dr. S. Arumugam IAS',
    role: 'ADMIN',
    department: 'District Revenue & Land Administration'
  },
  language: 'en',
  isAssistantOpen: false,
  activeRecordId: null,
  notifications: [],
  setUser: (user) => set({ user }),
  setLanguage: (language) => set({ language }),
  toggleAssistant: () => set((state) => ({ isAssistantOpen: !state.isAssistantOpen })),
  setAssistantOpen: (isAssistantOpen) => set({ isAssistantOpen }),
  setActiveRecordId: (activeRecordId) => set({ activeRecordId }),
  setNotifications: (notifications) => set({ notifications }),
}));
