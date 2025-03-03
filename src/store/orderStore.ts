import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';
import { socket, connectSocket, disconnectSocket, subscribeToOrderUpdates } from '../lib/socket';

export type LpgType = '6kg' | '12kg' | '25kg';
export type OrderStatus = 'pending' | 'accepted' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  created_at: string;
  user_id: string;
  lpg_type: string;
  quantity: number;
  status: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  assigned_to: string | null;
}

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  loading: boolean;
  error: string | null;
  createOrder: (lpgType: LpgType, quantity: number, latitude: number, longitude: number, address: string) => Promise<void>;
  getUserOrders: () => Promise<void>;
  getAllOrders: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  assignOrder: (orderId: string, deliveryPersonId: string) => Promise<void>;
  subscribeToOrders: () => () => void;
  updateOrderStatusFromSocket: (orderId: string, status: OrderStatus) => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,

  createOrder: async (lpgType, quantity, latitude, longitude, address) => {
    set({ loading: true, error: null });
    try {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          lpg_type: lpgType,
          quantity,
          status: 'pending',
          latitude,
          longitude,
          address,
        })
        .select()
        .single();

      if (error) throw error;
      
      set({ currentOrder: data });
      await get().getUserOrders();
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  getUserOrders: async () => {
    set({ loading: true, error: null });
    try {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      set({ orders: data });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  getAllOrders: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      set({ orders: data });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateOrderStatus: async (orderId, status) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;
      
      const user = useAuthStore.getState().user;
      if (user?.role === 'admin') {
        await get().getAllOrders();
      } else {
        await get().getUserOrders();
      }
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  assignOrder: async (orderId, deliveryPersonId) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          assigned_to: deliveryPersonId,
          status: 'accepted'
        })
        .eq('id', orderId);

      if (error) throw error;
      
      await get().getAllOrders();
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateOrderStatusFromSocket: (orderId: string, status: OrderStatus) => {
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId ? { ...order, status } : order
      ),
      currentOrder: state.currentOrder?.id === orderId
        ? { ...state.currentOrder, status }
        : state.currentOrder
    }));
  },

  subscribeToOrders: () => {
    // Existing Supabase realtime subscription
    const user = useAuthStore.getState().user;
    
    let subscription: any;
    
    if (user?.role === 'admin' || user?.role === 'delivery') {
      subscription = supabase
        .channel('orders-channel')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'orders' 
        }, () => {
          get().getAllOrders();
        })
        .subscribe();
    } else if (user) {
      subscription = supabase
        .channel('user-orders-channel')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'orders',
          filter: `user_id=eq.${user.id}`
        }, () => {
          get().getUserOrders();
        })
        .subscribe();
    }
    
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }
}));