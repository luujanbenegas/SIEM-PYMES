import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Componentes
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Events from './components/Events';
import Alerts from './components/Alerts';
import SecurityTips from './components/SecurityTips';
import Reports from './components/Reports';
import Navbar from './components/Navbar';
import { Toaster } from './components/ui/toaster';
import { toast } from './hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Configurar axios
axios.defaults.baseURL = API;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Verificar token válido
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, [token]);

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get('/dashboard/stats');
      setLoading(false);
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      logout();
    }
  };

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setToken(token);
    setUser(userData);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    toast({
      title: "¡Bienvenido!",
      description: `Sesión iniciada como ${userData.nombre_completo}`,
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    setLoading(false);
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 to-amber-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50">
        {token ? (
          <>
            <Navbar user={user} onLogout={logout} />
            <main className="pt-16">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/events" element={<Events />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/security-tips" element={<SecurityTips />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </main>
          </>
        ) : (
          <Routes>
            <Route path="*" element={<Login onLogin={login} />} />
          </Routes>
        )}
        <Toaster />
      </div>
    </Router>
  );
}

export default App;