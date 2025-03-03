import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useOrderStore, LpgType } from '../store/orderStore';
import Navbar from '../components/Navbar';
import GoogleMap from '../components/GoogleMap';
import { Package, MapPin, ShoppingCart, AlertCircle, DollarSign, Check, RefreshCw, ChevronUp, ChevronDown, Crosshair, Info } from 'lucide-react';

// Price configuration (in a real app, this would come from the database)
const PRICES = {
  '6kg': 25,
  '12kg': 45,
  '25kg': 85
};

// LPG cylinder data with images and descriptions
const LPG_CYLINDERS = [
  {
    type: '6kg',
    name: 'Small Cylinder',
    description: 'Ideal for small households or occasional use',
    image: 'https://images.unsplash.com/photo-1585044480208-5ca5b9f884b0?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
    price: PRICES['6kg'],
    stock: 'In Stock'
  },
  {
    type: '12kg',
    name: 'Medium Cylinder',
    description: 'Perfect for regular family cooking needs',
    image: 'https://images.unsplash.com/photo-1614977645540-7abd88ba8e56?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
    price: PRICES['12kg'],
    stock: 'In Stock'
  },
  {
    type: '25kg',
    name: 'Large Cylinder',
    description: 'Best for commercial use or large families',
    image: 'https://images.unsplash.com/photo-1581622558663-b2e33377dfb2?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
    price: PRICES['25kg'],
    stock: 'Limited Stock'
  }
];

