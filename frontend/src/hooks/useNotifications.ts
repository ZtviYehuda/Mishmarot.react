import { useState, useEffect } from "react";
import apiClient from "@/config/api.client";
import { useAuthContext } from "@/context/AuthContext";

export interface Alert {
  id: string;
  type: "warning" | "danger" | "info";
  title: string;
  description: string;
  link: string;
}

export function useNotifications() {
  const { user } = useAuthContext();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await apiClient.get<Alert[]>("/notifications/alerts");
      setAlerts(data);
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Refresh every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  return { alerts, loading, refreshAlerts: fetchAlerts };
}
