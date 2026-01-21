import { create } from "zustand";
import axios from "axios";
import { API_BASE_URL } from "../utils/constant";
import { clearAllMusicCaches } from "../Data";

interface User {
  full_name: string;
  email: string;
  bio?: string;
  image?: string;
}

interface AuthStore {
  user: User | null;
  access: string | null;
  refresh: string | null;
  loading: boolean;
  error: string | null;

  register: (data: { full_name: string; email: string; password: string }) => Promise<boolean>;
  login: (data: { email: string; password: string }) => Promise<boolean>;
  logout: () => void;
  loadUser: () => void;
  updateUser: (userData: User) => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  access: localStorage.getItem("access"),
  refresh: localStorage.getItem("refresh"),
  loading: false,
  error: null,

  // -----------------------
  // Register
  // -----------------------
  register: async ({ full_name, email, password }) => {
    set({ loading: true, error: null });
    try {
      await axios.post(`${API_BASE_URL}auth/register/`, { full_name, email, password });
      set({ loading: false });
      return true;
    } catch (err: unknown) {
      let message = "Registration failed";
      if (axios.isAxiosError(err)) {
        message = (err.response?.data as any)?.detail || (err.response?.data as any)?.error || message;
      }
      set({ loading: false, error: message });
      return false;
    }
  },

  // -----------------------
  // Login
  // -----------------------
  login: async ({ email, password }) => {
    set({ loading: true, error: null });
    try {
      const res = await axios.post(`${API_BASE_URL}auth/login/`, { email, password });
      const { user, tokens } = res.data;

      // Save tokens
      localStorage.setItem("access", tokens.access);
      localStorage.setItem("refresh", tokens.refresh);
      localStorage.setItem("user", JSON.stringify(user));

      set({
        access: tokens.access,
        refresh: tokens.refresh,
        user,
        loading: false,
      });

      return true;
    } catch (err: unknown) {
      let message = "Invalid email or password";
      if (axios.isAxiosError(err)) {
        message = (err.response?.data as any)?.detail || message;
      }
      set({ loading: false, error: message });
      return false;
    }
  },

  // -----------------------
  // Logout
  // -----------------------
  logout: () => {
    // Clear auth data
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");

    // Clear all music app caches
    clearAllMusicCaches();

    set({ access: null, refresh: null, user: null, error: null });
  },

  // -----------------------
  // Load user from storage
  // -----------------------
  loadUser: () => {
    const user = localStorage.getItem("user");
    if (user) set({ user: JSON.parse(user) });
  },

  // -----------------------
  // Update user data
  // -----------------------
  updateUser: (userData: User) => {
    // Update localStorage
    localStorage.setItem("user", JSON.stringify(userData));
    
    // Update state
    set({ user: userData });
  },

  // -----------------------
  // Auth check
  // -----------------------
  isAuthenticated: () => !!get().access,
}));