const HomePage: React.FC = () => {
  const { user } = useAuthStore();
  const { createOrder, loading, error } = useOrderStore();
  const navigate = useNavigate();
  
  const [lpgType, setLpgType] = useState<LpgType>('12kg');
  const [quantity, setQuantity] = useState(1);
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [address, setAddress] = useState('');
  const [locationError, setLocationError] = useState('');
  const [hasLocation, setHasLocation] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showCylinderInfo, setShowCylinderInfo] = useState<string | null>(null);
  
  // Calculate price based on selection
  const unitPrice = PRICES[lpgType] || 0;
  const totalPrice = unitPrice * quantity;

  useEffect(() => {
    // Get user's current location on component mount
    detectCurrentLocation();
  }, []);

  const detectCurrentLocation = () => {
    setIsLocating(true);
    setLocationError('');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setHasLocation(true);
          setLocationError('');
          setIsLocating(false);
          
          // Try to get address from coordinates
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: { lat: position.coords.latitude, lng: position.coords.longitude } }, 
            (results, status) => {
              if (status === 'OK' && results && results[0]) {
                setAddress(results[0].formatted_address);
              }
            }
          );
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError('Unable to get your current location. Please enable location services.');
          setIsLocating(false);
          // Set default location (can be a city center)
          setLatitude(0);
          setLongitude(0);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
      setIsLocating(false);
    }
  };

  const handleLocationSelect = (lat: number, lng: number, addr: string) => {
    setLatitude(lat);
    setLongitude(lng);
    setAddress(addr);
    setHasLocation(true);
  };

  const incrementQuantity = () => {
    if (quantity < 10) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasLocation) {
      setLocationError('Please select your delivery location on the map.');
      return;
    }
    
    // Show confirmation modal instead of submitting immediately
    setShowConfirmation(true);
  };

  const confirmOrder = async () => {
    try {
      await createOrder(lpgType, quantity, latitude, longitude, address);
      setOrderSuccess(true);
      setShowConfirmation(false);
      setTimeout(() => {
        navigate('/orders');
      }, 2000);
    } catch (err) {
      setShowConfirmation(false);
      // Error is already handled by the store
    }
  };

  const handleCylinderSelect = (type: LpgType) => {
    setLpgType(type);
    setShowCylinderInfo(null);
  };

  const toggleCylinderInfo = (type: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowCylinderInfo(showCylinderInfo === type ? null : type);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 bg-blue-600 text-white">
              <h1 className="text-2xl font-bold flex items-center">
                <Package className="mr-2" />
                Order LPG Cylinders
              </h1>
              <p className="mt-2">Select your LPG type, quantity, and delivery location</p>
            </div>
            
            {orderSuccess ? (
              <div className="p-8 text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                    <ShoppingCart className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Placed Successfully!</h2>
                <p className="text-gray-600 mb-4">Your order has been placed and is being processed.</p>
                <p className="text-gray-600">Redirecting to your orders...</p>
              </div>
            ) : (
              <div className="p-6">
                {error && (
                  <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md flex items-start">
                    <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Select LPG Cylinder Type
                        </label>
                        <div className="grid grid-cols-1 gap-4">
                          {LPG_CYLINDERS.map((cylinder) => (
                            <div 
                              key={cylinder.type}
                              className={`relative border rounded-lg overflow-hidden transition-all duration-200 transform hover:scale-[1.02] cursor-pointer ${
                                lpgType === cylinder.type 
                                  ? 'border-blue-500 ring-2 ring-blue-200' 
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => handleCylinderSelect(cylinder.type as LpgType)}
                            >
                              <div className="flex">
                                <div className="w-1/3 h-32 bg-gray-100">
                                  <img 
                                    src={cylinder.image} 
                                    alt={`${cylinder.type} LPG Cylinder`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="w-2/3 p-3 flex flex-col justify-between">
                                  <div>
                                    <div className="flex justify-between items-start">
                                      <h3 className="font-semibold text-gray-800">{cylinder.name}</h3>
                                      <button 
                                        type="button"
                                        onClick={(e) => toggleCylinderInfo(cylinder.type, e)}
                                        className="text-gray-400 hover:text-gray-600"
                                        aria-label="More information"
                                      >
                                        <Info className="h-4 w-4" />
                                      </button>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{cylinder.type} cylinder</p>
                                  </div>
                                  <div className="flex justify-between items-center mt-2">
                                    <span className="font-bold text-blue-600">${cylinder.price.toFixed(2)}</span>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      cylinder.stock === 'In Stock' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {cylinder.stock}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              {lpgType === cylinder.type && (
                                <div className="absolute top-2 right-2 h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
                                  <Check className="h-4 w-4 text-white" />
                                </div>
                              )}
                              
                              {showCylinderInfo === cylinder.type && (
                                <div className="p-3 bg-blue-50 border-t border-blue-100">
                                  <p className="text-sm text-gray-700">{cylinder.description}</p>
                                  <div className="mt-2 text-xs text-gray-600">
                                    <p>• Refill price: ${cylinder.price.toFixed(2)}</p>
                                    <p>• New cylinder: ${(cylinder.price * 2).toFixed(2)} (includes deposit)</p>
                                    <p>• Typical usage: {
                                      cylinder.type === '6kg' ? '2-3 weeks for small households' :
                                      cylinder.type === '12kg' ? '3-4 weeks for medium households' :
                                      '4-6 weeks for large households or commercial use'
                                    }</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity
                        </label>
                        <div className="flex items-center">
                          <button 
                            type="button"
                            onClick={decrementQuantity}
                            className="px-3 py-2 bg-gray-200 rounded-l-md hover:bg-gray-300 focus:outline-none"
                            aria-label="Decrease quantity"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                          <input
                            id="quantity"
                            type="number"
                            min="1"
                            max="10"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                            className="w-16 text-center px-2 py-2 border-t border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label="Quantity"
                          />
                          <button 
                            type="button"
                            onClick={incrementQuantity}
                            className="px-3 py-2 bg-gray-200 rounded-r-md hover:bg-gray-300 focus:outline-none"
                            aria-label="Increase quantity"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="mb-6 p-4 bg-blue-50 rounded-md">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-2">
                          <DollarSign className="h-5 w-5 mr-1 text-blue-600" />
                          Price Estimate
                        </h3>
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Unit Price:</span>
                          <span>${unitPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Quantity:</span>
                          <span>x{quantity}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-gray-800 pt-2 border-t border-gray-200 mt-2">
                          <span>Total:</span>
                          <span>${totalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Delivery Address
                        </label>
                        <div className="flex items-start">
                          <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-1" />
                          <div className="flex-1">
                            {address ? (
                              <p className="text-gray-800">{address}</p>
                            ) : (
                              <p className="text-gray-500 italic">
                                {hasLocation 
                                  ? 'Click on the map to select your exact delivery location' 
                                  : 'Loading your location...'}
                              </p>
                            )}
                            <button
                              type="button"
                              onClick={detectCurrentLocation}
                              className="mt-2 flex items-center text-sm text-blue-600 hover:text-blue-800"
                            >
                              {isLocating ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                                  Detecting location...
                                </>
                              ) : (
                                <>
                                  <Crosshair className="h-4 w-4 mr-1" />
                                  Use my current location
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                        {locationError && (
                          <p className="mt-2 text-sm text-red-600">{locationError}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Delivery Location
                      </label>
                      <div className="h-80 rounded-md overflow-hidden border border-gray-300">
                        {hasLocation ? (
                          <GoogleMap
                            latitude={latitude}
                            longitude={longitude}
                            height="100%"
                            zoom={15}
                            selectable={true}
                            onLocationSelect={handleLocationSelect}
                          />
                        ) : (
                          <div className="h-full bg-gray-100 flex items-center justify-center">
                            <div className="text-center p-4">
                              <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-gray-500">Loading map...</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        Click on the map to select your exact delivery location
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <button
                      type="submit"
                      disabled={loading || !hasLocation}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="mr-2 h-5 w-5" />
                          Place Order
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Order Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Confirm Your Order</h3>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Order Summary</h4>
                <p className="text-gray-800 font-medium">{quantity} x {lpgType} LPG Cylinder</p>
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Delivery Address</h4>
                <p className="text-gray-800">{address || 'Selected location on map'}</p>
              </div>
              
              <div className="mb-6 p-3 bg-blue-50 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800">Total Price:</span>
                  <span className="font-bold text-blue-600">${totalPrice.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmOrder}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Confirm Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;