import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { apiRequest } from '../utils/api';

export default function ProtectedRoute({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await apiRequest('/auth/me');  // ✅ Updated to /auth/me
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) return <p>Loading...</p>;
  return isAuthenticated ? children : <Navigate to="/" />;
}
