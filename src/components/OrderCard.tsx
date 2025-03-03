import React from 'react';
import { Order, OrderStatus, useOrderStore } from '../store/orderStore';
import { useAuthStore } from '../store/authStore';
import { Package, MapPin, Clock, User, Phone, DollarSign } from 'lucide-react';

// Price configuration (in a real app, this would come from the database)
const PRICES = {
  '6kg': 25,
  '12kg': 45,
  '25kg': 85
};

interface OrderCardProps {
  order: Order;
  showActions?: boolean;
  showLocation?: boolean;
  onViewMap?: (order: Order) => void;
  onAssign?: (order: Order) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ 
  order, 
  showActions = true,
  showLocation = false,
  onViewMap,
  onAssign
}) => {
  const { updateOrderStatus } = useOrderStore();
  const { user } = useAuthStore();

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-blue-100 text-blue-800',
    out_for_delivery: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleStatusUpdate = (status: OrderStatus) => {
    updateOrderStatus(order.id, status);
  };

  // Calculate price
  const unitPrice = PRICES[order.lpg_type as keyof typeof PRICES] || 0;
  const totalPrice = unitPrice * order.quantity;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center">
            <Package className="mr-2 h-5 w-5" />
            {order.lpg_type} LPG - {order.quantity} unit(s)
          </h3>
          <p className="text-gray-600 flex items-center mt-1">
            <Clock className="mr-2 h-4 w-4" />
            {formatDate(order.created_at)}
          </p>
          <p className="text-gray-600 flex items-center mt-1">
            <DollarSign className="mr-2 h-4 w-4" />
            ${totalPrice.toFixed(2)}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status] || 'bg-gray-100'}`}>
          {order.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      {showLocation && order.latitude && order.longitude && (
        <div className="mb-4">
          <p className="text-gray-700 flex items-center">
            <MapPin className="mr-2 h-4 w-4" />
            {order.address || 'Location available on map'}
          </p>
        </div>
      )}

      {user?.role === 'admin' && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <p className="text-gray-700 flex items-center">
            <User className="mr-2 h-4 w-4" />
            Order ID: {order.id}
          </p>
          {order.assigned_to && (
            <p className="text-gray-700 flex items-center mt-1">
              <Phone className="mr-2 h-4 w-4" />
              Assigned to: {order.assigned_to}
            </p>
          )}
        </div>
      )}

      {showActions && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
          {user?.role === 'admin' && order.status === 'pending' && (
            <>
              <button 
                onClick={() => onAssign && onAssign(order)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Assign to Delivery
              </button>
              <button 
                onClick={() => handleStatusUpdate('cancelled')}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                Cancel Order
              </button>
            </>
          )}

          {user?.role === 'delivery' && (
            <>
              {order.status === 'accepted' && (
                <button 
                  onClick={() => handleStatusUpdate('out_for_delivery')}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                >
                  Mark as Out for Delivery
                </button>
              )}
              {order.status === 'out_for_delivery' && (
                <button 
                  onClick={() => handleStatusUpdate('delivered')}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                >
                  Mark as Delivered
                </button>
              )}
            </>
          )}

          {(user?.role === 'admin' || user?.role === 'delivery') && order.latitude && order.longitude && (
            <button 
              onClick={() => onViewMap && onViewMap(order)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
            >
              View on Map
            </button>
          )}

          {user?.role === 'customer' && order.status === 'pending' && (
            <button 
              onClick={() => handleStatusUpdate('cancelled')}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Cancel Order
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderCard;