import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import AiInsights from './pages/AiInsights';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import './index.css';

const HomeRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'admin' || user.role === 'manager') return <Navigate to="/admin" />;
  return <Navigate to="/staff" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <div className="container">
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/register" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Register />
              </ProtectedRoute>
            } />
            
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            <Route path="/insights" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <AiInsights />
              </ProtectedRoute>
            } />

            <Route path="/staff" element={
              <ProtectedRoute allowedRoles={['staff', 'manager', 'admin']}>
                <StaffDashboard />
              </ProtectedRoute>
            } />

            <Route path="/" element={<HomeRedirect />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
