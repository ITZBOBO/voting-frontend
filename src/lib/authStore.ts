import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  matricNo: string;
  fullName: string;
  schoolEmail?: string | null;
  departmentId: string | null;
  department: string | null;
  roles: string[]; // e.g. ["voter"], ["admin"], ["super_admin"]
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setHydrated: () => void;
  login: (token: string, user: User) => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isHydrated: false,

      setHydrated: () => set({ isHydrated: true }),

      login: (token: string, user: User) => {
        set({ token, user, isAuthenticated: true });
        document.cookie = `runsa-auth=true; path=/; max-age=${60 * 60 * 24 * 7}`;
      },

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false });
        document.cookie = "runsa-auth=; path=/; max-age=0";
      },

      hasRole: (role: string) => {
        const user = get().user;
        if (!user) return false;
        return user.roles.includes(role.toLowerCase());
      },

      isAdmin: () => {
        const user = get().user;
        if (!user) return false;
        return (
          user.roles.includes("admin") || user.roles.includes("super_admin")
        );
      },
    }),
    {
      name: "runsa-auth",
      onRehydrateStorage: () => (state) => {
        if (state) state.setHydrated();
      },
    }
  )
);
