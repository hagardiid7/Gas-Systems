import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface DeliveryPerson {
  id: string;
  full_name: string | null;
  phone_number: string | null;
}

interface AdminState {
  deliveryPersonnel: DeliveryPerson[];
  loading: boolean;
  error: string | null;
  fetchDeliveryPersonnel: () => Promise<void>;
}

export const useAdminStore = create<AdminState>((set) => ({
  deliveryPersonnel: [],
  loading: false,
  error: null,

  fetchDeliveryPersonnel: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone_number')
        .eq('role', 'delivery');

      if (error) throw error;
      
      set({ deliveryPersonnel: data || [] });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
}));