import { useState, useEffect, useCallback } from "react";
import apiClient from "@/config/api.client";
import * as endpoints from "@/config/auth.endpoints";
import type { AuthUser, LoginResponse } from "@/types/auth.types";

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch current user (Me)
  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      const { data } = await apiClient.get<AuthUser>(
        endpoints.AUTH_ME_ENDPOINT,
      );
      setUser(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load user");
      localStorage.removeItem("token"); // Clear bad token
    } finally {
      setLoading(false);
    }
  }, []);

  // Load user on mount
  useEffect(() => {
    if (!localStorage.getItem("token")) return;

    fetchUser();
  }, []); // Empty dependency array - run only once on mount

  // Login Function
  const login = async (personal_number: string, password: string) => {
    setLoading(true);
    try {
      const { data } = await apiClient.post<LoginResponse>(
        endpoints.AUTH_LOGIN_ENDPOINT,
        {
          personal_number,
          password,
        },
      );

      if (data.success) {
        localStorage.setItem("token", data.token);
        setUser(data.user);
        setError(null);
        return true;
      }
      return false;
    } catch (err: any) {
      const msg = err.response?.data?.error || "Login failed";
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout Function
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    window.location.href = "/login";
  };

  // Change Password Function
  const changePassword = async (newPassword: string) => {
    setLoading(true);
    try {
      const { data } = await apiClient.post(endpoints.AUTH_CHANGE_PASSWORD_ENDPOINT, {
        new_password: newPassword,
      });

      if (data.success) {
        // Refresh user data to update must_change_password flag
        await fetchUser();
        return true;
      }
      return false;
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to change password";
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, error, login, logout, fetchUser, changePassword };
};
