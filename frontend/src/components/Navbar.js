import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Shield, LayoutDashboard, Activity, AlertTriangle, BookOpen, FileText, User, LogOut, Menu, X } from 'lucide-react';

const Navbar = ({ user, onLogout }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/events', label: 'Eventos', icon: Activity },
    { path: '/alerts', label: 'Alertas', icon: AlertTriangle },
    { path: '/security-tips', label: 'Consejos', icon: BookOpen },
    { path: '/reports', label: 'Reportes', icon: FileText },
  ];

  const isActive = (path) => location.pathname === path;

  const getRoleBadgeColor = (rol) => {
    switch (rol) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'analista': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <>
      <nav className="siem-navbar" data-testid="main-navbar">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-3 group" data-testid="logo-link">
              <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-stone-800 to-amber-700 bg-clip-text text-transparent hidden sm:block">
                SIEM PYMEs
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      isActive(item.path)
                        ? 'bg-amber-100 text-amber-800 shadow-sm'
                        : 'text-stone-600 hover:text-amber-700 hover:bg-amber-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 hover:bg-amber-50" data-testid="user-menu-trigger">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium text-stone-900">
                        {user?.nombre_completo || 'Usuario'}
                      </div>
                      <Badge 
                        className={`text-xs ${getRoleBadgeColor(user?.rol)} mt-0.5`}
                        data-testid="user-role-badge"
                      >
                        {user?.rol || 'usuario'}
                      </Badge>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.nombre_completo}</p>
                  <p className="text-xs text-stone-500">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-red-600 focus:text-red-600" data-testid="logout-button">
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-button"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" 
          onClick={() => setMobileMenuOpen(false)}
          data-testid="mobile-menu-overlay"
        >
          <div 
            className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] glass-card border-l border-white/20 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-semibold text-stone-900">Navegación</h2>
              <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 w-full ${
                      isActive(item.path)
                        ? 'bg-amber-100 text-amber-800 shadow-sm'
                        : 'text-stone-600 hover:text-amber-700 hover:bg-amber-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;