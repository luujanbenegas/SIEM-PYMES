import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  AlertCircle, 
  Clock, 
  User, 
  Search, 
  Filter,
  RefreshCw,
  MessageSquare,
  Shield,
  Calendar
} from 'lucide-react';
import axios from 'axios';
import { toast } from '../hooks/use-toast';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    severity: ''
  });
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolveLoading, setResolveLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [alertsPerPage] = useState(15);

  useEffect(() => {
    loadAlerts();
    // Actualizar cada 30 segundos
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, [filters, currentPage]);

  const loadAlerts = async () => {
    try {
      const params = {
        skip: (currentPage - 1) * alertsPerPage,
        limit: alertsPerPage,
        ...(filters.status && { status: filters.status }),
        ...(filters.severity && { severity: filters.severity })
      };
      
      const response = await axios.get('/alerts', { params });
      setAlerts(response.data);
    } catch (error) {
      console.error('Error cargando alertas:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las alertas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAlert = async () => {
    if (!selectedAlert) return;
    
    setResolveLoading(true);
    try {
      await axios.put(`/alerts/${selectedAlert.id}/resolve`, {
        notes: resolutionNotes
      });
      
      toast({
        title: "Alerta Resuelta",
        description: `La alerta "${selectedAlert.rule_name}" ha sido marcada como resuelta`,
      });
      
      setSelectedAlert(null);
      setResolutionNotes('');
      loadAlerts();
    } catch (error) {
      console.error('Error resolviendo alerta:', error);
      toast({
        title: "Error",
        description: "No se pudo resolver la alerta",
        variant: "destructive"
      });
    } finally {
      setResolveLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    loadAlerts();
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ search: '', status: '', severity: '' });
    setCurrentPage(1);
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'high': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'medium': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'low': return <Eye className="w-5 h-5 text-blue-500" />;
      default: return <CheckCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSeverityBadge = (severity) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    
    return (
      <Badge className={colors[severity] || 'bg-gray-100 text-gray-800 border-gray-200'}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const getStatusBadge = (status) => {
    const colors = {
      open: 'bg-red-100 text-red-800 border-red-200',
      investigating: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      resolved: 'bg-green-100 text-green-800 border-green-200',
      false_positive: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    const labels = {
      open: 'Abierta',
      investigating: 'Investigando',
      resolved: 'Resuelta',
      false_positive: 'Falso Positivo'
    };
    
    return (
      <Badge className={colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('es-PY', {
      timeZone: 'America/Asuncion',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Hace menos de 1 min';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours} h`;
    return `Hace ${days} días`;
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        alert.rule_name.toLowerCase().includes(searchLower) ||
        (alert.notes && alert.notes.toLowerCase().includes(searchLower)) ||
        (alert.resolved_by && alert.resolved_by.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  const alertStats = {
    total: filteredAlerts.length,
    open: filteredAlerts.filter(a => a.status === 'open').length,
    critical: filteredAlerts.filter(a => a.severity === 'critical').length,
    resolved_today: filteredAlerts.filter(a => {
      if (a.status !== 'resolved' || !a.resolved_at) return false;
      const today = new Date();
      const resolvedDate = new Date(a.resolved_at);
      return resolvedDate.toDateString() === today.toDateString();
    }).length
  };

  return (
    <div className="p-4 lg:p-8 animate-fade-in-up" data-testid="alerts-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-stone-900 mb-2">
          Centro de Alertas
        </h1>
        <p className="text-stone-600 text-lg">
          Gestión y seguimiento de alertas de seguridad
        </p>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="glass-card" data-testid="alert-stat-total">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-600 font-medium">Total Alertas</p>
                <p className="text-2xl font-bold text-stone-900">{alertStats.total}</p>
              </div>
              <Shield className="w-8 h-8 text-stone-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card" data-testid="alert-stat-open">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-600 font-medium">Abiertas</p>
                <p className="text-2xl font-bold text-red-600">{alertStats.open}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card" data-testid="alert-stat-critical">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-600 font-medium">Críticas</p>
                <p className="text-2xl font-bold text-orange-600">{alertStats.critical}</p>
              </div>
              <XCircle className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card" data-testid="alert-stat-resolved">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-600 font-medium">Resueltas Hoy</p>
                <p className="text-2xl font-bold text-green-600">{alertStats.resolved_today}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="glass-card mb-6" data-testid="alerts-filters">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Búsqueda</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-4 h-4" />
                <Input
                  placeholder="Nombre de regla, notas..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 siem-input"
                  data-testid="search-input"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Estado</label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger className="siem-select" data-testid="status-filter">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Abierta</SelectItem>
                  <SelectItem value="investigating">Investigando</SelectItem>
                  <SelectItem value="resolved">Resuelta</SelectItem>
                  <SelectItem value="false_positive">Falso Positivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Severidad</label>
              <Select value={filters.severity} onValueChange={(value) => handleFilterChange('severity', value)}>
                <SelectTrigger className="siem-select" data-testid="severity-filter">
                  <SelectValue placeholder="Todas las severidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Crítico</SelectItem>
                  <SelectItem value="high">Alto</SelectItem>
                  <SelectItem value="medium">Medio</SelectItem>
                  <SelectItem value="low">Bajo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 flex flex-col justify-end">
              <div className="flex gap-2">
                <Button 
                  onClick={handleRefresh} 
                  disabled={loading}
                  className="btn-secondary flex-1"
                  data-testid="refresh-button"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>
                <Button 
                  onClick={clearFilters}
                  variant="outline"
                  className="btn-secondary"
                  data-testid="clear-filters-button"
                >
                  Limpiar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Alertas */}
      <Card className="glass-card" data-testid="alerts-list">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Alertas ({filteredAlerts.length})
            </div>
            <Badge className="bg-stone-100 text-stone-700">
              Página {currentPage}
            </Badge>
          </CardTitle>
          <CardDescription>
            Lista de alertas generadas por las reglas de correlación
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4" data-testid="alerts-loading">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="loading-shimmer h-20 rounded-xl"></div>
              ))}
            </div>
          ) : filteredAlerts.length > 0 ? (
            <div className="space-y-4">
              {filteredAlerts.map((alert) => (
                <div key={alert.id} className="border border-stone-200 rounded-xl p-6 hover:bg-stone-50/50 transition-colors" data-testid={`alert-${alert.id}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getSeverityIcon(alert.severity)}
                      <div>
                        <h3 className="font-semibold text-stone-900 text-lg">{alert.rule_name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {getSeverityBadge(alert.severity)}
                          {getStatusBadge(alert.status)}
                        </div>
                      </div>
                    </div>
                    
                    {alert.status === 'open' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedAlert(alert)}
                            className="btn-secondary"
                            data-testid={`resolve-alert-${alert.id}`}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Resolver
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Resolver Alerta</DialogTitle>
                            <DialogDescription>
                              Marca esta alerta como resuelta y agrega notas sobre la resolución.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium text-stone-700 mb-2 block">
                                Notas de Resolución
                              </label>
                              <Textarea
                                placeholder="Describe cómo se resolvió esta alerta..."
                                value={resolutionNotes}
                                onChange={(e) => setResolutionNotes(e.target.value)}
                                className="siem-input"
                                rows={4}
                                data-testid="resolution-notes"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button 
                              onClick={handleResolveAlert}
                              disabled={resolveLoading}
                              className="btn-primary"
                              data-testid="confirm-resolve"
                            >
                              {resolveLoading ? (
                                <div className="flex items-center gap-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  Resolviendo...
                                </div>
                              ) : (
                                'Resolver Alerta'
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-stone-400" />
                      <div>
                        <span className="text-stone-600">Creada:</span>
                        <br />
                        <span className="font-mono">{formatDateTime(alert.created_at)}</span>
                        <br />
                        <span className="text-stone-500">{getTimeAgo(alert.created_at)}</span>
                      </div>
                    </div>
                    
                    {alert.resolved_at && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <div>
                          <span className="text-stone-600">Resuelta:</span>
                          <br />
                          <span className="font-mono">{formatDateTime(alert.resolved_at)}</span>
                          <br />
                          {alert.resolved_by && (
                            <span className="text-stone-500">por {alert.resolved_by}</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {alert.notes && (
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-stone-400 mt-0.5" />
                        <div>
                          <span className="text-stone-600">Notas:</span>
                          <br />
                          <span className="text-stone-700">{alert.notes}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12" data-testid="no-alerts">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
              <h3 className="text-lg font-medium text-stone-500 mb-2">¡Excelente!</h3>
              <p className="text-stone-400">No hay alertas que coincidan con los filtros</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginación */}
      {filteredAlerts.length > 0 && (
        <div className="flex justify-center mt-6">
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              variant="outline"
              className="btn-secondary"
              data-testid="prev-page-button"
            >
              Anterior
            </Button>
            
            <span className="px-4 py-2 text-sm text-stone-600">
              Página {currentPage}
            </span>
            
            <Button 
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={filteredAlerts.length < alertsPerPage}
              variant="outline"
              className="btn-secondary"
              data-testid="next-page-button"
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alerts;