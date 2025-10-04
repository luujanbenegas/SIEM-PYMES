import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Activity, 
  Search, 
  Filter, 
  RefreshCw, 
  Calendar,
  MapPin,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { toast } from '../hooks/use-toast';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    severity: '',
    event_type: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage] = useState(20);

  useEffect(() => {
    loadEvents();
  }, [filters, currentPage]);

  const loadEvents = async () => {
    try {
      const params = {
        skip: (currentPage - 1) * eventsPerPage,
        limit: eventsPerPage,
        ...(filters.severity && { severity: filters.severity }),
        ...(filters.event_type && { event_type: filters.event_type })
      };
      
      const response = await axios.get('/events', { params });
      setEvents(response.data);
    } catch (error) {
      console.error('Error cargando eventos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los eventos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    loadEvents();
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ search: '', severity: '', event_type: '' });
    setCurrentPage(1);
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

  const getEventTypeBadge = (eventType) => {
    const colors = {
      login_failed: 'bg-red-100 text-red-700',
      login_success: 'bg-green-100 text-green-700',
      access_granted: 'bg-blue-100 text-blue-700',
      access_denied: 'bg-orange-100 text-orange-700',
      system_change: 'bg-purple-100 text-purple-700'
    };
    
    const labels = {
      login_failed: 'Login Fallido',
      login_success: 'Login Exitoso',
      access_granted: 'Acceso Permitido',
      access_denied: 'Acceso Denegado',
      system_change: 'Cambio de Sistema'
    };
    
    return (
      <Badge variant="outline" className={colors[eventType] || 'bg-gray-100 text-gray-700'}>
        {labels[eventType] || eventType}
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

  const filteredEvents = events.filter(event => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        event.description.toLowerCase().includes(searchLower) ||
        event.source_ip.toLowerCase().includes(searchLower) ||
        (event.username && event.username.toLowerCase().includes(searchLower)) ||
        (event.source_name && event.source_name.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  return (
    <div className="p-4 lg:p-8 animate-fade-in-up" data-testid="events-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-stone-900 mb-2">
          Eventos de Seguridad
        </h1>
        <p className="text-stone-600 text-lg">
          Registro completo de actividad del sistema
        </p>
      </div>

      {/* Filtros y Controles */}
      <Card className="glass-card mb-6" data-testid="events-filters">
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
                  placeholder="IP, usuario, descripción..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 siem-input"
                  data-testid="search-input"
                />
              </div>
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
                  <SelectItem value="info">Informativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Tipo de Evento</label>
              <Select value={filters.event_type} onValueChange={(value) => handleFilterChange('event_type', value)}>
                <SelectTrigger className="siem-select" data-testid="event-type-filter">
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="login_failed">Login Fallido</SelectItem>
                  <SelectItem value="login_success">Login Exitoso</SelectItem>
                  <SelectItem value="access_granted">Acceso Permitido</SelectItem>
                  <SelectItem value="access_denied">Acceso Denegado</SelectItem>
                  <SelectItem value="system_change">Cambio de Sistema</SelectItem>
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

      {/* Tabla de Eventos */}
      <Card className="glass-card" data-testid="events-table-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Eventos ({filteredEvents.length})
            </div>
            <Badge className="bg-stone-100 text-stone-700">
              Página {currentPage}
            </Badge>
          </CardTitle>
          <CardDescription>
            Lista de eventos de seguridad registrados en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3" data-testid="events-loading">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="loading-shimmer h-16 rounded"></div>
              ))}
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="siem-table" data-testid="events-table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Fecha/Hora</TableHead>
                    <TableHead className="w-28">Severidad</TableHead>
                    <TableHead className="w-32">Tipo</TableHead>
                    <TableHead className="w-32">IP Origen</TableHead>
                    <TableHead className="w-28">Usuario</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="w-32">Sistema</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event) => (
                    <TableRow key={event.id} className="hover:bg-stone-50/50" data-testid={`event-row-${event.id}`}>
                      <TableCell className="font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-stone-400" />
                          {formatDateTime(event.timestamp)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getSeverityIcon(event.severity)}
                          {getSeverityBadge(event.severity)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getEventTypeBadge(event.event_type)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-stone-400" />
                          <span className="font-mono text-sm">{event.source_ip}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-stone-400" />
                          <span className="text-sm">{event.username || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{event.description}</p>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-stone-600 bg-stone-100 px-2 py-1 rounded">
                          {event.source_name || 'Desconocido'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12" data-testid="no-events">
              <Activity className="w-12 h-12 mx-auto mb-4 text-stone-300" />
              <h3 className="text-lg font-medium text-stone-500 mb-2">No se encontraron eventos</h3>
              <p className="text-stone-400">Intenta ajustar los filtros de búsqueda</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginación */}
      {filteredEvents.length > 0 && (
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
              disabled={filteredEvents.length < eventsPerPage}
              variant="outline"
              className="btn-secondary"
              data-testid="next-page-button"
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Resumen de Estado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <Alert className="glass-card border-blue-200 bg-blue-50/50">
          <Activity className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            <div className="font-medium text-blue-800">Monitoreo Activo</div>
            <div className="text-sm text-blue-600 mt-1">
              Sistema registrando eventos en tiempo real
            </div>
          </AlertDescription>
        </Alert>
        
        <Alert className="glass-card border-green-200 bg-green-50/50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <div className="font-medium text-green-800">Reglas Activas</div>
            <div className="text-sm text-green-600 mt-1">
              Correlación automática funcionando
            </div>
          </AlertDescription>
        </Alert>
        
        <Alert className="glass-card border-amber-200 bg-amber-50/50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            <div className="font-medium text-amber-800">Zona Horaria</div>
            <div className="text-sm text-amber-600 mt-1">
              América/Asunción (UTC-3)
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default Events;