import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import OrdersPage from './pages/OrdersPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import DeliveryPage from './pages/DeliveryPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

// Components
import AuthGuard from './components/AuthGuard';

function App() {
  const { getUser } = useAuthStore();

  useEffect(() => {
    getUser();
  }, [getUser]);

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Protected routes for all authenticated users */}
        <Route element={<AuthGuard />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/orders" element={<OrdersPage />} />
        </Route>

        {/* Admin routes */}
        <Route element={<AuthGuard allowedRoles={['admin']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>

        {/* Delivery routes */}
        <Route element={<AuthGuard allowedRoles={['delivery']} />}>
          <Route path="/delivery/orders" element={<DeliveryPage />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;