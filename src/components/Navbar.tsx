import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogOut, User, ShoppingCart, Map, Package } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-xl font-bold flex items-center">
            <Package className="mr-2" />
            LPG Ordering
          </Link>
          
          <div className="flex items-center space-x-6">
            {user.role === 'customer' && (
              <>
                <Link to="/orders" className="flex items-center hover:text-blue-200">
                  <ShoppingCart className="mr-1 h-5 w-5" />
                  <span>My Orders</span>
                </Link>
              </>
            )}
            
            {user.role === 'admin' && (
              <>
                <Link to="/admin/dashboard" className="flex items-center hover:text-blue-200">
                  <Map className="mr-1 h-5 w-5" />
                  <span>Dashboard</span>
                </Link>
              </>
            )}
            
            {user.role === 'delivery' && (
              <>
                <Link to="/delivery/orders" className="flex items-center hover:text-blue-200">
                  <Package className="mr-1 h-5 w-5" />
                  <span>Deliveries</span>
                </Link>
              </>
            )}
            
            <Link to="/profile" className="flex items-center hover:text-blue-200">
              <User className="mr-1 h-5 w-5" />
              <span>{user.full_name || user.email}</span>
            </Link>
            
            <button 
              onClick={handleSignOut}
              className="flex items-center hover:text-blue-200"
            >
              <LogOut className="mr-1 h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;