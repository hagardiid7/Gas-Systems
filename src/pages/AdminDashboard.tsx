import React, { useEffect, useState } from 'react';
import { useOrderStore, Order } from '../store/orderStore';
import { useAdminStore } from '../store/adminStore';
import Navbar from '../components/Navbar';
import OrderCard from '../components/OrderCard';
import GoogleMap from '../components/GoogleMap';
import { Package, MapPin, X, Search, Filter, User, AlertCircle } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { orders, getAllOrders, subscribeToOrders, loading } = useOrderStore();
  const { deliveryPersonnel, fetchDeliveryPersonnel, loading: loadingPersonnel, error: personnelError } = useAdminStore();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [deliveryPersonId, setDeliveryPersonId] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [assignError, setAssignError] = useState<string | null>(null);

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

  const handleAssign = (order: Order) => {
    setSelectedOrder(order);
    setDeliveryPersonId('');
    setAssignError(null);
    setShowAssignModal(true);
    fetchDeliveryPersonnel();
  };

  const closeMap = () => {
    setShowMap(false);
    setSelectedOrder(null);
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setSelectedOrder(null);
    setDeliveryPersonId('');
    setAssignError(null);
  };

  const assignDeliveryPerson = async () => {
    setAssignError(null);
    if (selectedOrder && deliveryPersonId) {
      try {
        await useOrderStore.getState().assignOrder(selectedOrder.id, deliveryPersonId);
        closeAssignModal();
      } catch (error) {
        setAssignError((error as Error).message);
      }
    } else {
      setAssignError('Please select a delivery person');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.address && order.address.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 flex items-center">
            <Package className="mr-2" />
            Admin Dashboard
          </h1>
          
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by order ID, user ID or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center">
                <Filter className="h-5 w-5 text-gray-400 mr-2" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">No Orders Found</h2>
              <p className="text-gray-600">No orders match your current filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOrders.map((order) => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  showLocation={true}
                  onViewMap={handleViewMap}
                  onAssign={handleAssign}
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
      
      {/* Assign Delivery Person Modal */}
      {showAssignModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center">
                <User className="mr-2 h-5 w-5 text-blue-600" />
                Assign Delivery Person
              </h3>
              <button 
                onClick={closeAssignModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              {assignError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{assignError}</span>
                </div>
              )}
              
              {personnelError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Error loading delivery personnel: {personnelError}</span>
                </div>
              )}
              
              <div className="mb-6">
                <label htmlFor="deliveryPerson" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Delivery Person
                </label>
                {loadingPersonnel ? (
                  <div className="flex items-center justify-center py-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-sm text-gray-500">Loading delivery personnel...</span>
                  </div>
                ) : (
                  <select
                    id="deliveryPerson"
                    value={deliveryPersonId}
                    onChange={(e) => setDeliveryPersonId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select Delivery Person --</option>
                    {deliveryPersonnel.map(person => (
                      <option key={person.id} value={person.id}>
                        {person.full_name || 'Unnamed'} {person.phone_number ? `(${person.phone_number})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeAssignModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={assignDeliveryPerson}
                  disabled={!deliveryPersonId || loadingPersonnel}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;