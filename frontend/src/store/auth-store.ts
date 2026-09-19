import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserProfile, UserRole } from "@/types/auth";

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: UserProfile) => void;
  updateUser: (user: Partial<UserProfile>) => void;
  logout: () => void;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setAuth: (token: string, user: UserProfile) => {
        set({
          token,
          user,
          isAuthenticated: true,
        });
      },

      updateUser: (partialUser: Partial<UserProfile>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...partialUser } });
        }
      },

      logout: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
      },

      hasRole: (allowedRoles: UserRole[]) => {
        const currentUser = get().user;
        if (!currentUser || !currentUser.role) return false;

        const currentRole = String(currentUser.role).toUpperCase();

        // Administrator bypass
        if (currentRole === "ADMIN") return true;

        return allowedRoles.some((allowed) => {
          const target = allowed.toUpperCase();
          if (currentRole === target) return true;

          // Standardize managerial aliases
          if (target === "MANAGER" && currentRole === "COLLIERY_MANAGER") return true;
          if (target === "COLLIERY_MANAGER" && currentRole === "MANAGER") return true;

          // Standardize field supervisor aliases
          if (target === "OVERMAN" && currentRole === "MINING_SIRDAR") return true;
          if (target === "MINING_SIRDAR" && currentRole === "OVERMAN") return true;

          // Standardize safety officer & gate operator aliases
          if (target === "SAFETY_OFFICER" && currentRole === "GATE_OPERATOR") return true;
          if (target === "GATE_OPERATOR" && currentRole === "SAFETY_OFFICER") return true;

          // Standardize regulatory inspector aliases
          if (target === "DGMS_INSPECTOR" && currentRole === "CORPORATE_HQ") return true;
          if (target === "CORPORATE_HQ" && currentRole === "DGMS_INSPECTOR") return true;

          return false;
        });
      },
    }),
    {
      name: "coalguard-auth-session",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
