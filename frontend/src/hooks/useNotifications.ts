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
  const [readIds, setReadIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Load read IDs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("read_notifications");
    if (saved) {
      try {
        setReadIds(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse read notifications", e);
      }
    }
  }, []);

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

  const markAllAsRead = () => {
    const allIds = alerts.map(a => a.id);
    setReadIds(allIds);
    localStorage.setItem("read_notifications", JSON.stringify(allIds));
  };

  useEffect(() => {
    fetchAlerts();
    // Refresh every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = alerts.filter(a => !readIds.includes(a.id)).length;

  return {
    alerts,
    loading,
    unreadCount,
    refreshAlerts: fetchAlerts,
    markAllAsRead
  };
}
