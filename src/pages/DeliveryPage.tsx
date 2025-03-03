import React, { useEffect, useState } from 'react';
import { useOrderStore, Order } from '../store/orderStore';
import Navbar from '../components/Navbar';
import OrderCard from '../components/OrderCard';
import GoogleMap from '../components/GoogleMap';
import { Package, MapPin, X, Filter } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const DeliveryPage: React.FC = () => {
  const { user } = useAuthStore();
  const { orders, getAllOrders, subscribeToOrders, loading } = useOrderStore();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    getAllOrders();
    
    // Subscribe to real-time updates
    const unsubscribe = subscribeToOrders();
    
    return () => {
      unsubscribe();
    };
  }, [getAllOrders, subscribeToOrders]);

  const handleViewMap = (order: Order) => {
    setSelectedOrder(order);
    setShowMap(true);
  };

  const closeMap = () => {
    setShowMap(false);
    setSelectedOrder(null);
  };

  // Filter orders assigned to this delivery person
  const myOrders = orders.filter(order => {
    const isAssignedToMe = order.assigned_to === user?.id;
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    
    return isAssignedToMe && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 flex items-center">
            <Package className="mr-2" />
            My Deliveries
          </h1>
          
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-end">
              <Filter className="h-5 w-5 text-gray-400 mr-2" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Deliveries</option>
                <option value="accepted">Accepted</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : myOrders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">No Deliveries Found</h2>
              <p className="text-gray-600">You don't have any assigned deliveries yet.</p>
            </div>
          ) : (
            <div>
              {myOrders.map((order) => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  showLocation={true}
                  onViewMap={handleViewMap}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Map Modal */}
      {showMap && selectedOrder && selectedOrder.latitude && selectedOrder.longitude && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center">
                <MapPin className="mr-2 h-5 w-5 text-blue-600" />
                Delivery Location
              </h3>
              <button 
                onClick={closeMap}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4">
              {selectedOrder.address && (
                <p className="mb-4 text-gray-700">{selectedOrder.address}</p>
              )}
              <div className="h-96 rounded-md overflow-hidden">
                <GoogleMap
                  latitude={selectedOrder.latitude}
                  longitude={selectedOrder.longitude}
                  height="100%"
                  zoom={16}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryPage;