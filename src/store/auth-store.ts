import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Creator, Supporter } from "@/types";

interface AuthState {
  user: User | null;
  creator: Creator | null;
  supporter: Supporter | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setCreator: (creator: Creator | null) => void;
  setSupporter: (supporter: Supporter | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (walletAddress: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      creator: null,
      supporter: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setCreator: (creator) => set({ creator }),

      setSupporter: (supporter) => set({ supporter }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      login: async (walletAddress: string) => {
        set({ isLoading: true, error: null });

        try {
          // Fetch or create user based on wallet address
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ walletAddress }),
          });

          if (!response.ok) {
            throw new Error("Login failed");
          }

          const data = await response.json();

          set({
            user: data.user,
            creator: data.creator || null,
            supporter: data.supporter || null,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Login failed",
            isLoading: false,
          });
        }
      },

      logout: () => {
        set({
          user: null,
          creator: null,
          supporter: null,
          isAuthenticated: false,
          error: null,
        });
      },

      refreshUser: async () => {
        const { user } = get();
        if (!user) return;

        try {
          const response = await fetch(`/api/users/${user.id}`);
          if (response.ok) {
            const data = await response.json();
            set({
              user: data.user,
              creator: data.creator || null,
              supporter: data.supporter || null,
            });
          }
        } catch (error) {
          console.error("Failed to refresh user:", error);
        }
      },
    }),
    {
      name: "darktip-auth",
      partialize: (state) => ({
        user: state.user,
        creator: state.creator,
        supporter: state.supporter,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
