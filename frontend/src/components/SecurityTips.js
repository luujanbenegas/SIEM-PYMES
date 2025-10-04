import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  BookOpen, 
  Shield, 
  Key, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Lock,
  Eye,
  Database,
  Wifi,
  Smartphone,
  FileText,
  Users
} from 'lucide-react';
import axios from 'axios';
import { toast } from '../hooks/use-toast';

const SecurityTips = () => {
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadSecurityTips();
  }, []);

  const loadSecurityTips = async () => {
    try {
      const response = await axios.get('/security-tips');
      setTips(response.data);
    } catch (error) {
      console.error('Error cargando consejos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los consejos de seguridad",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (categoria) => {
    switch (categoria.toLowerCase()) {
      case 'autenticación':
      case 'autenticacion':
        return <Key className="w-5 h-5" />;
      case 'mantenimiento':
        return <RefreshCw className="w-5 h-5" />;
      case 'monitoreo':
        return <Eye className="w-5 h-5" />;
      case 'continuidad':
        return <Database className="w-5 h-5" />;
      case 'red':
        return <Wifi className="w-5 h-5" />;
      case 'dispositivos':
        return <Smartphone className="w-5 h-5" />;
      default:
        return <Shield className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (categoria) => {
    const colors = {
      'autenticación': 'bg-blue-100 text-blue-800 border-blue-200',
      'autenticacion': 'bg-blue-100 text-blue-800 border-blue-200',
      'mantenimiento': 'bg-green-100 text-green-800 border-green-200',
      'monitoreo': 'bg-purple-100 text-purple-800 border-purple-200',
      'continuidad': 'bg-orange-100 text-orange-800 border-orange-200',
      'red': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'dispositivos': 'bg-pink-100 text-pink-800 border-pink-200'
    };
    return colors[categoria.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const categories = [...new Set(tips.map(tip => tip.categoria))];
  
  const filteredTips = selectedCategory === 'all' 
    ? tips 
    : tips.filter(tip => tip.categoria === selectedCategory);

  // Consejos adicionales estáticos específicos para PYMEs
  const extraTips = [
    {
      titulo: "Capacitación del Personal",
      descripcion: "Realiza sesiones trimestrales de capacitación en ciberseguridad para todo el personal. Incluye simulacros de phishing y casos de uso específicos del sector.",
      categoria: "Capacitación"
    },
    {
      titulo: "Segmentación de Red",
      descripcion: "Separa la red administrativa de la red de invitados. Usa VLANs para aislar sistemas críticos de las estaciones de trabajo comunes.",
      categoria: "Red"
    },
    {
      titulo: "Control de Acceso Físico",
      descripcion: "Implementa tarjetas de acceso o códigos para áreas sensibles. Registra todos los accesos físicos a servidores y equipos críticos.",
      categoria: "Físico"
    },
    {
      titulo: "Plan de Respuesta a Incidentes",
      descripcion: "Define roles y responsabilidades claras para respuesta a incidentes. Mantén contactos de emergencia actualizados y realiza simulacros periódicos.",
      categoria: "Respuesta"
    },
    {
      titulo: "Gestión de Proveedores",
      descripcion: "Evalúa la seguridad de terceros que acceden a tus sistemas. Establece acuerdos de confidencialidad y auditorías de seguridad regulares.",
      categoria: "Proveedores"
    },
    {
      titulo: "Política de Dispositivos Móviles",
      descripcion: "Define reglas claras para el uso de dispositivos personales en el trabajo (BYOD). Implementa soluciones MDM para dispositivos corporativos.",
      categoria: "Dispositivos"
    }
  ];

  const allTips = [...tips, ...extraTips];
  const finalFilteredTips = selectedCategory === 'all' 
    ? allTips 
    : allTips.filter(tip => tip.categoria === selectedCategory);

  const allCategories = [...new Set(allTips.map(tip => tip.categoria))];

  return (
    <div className="p-4 lg:p-8 animate-fade-in-up" data-testid="security-tips-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-stone-900 mb-2">
          Centro de Conocimientos de Seguridad
        </h1>
        <p className="text-stone-600 text-lg">
          Mejores prácticas y recomendaciones para mantener tu empresa segura
        </p>
      </div>

      {/* Métricas de Seguridad */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="glass-card" data-testid="tips-total-count">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-600 font-medium">Total Consejos</p>
                <p className="text-2xl font-bold text-stone-900">{allTips.length}</p>
              </div>
              <BookOpen className="w-8 h-8 text-stone-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card" data-testid="categories-count">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-600 font-medium">Categorías</p>
                <p className="text-2xl font-bold text-stone-900">{allCategories.length}</p>
              </div>
              <Shield className="w-8 h-8 text-stone-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card" data-testid="priority-high">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-600 font-medium">Prioridad Alta</p>
                <p className="text-2xl font-bold text-red-600">4</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card" data-testid="implementation-easy">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-600 font-medium">Fácil Implementar</p>
                <p className="text-2xl font-bold text-green-600">8</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros de Categoría */}
      <Card className="glass-card mb-6" data-testid="category-filters">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Categorías de Seguridad
          </CardTitle>
          <CardDescription>
            Filtra los consejos por área de seguridad
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl transition-all ${
                selectedCategory === 'all'
                  ? 'bg-amber-100 text-amber-800 border-2 border-amber-200'
                  : 'bg-stone-100 text-stone-700 border-2 border-stone-200 hover:bg-stone-200'
              }`}
              data-testid="filter-all"
            >
              Todos ({allTips.length})
            </button>
            {allCategories.map((categoria) => (
              <button
                key={categoria}
                onClick={() => setSelectedCategory(categoria)}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                  selectedCategory === categoria
                    ? 'bg-amber-100 text-amber-800 border-2 border-amber-200'
                    : 'bg-stone-100 text-stone-700 border-2 border-stone-200 hover:bg-stone-200'
                }`}
                data-testid={`filter-${categoria.toLowerCase()}`}
              >
                {getCategoryIcon(categoria)}
                {categoria} ({allTips.filter(tip => tip.categoria === categoria).length})
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Consejos */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-testid="tips-loading">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-6">
                <div className="loading-shimmer h-32 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-testid="tips-grid">
          {finalFilteredTips.map((tip, index) => (
            <Card key={`${tip.titulo}-${index}`} className="glass-card hover-lift" data-testid={`tip-card-${index}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl flex items-center justify-center">
                      {getCategoryIcon(tip.categoria)}
                    </div>
                    <div>
                      <CardTitle className="text-lg text-stone-900 mb-1">
                        {tip.titulo}
                      </CardTitle>
                      <Badge className={getCategoryColor(tip.categoria)}>
                        {tip.categoria}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-stone-700 text-base leading-relaxed">
                  {tip.descripcion}
                </CardDescription>
                
                <div className="mt-4 pt-4 border-t border-stone-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-stone-500">
                      {tip.categoria === 'Autenticación' || tip.categoria === 'Autenticacion' ? (
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Prioridad Alta
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Implementación Fácil
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Para PYMEs
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {finalFilteredTips.length === 0 && !loading && (
        <div className="text-center py-12" data-testid="no-tips">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-stone-300" />
          <h3 className="text-lg font-medium text-stone-500 mb-2">No hay consejos en esta categoría</h3>
          <p className="text-stone-400">Selecciona otra categoría para ver más consejos</p>
        </div>
      )}

      {/* Alertas Informativas */}
      <div className="mt-8 space-y-4">
        <Alert className="glass-card border-blue-200 bg-blue-50/50">
          <FileText className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            <div className="font-medium text-blue-800 mb-1">Marco Normativo</div>
            <div className="text-sm text-blue-600">
              Estos consejos están alineados con las mejores prácticas internacionales ISO 27001 y NIST Cybersecurity Framework, 
              adaptados para el contexto de PYMEs en Paraguay.
            </div>
          </AlertDescription>
        </Alert>
        
        <Alert className="glass-card border-amber-200 bg-amber-50/50">
          <Lock className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            <div className="font-medium text-amber-800 mb-1">Implementación Gradual</div>
            <div className="text-sm text-amber-600">
              Comienza por los consejos de autenticación y backup, luego avanza gradualmente hacia controles más complejos. 
              La seguridad es un proceso continuo, no un destino.
            </div>
          </AlertDescription>
        </Alert>
        
        <Alert className="glass-card border-green-200 bg-green-50/50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <div className="font-medium text-green-800 mb-1">Actualización Continua</div>
            <div className="text-sm text-green-600">
              Estos consejos se actualizan regularmente basándose en las últimas amenazas y tendencias de ciberseguridad. 
              Revisa esta sección mensualmente para nuevas recomendaciones.
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default SecurityTips;