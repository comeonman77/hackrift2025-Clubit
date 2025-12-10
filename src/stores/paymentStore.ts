import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { PaymentRequest, PaymentRecord, PaymentStatus } from '../types';

interface PaymentState {
  paymentRequests: Map<string, PaymentRequest[]>;
  currentPaymentRequest: PaymentRequest | null;
  paymentRecords: Map<string, PaymentRecord[]>;
  userOutstandingPayments: PaymentRecord[];
  isLoading: boolean;

  // Actions
  fetchClubPayments: (clubId: string) => Promise<PaymentRequest[]>;
  fetchPaymentById: (paymentId: string) => Promise<PaymentRequest | null>;
  fetchUserOutstandingPayments: () => Promise<PaymentRecord[]>;
  createPaymentRequest: (payment: Omit<PaymentRequest, 'id' | 'created_at' | 'created_by'>) => Promise<PaymentRequest>;
  updatePaymentRequest: (paymentId: string, updates: Partial<PaymentRequest>) => Promise<void>;
  deletePaymentRequest: (paymentId: string) => Promise<void>;
  fetchPaymentRecords: (paymentId: string) => Promise<PaymentRecord[]>;
  updatePaymentStatus: (recordId: string, status: PaymentStatus, transactionRef?: string) => Promise<void>;
  setCurrentPaymentRequest: (payment: PaymentRequest | null) => void;
}

export const usePaymentStore = create<PaymentState>((set, get) => ({
  paymentRequests: new Map(),
  currentPaymentRequest: null,
  paymentRecords: new Map(),
  userOutstandingPayments: [],
  isLoading: false,

  fetchClubPayments: async (clubId: string) => {
    set({ isLoading: true });

    const { data, error } = await supabase
      .from('payment_requests_with_status')
      .select('*')
      .eq('club_id', clubId)
      .order('created_at', { ascending: false });

    if (error) {
      set({ isLoading: false });
      throw error;
    }

    const payments = (data || []).map(p => ({
      ...p,
      paid_count: p.paid_count || 0,
      total_count: p.total_count || 0,
    }));

    set(state => {
      const newPayments = new Map(state.paymentRequests);
      newPayments.set(clubId, payments);
      return { paymentRequests: newPayments, isLoading: false };
    });

    return payments;
  },

  fetchPaymentById: async (paymentId: string) => {
    const { data, error } = await supabase
      .from('payment_requests_with_status')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error) throw error;

    const payment: PaymentRequest = {
      ...data,
      paid_count: data.paid_count || 0,
      total_count: data.total_count || 0,
    };

    set({ currentPaymentRequest: payment });
    return payment;
  },

  fetchUserOutstandingPayments: async () => {
    set({ isLoading: true });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      set({ isLoading: false });
      return [];
    }

    const { data, error } = await supabase
      .from('payment_records')
      .select(`
        *,
        payment_request:payment_requests(*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      set({ isLoading: false });
      throw error;
    }

    set({ userOutstandingPayments: data || [], isLoading: false });
    return data || [];
  },

  createPaymentRequest: async (paymentData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('payment_requests')
      .insert({
        ...paymentData,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Refresh club payments
    await get().fetchClubPayments(paymentData.club_id);

    return data;
  },

  updatePaymentRequest: async (paymentId: string, updates: Partial<PaymentRequest>) => {
    const { error } = await supabase
      .from('payment_requests')
      .update(updates)
      .eq('id', paymentId);

    if (error) throw error;

    const currentPayment = get().currentPaymentRequest;
    if (currentPayment?.id === paymentId) {
      set({ currentPaymentRequest: { ...currentPayment, ...updates } });
    }
  },

  deletePaymentRequest: async (paymentId: string) => {
    const currentPayment = get().currentPaymentRequest;
    const clubId = currentPayment?.club_id;

    const { error } = await supabase
      .from('payment_requests')
      .delete()
      .eq('id', paymentId);

    if (error) throw error;

    if (clubId) {
      await get().fetchClubPayments(clubId);
    }

    if (currentPayment?.id === paymentId) {
      set({ currentPaymentRequest: null });
    }
  },

  fetchPaymentRecords: async (paymentId: string) => {
    const { data, error } = await supabase
      .from('payment_records')
      .select(`
        *,
        user:profiles!payment_records_user_id_fkey(*)
      `)
      .eq('request_id', paymentId)
      .order('status', { ascending: true });

    if (error) throw error;

    const records = data as PaymentRecord[];
    set(state => {
      const newRecords = new Map(state.paymentRecords);
      newRecords.set(paymentId, records);
      return { paymentRecords: newRecords };
    });

    return records;
  },

  updatePaymentStatus: async (recordId: string, status: PaymentStatus, transactionRef?: string) => {
    const { data: { user } } = await supabase.auth.getUser();

    const updateData: any = {
      status,
      paid_at: status === 'paid' ? new Date().toISOString() : null,
      confirmed_by: status === 'paid' ? user?.id : null,
    };

    if (transactionRef) {
      updateData.transaction_ref = transactionRef;
    }

    const { error } = await supabase
      .from('payment_records')
      .update(updateData)
      .eq('id', recordId);

    if (error) throw error;

    // Refresh current payment request if set
    const currentPayment = get().currentPaymentRequest;
    if (currentPayment) {
      await get().fetchPaymentRecords(currentPayment.id);
      await get().fetchPaymentById(currentPayment.id);
    }
  },

  setCurrentPaymentRequest: (payment) => set({ currentPaymentRequest: payment }),
}));
