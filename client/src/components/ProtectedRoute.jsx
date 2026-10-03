import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader message="Verifying authentication credentials..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 rounded-2xl glass-panel text-center">
        <h2 className="text-xl font-bold text-rose-400 mb-2">Access Restricted</h2>
        <p className="text-slate-300 text-sm mb-6">
          This portal requires administrator privileges (FR13). You are currently signed in as a general user.
        </p>
        <a
          href="/dashboard"
          className="inline-block px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500"
        >
          Return to Dashboard
        </a>
      </div>
    );
  }

  return children;
}
