import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/config/api.client';
import * as endpoints from '@/config/employees.endpoints';
import type { CreateEmployeePayload, Employee } from '@/types/employee.types';

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all employees
  const fetchEmployees = useCallback(async (search?: string, dept_id?: number, include_inactive?: boolean) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (dept_id) params.append('dept_id', dept_id.toString());
      if (include_inactive) params.append('include_inactive', 'true');

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
    getServiceTypes
  };
};