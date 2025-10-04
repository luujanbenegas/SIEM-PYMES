import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Activity, 
  AlertTriangle, 
  Shield, 
  Users, 
  Clock, 
  TrendingUp, 
  Eye,
  BarChart3,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import axios from 'axios';
import { toast } from '../hooks/use-toast';

const Dashboard = () => {
  const [stats, setStats] = useState({
    eventos_hoy: 0,
    eventos_semana: 0,
    alertas_abiertas: 0,
    logins_fallidos_hoy: 0,
    top_alertas: []
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    // Actualizar cada 30 segundos
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsResponse, eventsResponse, alertsResponse] = await Promise.all([
        axios.get('/dashboard/stats'),
        axios.get('/events?limit=10'),
        axios.get('/alerts?limit=10')
      ]);
      
      setStats(statsResponse.data);
      setRecentEvents(eventsResponse.data);
      setRecentAlerts(alertsResponse.data);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del dashboard",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'medium': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'low': return <Eye className="w-4 h-4 text-blue-500" />;
      default: return <CheckCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityBadge = (severity) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-blue-100 text-blue-800 border-blue-200',
      info: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    return (
      <Badge className={colors[severity] || colors.info}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Hace menos de 1 min';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours} h`;
    return date.toLocaleDateString('es-PY');
  };

  if (loading) {
    return (
      <div className="p-8" data-testid="dashboard-loading">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-6">
                <div className="loading-shimmer h-20 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 animate-fade-in-up" data-testid="dashboard-main">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-stone-900 mb-2">
          Centro de Control SIEM
        </h1>
        <p className="text-stone-600 text-lg">
          Monitoreo en tiempo real de eventos y amenazas de seguridad
        </p>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="metric-card hover-lift" data-testid="metric-eventos-hoy">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="metric-label mb-2">Eventos Hoy</p>
                <p className="metric-value text-blue-600">{stats.eventos_hoy}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="metric-change bg-green-100 text-green-700">
                {stats.eventos_semana} esta semana
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card hover-lift" data-testid="metric-alertas">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="metric-label mb-2">Alertas Abiertas</p>
                <p className="metric-value text-red-600">{stats.alertas_abiertas}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="mt-4">
              <Progress 
                value={Math.min(stats.alertas_abiertas * 10, 100)} 
                className="h-2 bg-red-100"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card hover-lift" data-testid="metric-logins-fallidos">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="metric-label mb-2">Logins Fallidos</p>
                <p className="metric-value text-orange-600">{stats.logins_fallidos_hoy}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-stone-600">Hoy</span>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card hover-lift" data-testid="metric-sistema">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="metric-label mb-2">Estado Sistema</p>
                <p className="metric-value text-green-600">Activo</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-green-600">• Monitoreo activo</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenido Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Eventos Recientes y Alertas */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="events" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-white/60 backdrop-blur-sm">
              <TabsTrigger value="events" className="data-[state=active]:bg-amber-100" data-testid="events-tab">
                <Activity className="w-4 h-4 mr-2" />
                Eventos Recientes
              </TabsTrigger>
              <TabsTrigger value="alerts" className="data-[state=active]:bg-red-100" data-testid="alerts-tab">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Alertas Activas
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="events">
              <Card className="glass-card" data-testid="recent-events-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Últimos Eventos
                  </CardTitle>
                  <CardDescription>
                    Actividad reciente del sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentEvents.length > 0 ? recentEvents.map((event) => (
                      <div key={event.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-stone-50/50 transition-colors" data-testid={`event-${event.id}`}>
                        <div className="mt-0.5">{getSeverityIcon(event.severity)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getSeverityBadge(event.severity)}
                            <Badge variant="outline" className="text-xs">
                              {event.event_type}
                            </Badge>
                          </div>
                          <p className="text-sm text-stone-900 font-medium">{event.description}</p>
                          <div className="text-xs text-stone-500 mt-1 flex items-center gap-3">
                            <span>IP: {event.source_ip}</span>
                            <span>•</span>
                            <span>{formatTime(event.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-8 text-stone-500" data-testid="no-events">
                        <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No hay eventos recientes</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="alerts">
              <Card className="glass-card" data-testid="recent-alerts-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Alertas Activas
                  </CardTitle>
                  <CardDescription>
                    Alertas que requieren atención
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentAlerts.length > 0 ? recentAlerts.map((alert) => (
                      <Alert key={alert.id} className={`alert-${alert.severity}`} data-testid={`alert-${alert.id}`}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{alert.rule_name}</p>
                              <p className="text-sm text-stone-600 mt-1">
                                {formatTime(alert.created_at)}
                              </p>
                            </div>
                            <div className="text-right">
                              {getSeverityBadge(alert.severity)}
                              <Badge variant="outline" className="ml-2 text-xs">
                                {alert.status}
                              </Badge>
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )) : (
                      <div className="text-center py-8 text-stone-500" data-testid="no-alerts">
                        <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No hay alertas activas</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Panel Lateral - Top Alertas y Estado */}
        <div className="space-y-6">
          {/* Top Alertas */}
          <Card className="glass-card" data-testid="top-alerts-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Top Alertas
              </CardTitle>
              <CardDescription>
                Alertas más frecuentes esta semana
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.top_alertas.length > 0 ? stats.top_alertas.map((alert, index) => (
                  <div key={alert._id} className="flex items-center justify-between p-3 rounded-xl bg-stone-50/50" data-testid={`top-alert-${index}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-700 font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{alert._id}</p>
                      </div>
                    </div>
                    <Badge className="bg-stone-100 text-stone-700">
                      {alert.count}
                    </Badge>
                  </div>
                )) : (
                  <div className="text-center py-6 text-stone-500" data-testid="no-top-alerts">
                    <BarChart3 className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay datos suficientes</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Estado del Sistema */}
          <Card className="glass-card" data-testid="system-status-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Estado del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-green-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Monitoreo Activo</span>
                  </div>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-xl bg-green-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Base de Datos</span>
                  </div>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-xl bg-green-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Reglas Activas</span>
                  </div>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                
                <div className="mt-4 p-3 bg-amber-50/50 rounded-xl border border-amber-200/50">
                  <p className="text-xs text-amber-700 mb-1">Última actualización</p>
                  <p className="text-sm font-medium text-amber-800">
                    {new Date().toLocaleString('es-PY', {
                      timeZone: 'America/Asuncion',
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;