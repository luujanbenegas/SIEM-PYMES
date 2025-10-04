import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Shield, Mail, Lock, KeyRound } from 'lucide-react';
import axios from 'axios';
import { toast } from '../hooks/use-toast';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: 'admin@pymesiem.com',
    password: 'admin123',
    codigo_2fa: ''
  });
  const [loading, setLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/auth/login', formData);
      
      if (response.data.requires_2fa) {
        setRequires2FA(true);
        toast({
          title: "Código 2FA Enviado",
          description: "Revisa tu email para el código de verificación",
        });
      } else {
        onLogin(response.data.access_token, response.data.user);
      }
    } catch (error) {
      console.error('Error de login:', error);
      setError(error.response?.data?.detail || 'Error de autenticación');
      toast({
        title: "Error de Autenticación",
        description: error.response?.data?.detail || 'Credenciales incorrectas',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 particle-bg relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50"></div>
      <div className="absolute top-20 right-20 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-20 w-80 h-80 bg-orange-200/20 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl mb-6 shadow-2xl">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-stone-800 to-amber-700 bg-clip-text text-transparent mb-2">
            SIEM PYMEs
          </h1>
          <p className="text-stone-600 font-medium">Sistema de Información de Eventos y Seguridad</p>
        </div>

        <Card className="glass-card hover-lift animate-slide-in-right shadow-2xl border-0" data-testid="login-form">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl text-stone-900">Iniciar Sesión</CardTitle>
            <CardDescription className="text-stone-600">
              {requires2FA ? 'Ingresa el código enviado a tu email' : 'Accede a tu panel de seguridad'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {!requires2FA ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-stone-700 font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-5 h-5" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="pl-12 siem-input"
                        placeholder="admin@pymesiem.com"
                        data-testid="email-input"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-stone-700 font-medium">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-5 h-5" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="pl-12 siem-input"
                        placeholder="••••••••"
                        data-testid="password-input"
                        required
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="codigo_2fa" className="text-stone-700 font-medium">Código 2FA</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-5 h-5" />
                    <Input
                      id="codigo_2fa"
                      name="codigo_2fa"
                      type="text"
                      value={formData.codigo_2fa}
                      onChange={handleChange}
                      className="pl-12 siem-input text-center text-xl tracking-widest"
                      placeholder="123456"
                      maxLength="6"
                      data-testid="2fa-input"
                      required
                    />
                  </div>
                </div>
              )}

              {error && (
                <Alert className="border-red-200 bg-red-50" data-testid="login-error">
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full btn-primary text-lg py-6 font-semibold"
                disabled={loading}
                data-testid="login-submit-button"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    {requires2FA ? 'Verificando...' : 'Iniciando sesión...'}
                  </div>
                ) : (
                  requires2FA ? 'Verificar Código' : 'Iniciar Sesión'
                )}
              </Button>
            </form>
            
            <div className="mt-8 p-4 bg-amber-50/50 rounded-xl border border-amber-200/50">
              <h4 className="font-semibold text-amber-800 mb-2">Credenciales de Prueba:</h4>
              <div className="text-sm text-amber-700 space-y-1">
                <p><span className="font-medium">Email:</span> admin@pymesiem.com</p>
                <p><span className="font-medium">Contraseña:</span> admin123</p>
                <p className="text-xs text-amber-600 mt-2">* Este usuario tiene 2FA habilitado</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center mt-6 text-sm text-stone-500">
          <p>© 2025 Sistema SIEM para PYMEs - Asunción, Paraguay</p>
        </div>
      </div>
    </div>
  );
};

export default Login;