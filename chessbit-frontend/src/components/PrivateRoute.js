import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

function PrivateRoute() {
  const isAuthenticated = !!localStorage.getItem('token'); // Simplified boolean check

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
}

export default PrivateRoute;
