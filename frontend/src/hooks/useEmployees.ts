import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/config/api.client';
import * as endpoints from '@/config/employees.endpoints';
import * as attEndpoints from '@/config/attendance.endpoints';
import type { CreateEmployeePayload, Employee } from '@/types/employee.types';

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all employees
  const fetchEmployees = useCallback(async (search?: string, dept_id?: number, include_inactive?: boolean, status_id?: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (dept_id) params.append('dept_id', dept_id.toString());
      if (include_inactive) params.append('include_inactive', 'true');
      if (status_id) params.append('status_id', status_id.toString());

      const { data } = await apiClient.get<Employee[]>(`${endpoints.EMPLOYEES_BASE_ENDPOINT}?${params}`);
      setEmployees(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create Employee
  const createEmployee = async (payload: CreateEmployeePayload) => {
    setLoading(true);
    try {
      await apiClient.post(endpoints.EMPLOYEES_BASE_ENDPOINT, payload);
      await fetchEmployees(); // Refresh list after create
      return true;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create employee');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update Employee
  const updateEmployee = async (id: number, payload: any) => {
    setLoading(true);
    try {
      await apiClient.put(endpoints.updateEmployeeEndpoint(id), payload);
      await fetchEmployees(); // Refresh list
      return true;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete Employee
  const deleteEmployee = async (id: number) => {
    if (!confirm("Are you sure?")) return;

    setLoading(true);
    try {
      await apiClient.delete(endpoints.deleteEmployeeEndpoint(id));
      await fetchEmployees(); // Refresh list
      return true;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get Organization Structure
  const getStructure = useCallback(async () => {
    try {
      const { data } = await apiClient.get(endpoints.EMPLOYEES_STRUCTURE_ENDPOINT);
      return data;
    } catch (err: any) {
      console.error("Failed to fetch structure", err);
      return [];
    }
  }, []);

  // Get Service Types
  const getServiceTypes = useCallback(async () => {
    try {
      const { data } = await apiClient.get(endpoints.EMPLOYEES_SERVICE_TYPES_ENDPOINT);
      return data;
    } catch (err: any) {
      console.error("Failed to fetch service types", err);
      return [];
    }
  }, []);

  // Get Status Types (Attendance)
  const getStatusTypes = useCallback(async () => {
    try {
      const { data } = await apiClient.get(attEndpoints.ATTENDANCE_STATUS_TYPES_ENDPOINT);
      return data;
    } catch (err: any) {
      console.error("Failed to fetch status types", err);
      return [];
    }
  }, []);

  // Get Dashboard Stats & Birthdays
  const getDashboardStats = useCallback(async (filters?: { department_id?: string; section_id?: string; team_id?: string; status_id?: string }) => {
    try {
      const params = new URLSearchParams();
      if (filters?.department_id) params.append('department_id', filters.department_id);
      if (filters?.section_id) params.append('section_id', filters.section_id);
      if (filters?.team_id) params.append('team_id', filters.team_id);
      if (filters?.status_id) params.append('status_id', filters.status_id);

      const { data } = await apiClient.get(`${attEndpoints.ATTENDANCE_STATS_ENDPOINT}?${params}`);
      return data;
    } catch (err: any) {
      console.error("Failed to fetch dashboard stats", err);
      return { stats: [], birthdays: [] };
    }
  }, []);

  // Log Attendance Status
  const logStatus = async (payload: {
    employee_id: number;
    status_type_id: number;
    note?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    setLoading(true);
    try {
      await apiClient.post(attEndpoints.ATTENDANCE_LOG_ENDPOINT, payload);
      await fetchEmployees(); // Refresh list to see updated status
      return true;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to log status');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Bulk Log Attendance Status
  const logBulkStatus = async (updates: { employee_id: number; status_type_id: number; start_date?: string; end_date?: string; note?: string }[]) => {
    setLoading(true);
    try {
      await apiClient.post(attEndpoints.ATTENDANCE_BULK_LOG_ENDPOINT, { updates });
      await fetchEmployees();
      return true;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to bulk log status');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return {
    employees,
    loading,
    error,
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getStructure,
    getServiceTypes,
    getStatusTypes,
    logStatus,
    logBulkStatus,
    getDashboardStats
  };
};