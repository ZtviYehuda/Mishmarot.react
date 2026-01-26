import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/config/api.client';
import * as endpoints from '@/config/transfers.endpoints';
import type { CreateTransferPayload, TransferRequest } from '@/types/transfer.types';

export const useTransfers = () => {
  const [pendingRequests, setPendingRequests] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Get Pending
  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<TransferRequest[]>(endpoints.TRANSFERS_PENDING_ENDPOINT);
      setPendingRequests(data);
    } catch (err) {
      setError('Failed to load transfers');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create Request
  const createTransfer = async (payload: CreateTransferPayload) => {
    setLoading(true);
    try {
      await apiClient.post(endpoints.TRANSFERS_BASE_ENDPOINT, payload);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create transfer');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Approve
  const approveTransfer = async (id: number) => {
    setLoading(true);
    try {
      await apiClient.post(endpoints.approveTransferEndpoint(id));
      await fetchPending(); // Refresh list
      return true;
    } catch (err: any) {
      setError('Failed to approve');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Reject
  const rejectTransfer = async (id: number, reason: string) => {
    setLoading(true);
    try {
      await apiClient.post(endpoints.rejectTransferEndpoint(id), { reason });
      await fetchPending(); // Refresh list
      return true;
    } catch (err: any) {
      setError('Failed to reject');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Init
  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  return { 
    pendingRequests, 
    loading, 
    error, 
    fetchPending, 
    createTransfer, 
    approveTransfer, 
    rejectTransfer 
  };
};