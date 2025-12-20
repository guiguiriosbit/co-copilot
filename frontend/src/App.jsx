import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './i18n'; // Initialize i18n
import LoginPage from './components/LoginPage';
import PlayerPage from './components/PlayerPage';
import AdminPage from './components/AdminPage';

// Simple Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Login Route */}
        <Route path="/" element={<LoginPage />} />

        {/* Protected Player Route */}
        <Route
          path="/player"
          element={
            <ProtectedRoute>
              <PlayerPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Route (Public for now, or add separate auth) */}
        <Route path="/admin" element={<AdminPage onBack={() => window.location.href = '/'} />} />
      </Routes>
    </Router>
  );
}

export default App;


