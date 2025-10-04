import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Alert, AlertDescription } from './ui/alert';
import { 
  FileText, 
  Download, 
  Calendar as CalendarIcon, 
  BarChart3, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  Activity,
  Eye
} from 'lucide-react';
import axios from 'axios';
import { toast } from '../hooks/use-toast';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: addDays(new Date(), 7)
  });

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/reports/monthly?year=${selectedYear}&month=${selectedMonth}`, {
        responseType: 'blob'
      });
      
      // Crear URL para descargar el PDF
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_mensual_${selectedMonth}_${selectedYear}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Reporte Generado",
        description: `El reporte mensual de ${selectedMonth}/${selectedYear} se ha descargado exitosamente`,
      });
    } catch (error) {
      console.error('Error generando reporte:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el reporte",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  // Datos de ejemplo para KPIs
  const mockKPIs = {
    mtta: 24, // Minutos
    volumePorFuente: [
      { fuente: 'Servidores Web', eventos: 1247 },
      { fuente: 'Firewall', eventos: 892 },
      { fuente: 'Sistema Login', eventos: 634 },
      { fuente: 'Base de Datos', eventos: 421 }
    ],
    tasaFalsosPositivos: 12.3, // Porcentaje
    incidentesCriticos: 3,
    tiempoResolucion: 48, // Horas promedio
    disponibilidadSistema: 99.7 // Porcentaje
  };

  return (
    <div className="p-4 lg:p-8 animate-fade-in-up" data-testid="reports-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-stone-900 mb-2">
          Centro de Reportes
        </h1>
        <p className="text-stone-600 text-lg">
          Generación de informes ejecutivos y análisis de KPIs de seguridad
        </p>
      </div>

      {/* KPIs Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <Card className="glass-card" data-testid="kpi-mtta">
          <CardContent className="p-4">
            <div className="text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-sm text-stone-600 font-medium">MTTA</p>
              <p className="text-2xl font-bold text-blue-600">{mockKPIs.mtta}m</p>
              <p className="text-xs text-stone-500">Tiempo prom. alerta</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card" data-testid="kpi-false-positives">
          <CardContent className="p-4">
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-sm text-stone-600 font-medium">Falsos +</p>
              <p className="text-2xl font-bold text-yellow-600">{mockKPIs.tasaFalsosPositivos}%</p>
              <p className="text-xs text-stone-500">Tasa mensual</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card" data-testid="kpi-critical-incidents">
          <CardContent className="p-4">
            <div className="text-center">
              <Shield className="w-8 h-8 mx-auto mb-2 text-red-500" />
              <p className="text-sm text-stone-600 font-medium">Críticos</p>
              <p className="text-2xl font-bold text-red-600">{mockKPIs.incidentesCriticos}</p>
              <p className="text-xs text-stone-500">Este mes</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card" data-testid="kpi-resolution-time">
          <CardContent className="p-4">
            <div className="text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm text-stone-600 font-medium">Resolución</p>
              <p className="text-2xl font-bold text-green-600">{mockKPIs.tiempoResolucion}h</p>
              <p className="text-xs text-stone-500">Tiempo promedio</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card" data-testid="kpi-uptime">
          <CardContent className="p-4">
            <div className="text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <p className="text-sm text-stone-600 font-medium">Uptime</p>
              <p className="text-2xl font-bold text-purple-600">{mockKPIs.disponibilidadSistema}%</p>
              <p className="text-xs text-stone-500">Disponibilidad</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card" data-testid="kpi-events">
          <CardContent className="p-4">
            <div className="text-center">
              <Activity className="w-8 h-8 mx-auto mb-2 text-indigo-500" />
              <p className="text-sm text-stone-600 font-medium">Eventos</p>
              <p className="text-2xl font-bold text-indigo-600">3.2K</p>
              <p className="text-xs text-stone-500">Esta semana</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Generador de Reportes */}
        <Card className="glass-card" data-testid="report-generator">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Generador de Reportes Mensuales
            </CardTitle>
            <CardDescription>
              Genera reportes ejecutivos en formato PDF con análisis completo de seguridad
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700">Mes</label>
                  <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                    <SelectTrigger className="siem-select" data-testid="month-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700">Año</label>
                  <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                    <SelectTrigger className="siem-select" data-testid="year-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200/50">
                <h4 className="font-semibold text-amber-800 mb-2">El reporte incluirá:</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Resumen ejecutivo del período</li>
                  <li>• Total de eventos y clasificación por severidad</li>
                  <li>• Incidentes críticos y tiempos de atención</li>
                  <li>• Tendencias y análisis comparativo</li>
                  <li>• Recomendaciones específicas de mejora</li>
                  <li>• KPIs y métricas de desempeño</li>
                </ul>
              </div>
              
              <Button 
                onClick={handleGenerateReport}
                disabled={loading}
                className="w-full btn-primary"
                data-testid="generate-report-button"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Generando Reporte...
                  </div>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Generar Reporte PDF
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Panel de KPIs Detallados */}
        <Card className="glass-card" data-testid="kpi-details">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Análisis de KPIs
            </CardTitle>
            <CardDescription>
              Métricas clave de rendimiento del sistema SIEM
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Volumen por Fuente */}
              <div>
                <h4 className="font-semibold text-stone-900 mb-3">Volumen de Eventos por Fuente</h4>
                <div className="space-y-3">
                  {mockKPIs.volumePorFuente.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-stone-50/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"></div>
                        <span className="font-medium text-stone-700">{item.fuente}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-stone-900">{item.eventos.toLocaleString()}</div>
                        <div className="text-xs text-stone-500">eventos</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Métricas de Calidad */}
              <div>
                <h4 className="font-semibold text-stone-900 mb-3">Métricas de Calidad</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-stone-700">Precisión de Detección</span>
                    </div>
                    <span className="font-bold text-blue-600">87.7%</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50/50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="font-medium text-stone-700">Eventos Procesados</span>
                    </div>
                    <span className="font-bold text-green-600">99.9%</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-purple-50/50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-500" />
                      <span className="font-medium text-stone-700">Mejora vs Mes Anterior</span>
                    </div>
                    <span className="font-bold text-purple-600">+15%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información Adicional */}
      <div className="mt-8 space-y-4">
        <Alert className="glass-card border-blue-200 bg-blue-50/50">
          <CalendarIcon className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            <div className="font-medium text-blue-800 mb-1">Horario de Generación</div>
            <div className="text-sm text-blue-600">
              Los reportes se generan en tiempo real usando la zona horaria América/Asunción. 
              La información incluye datos hasta la fecha y hora actual del sistema.
            </div>
          </AlertDescription>
        </Alert>
        
        <Alert className="glass-card border-green-200 bg-green-50/50">
          <FileText className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <div className="font-medium text-green-800 mb-1">Formato del Reporte</div>
            <div className="text-sm text-green-600">
              Los reportes se generan en formato PDF estándar, optimizados para visualización e impresión. 
              Incluyen gráficos, tablas y recomendaciones específicas para tu organización.
            </div>
          </AlertDescription>
        </Alert>
        
        <Alert className="glass-card border-amber-200 bg-amber-50/50">
          <Shield className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            <div className="font-medium text-amber-800 mb-1">Confidencialidad</div>
            <div className="text-sm text-amber-600">
              Todos los reportes contienen información sensible de seguridad. 
              Maneja estos documentos de acuerdo a las políticas de confidencialidad de tu organización.
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default Reports;