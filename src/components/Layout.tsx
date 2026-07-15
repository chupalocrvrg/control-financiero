import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { 
  LayoutDashboard, 
  FilePlus, 
  Search, 
  Settings, 
  LogOut, 
  CheckCircle, 
  Shield, 
  MessageCircle, 
  ShieldAlert,
  Banknote,
  Store,
  ShoppingCart,
  Receipt,
  Target,
  Users,
  ClipboardList,
  ChevronDown,
  Package,
  Home,
  ArrowLeftRight,
  Bell,
  Clock,
  ShieldCheck,
  Trash2
} from 'lucide-react';
import UpdatesNotification from './UpdatesNotification';
import PWAPrompt from './PWAPrompt';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { CURRENT_VERSION } from '../lib/changelog';
import { isSuperAdminEmail, cn } from '../lib/utils';

export default function Layout() {
  const { settings } = useSettings();
  const { user, profile, loading, logout, isAdmin, impersonatedUser, impersonateUser, originalUser } = useAuth();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    'Finanzas': false,
    'Comercio': false,
    'Inventario': false,
    'Admin': false
  });
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsSidebarCollapsed(true);
        // Also close all menus when collapsing
        setOpenMenus({});
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMenu = (menuName: string) => {
    setIsSidebarCollapsed(false);
    setOpenMenus(prev => ({ ...prev, [menuName]: !prev[menuName] }));
  };

  const handleSidebarClick = () => {
    if (isSidebarCollapsed) {
      setIsSidebarCollapsed(false);
    }
  };

  // Silent automatic migration of unassigned checks to Almacenes Derick on startup
  useEffect(() => {
    let active = true;
    const runSilentMigration = async () => {
      try {
        const checksQ = query(collection(db, 'checks'));
        const checksSnap = await getDocs(checksQ);
        const unassignedChecks = checksSnap.docs.filter(d => !d.data().enterpriseId);
        
        if (unassignedChecks.length === 0) return;

        const usersQ = query(collection(db, 'users'), where('role', '==', 'enterprise'));
        const usersSnap = await getDocs(usersQ);
        const enterprises = usersSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
        const derickUser = enterprises.find(u => 
           u.name?.toLowerCase().includes('derick') || 
           u.name?.toLowerCase().includes('deric') ||
          u.email?.toLowerCase().includes('derick') ||
          u.email?.toLowerCase().includes('deric')
        );
        
        let targetId = '';
        if (derickUser) {
          targetId = derickUser.id;
        } else if (enterprises.length > 0) {
          targetId = enterprises[0].id;
        }

        if (!targetId || !active) return;

        for (const checkDoc of unassignedChecks) {
          if (!active) break;
          await updateDoc(doc(db, 'checks', checkDoc.id), {
            enterpriseId: targetId
          });
        }
        
        const invoicesSnap = await getDocs(collection(db, 'invoices'));
        for (const invoiceDoc of invoicesSnap.docs) {
          if (!active) break;
          if (!invoiceDoc.data().enterpriseId) {
            await updateDoc(doc(db, 'invoices', invoiceDoc.id), {
              enterpriseId: targetId
            });
          }
        }

        const benSnap = await getDocs(collection(db, 'beneficiaries'));
        for (const benDoc of benSnap.docs) {
          if (!active) break;
          if (!benDoc.data().enterpriseId) {
            await updateDoc(doc(db, 'beneficiaries', benDoc.id), {
              enterpriseId: targetId
            });
          }
        }
      } catch (e) {
        console.error("Error in automatic background checks migration:", e);
      }
    };

    if (user && profile && isSuperAdminEmail(originalUser?.email)) {
      runSilentMigration();
    }
    return () => { active = false; };
  }, [user, profile]);

  const isGlass = settings.uiStyle === 'glass' || settings.uiStyle === 'liquid-glass';
  const pos = settings.menuPosition || 'left';
  const isHorizontal = pos === 'top' || pos === 'bottom';
  useEffect(() => {
    if (isGlass) {
      document.documentElement.classList.add('theme-glass');
      if (settings.uiStyle === 'liquid-glass') {
        document.documentElement.classList.add('theme-liquid-glass');
      } else {
        document.documentElement.classList.remove('theme-liquid-glass');
      }
    } else {
      document.documentElement.classList.remove('theme-glass', 'theme-liquid-glass');
    }
    return () => document.documentElement.classList.remove('theme-glass', 'theme-liquid-glass');
  }, [isGlass, settings.uiStyle]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-6" />
        <h2 className="text-xl font-bold text-white tracking-widest uppercase">Verificando Credenciales</h2>
        <p className="text-neutral-500 text-sm mt-2 font-medium">Control 360°</p>
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  if (!profile.hasCompletedOnboarding && profile.role !== 'SUPERADMIN') {
    return <Navigate to="/onboarding" replace />;
  }

  const navigation = profile?.role === 'BODEGUERO' 
    ? [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { 
          name: 'Inventario', 
          icon: ClipboardList,
          subItems: [
            { name: 'Artículos', href: '/inventory/articles', icon: Package },
            { name: 'Bodegas', href: '/inventory/warehouses', icon: Home },
            { name: 'Transferencias', href: '/inventory/transfers', icon: ArrowLeftRight },
            { name: 'Préstamos', href: '/inventory/loans-returns', icon: Package },
            { name: 'Ventas', href: '/inventory/sales', icon: ShoppingCart },
          ]
        },
        { name: 'Configuración', href: '/settings', icon: Settings },
      ]
    : [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        {
          name: 'Finanzas',
          icon: Banknote,
          subItems: [
            { name: 'Ingreso Cheques', href: '/entry', icon: FilePlus },
            { name: 'Consultas', href: '/search', icon: Search },
          ]
        },
        {
          name: 'Comercio',
          icon: Store,
          subItems: [
            { name: 'Ventas', href: '/sales', icon: ShoppingCart },
            { name: 'Cobranza', href: '/collections', icon: Receipt },
            { name: 'Empleados', href: '/employees', icon: Users },
            { name: 'Presupuestos', href: '/budgets', icon: Target },
          ]
        },
        { 
          name: 'Inventario', 
          icon: ClipboardList,
          subItems: [
            { name: 'Artículos', href: '/inventory/articles', icon: Package },
            { name: 'Bodegas', href: '/inventory/warehouses', icon: Home },
            { name: 'Transferencias', href: '/inventory/transfers', icon: ArrowLeftRight },
            { name: 'Préstamos', href: '/inventory/loans-returns', icon: Package },
            { name: 'Ventas', href: '/inventory/sales', icon: ShoppingCart },
          ]
        },
        { name: 'Configuración', href: '/settings', icon: Settings },
      ];

  const canAccessAdmin = isSuperAdminEmail(originalUser?.email);
  if (canAccessAdmin && profile?.role !== 'BODEGUERO') {
    navigation.push({ 
      name: 'Admin', 
      icon: Shield,
      subItems: [
        { name: 'Usuarios', href: '/admin/users', icon: Users },
        { name: 'Asignación / Migración', href: '/admin/migration', icon: ArrowLeftRight },
        { name: 'Versiones', href: '/admin/versions', icon: Clock },
        { name: 'Auditoría', href: '/admin/audit', icon: ShieldCheck },
        { name: 'Papelera', href: '/admin/trash', icon: Trash2 },
        { name: 'Notificaciones', href: '/admin/notifications', icon: Bell },
      ]
    });
  }

  const isSubItemActive = (subItems?: {href: string}[]) => {
    return subItems?.some(item => location.pathname === item.href || location.pathname.startsWith(item.href)) || false;
  };



  // Base layout styles depending on glass/classic
  const containerClass = cn(
    "h-screen overflow-hidden flex flex-col transition-colors duration-300", 
    pos === 'right' ? "md:flex-row-reverse" : 
    pos === 'top' ? "md:flex-col" : 
    pos === 'bottom' ? "md:flex-col-reverse" : 
    "md:flex-row",
    (isGlass || settings.uiStyle === 'liquid-glass')
      ? "bg-[#f0f4f8] dark:bg-[#0a0a0a] relative overflow-hidden" 
      : "bg-neutral-50 dark:bg-neutral-950"
  );

  const sidebarClass = cn(
    "hidden md:flex sticky z-40 transition-all duration-300",
    isHorizontal ? "w-full h-auto flex-row border-b overflow-x-auto items-center" : `flex-col h-screen ${pos === 'right' ? 'border-l' : 'border-r'}`,
    isHorizontal ? "" : (isSidebarCollapsed ? "w-20" : "w-64"),
    isGlass 
      ? "bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border-white/20 dark:border-neutral-800/30" 
      : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
  );

  return (
    <div className={containerClass}>
      <UpdatesNotification />
      <PWAPrompt />
      {isGlass && settings.uiStyle !== 'liquid-glass' && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute inset-0 dark:hidden bg-gradient-to-br from-[#e0e7ff] via-[#fae8ff] to-[#f3e8ff] opacity-60" />
          <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-r from-blue-500/40 to-cyan-400/40 dark:from-orange-500/20 dark:to-amber-500/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse duration-1000" />
          <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-bl from-pink-500/40 to-purple-500/40 dark:from-red-600/20 dark:to-orange-500/20 blur-[150px] mix-blend-multiply dark:mix-blend-screen" />
          <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-yellow-400/40 to-pink-500/40 dark:from-indigo-600/20 dark:to-purple-900/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
        </div>
      )}
      {settings.uiStyle === 'liquid-glass' && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden transition-opacity duration-1000">
          {(settings.liquidBackgroundType || 'gradient') === 'gradient' && (
            <>
              <div className="absolute inset-0 dark:hidden bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 via-purple-500/30 to-pink-500/30 dark:from-indigo-900/60 dark:via-purple-900/60 dark:to-pink-900/60 blur-3xl saturate-200 opacity-80 dark:opacity-60 animate-in fade-in" />
              <div className="absolute top-[10%] left-[10%] w-[40%] h-[40%] rounded-full bg-blue-400/30 dark:bg-blue-600/30 blur-[100px] animate-pulse" />
              <div className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] rounded-full bg-pink-400/30 dark:bg-pink-600/30 blur-[120px] animate-pulse delay-1000" />
            </>
          )}
          {settings.liquidBackgroundType === 'animated' && (
             <div className="absolute inset-0 bg-[linear-gradient(45deg,#ff000022,#00ff0022,#0000ff22)] bg-[length:400%_400%] animate-pulse blur-2xl saturate-150" />
          )}
          {settings.liquidBackgroundType === 'custom' && settings.liquidBackgroundValue && (
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-md opacity-60 dark:opacity-40 scale-105"
              style={{ backgroundImage: `url(${settings.liquidBackgroundValue})` }}
            />
          )}
          {/* Base Noise overlay for all liquid glass */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-30 mix-blend-overlay pointer-events-none" />
        </div>
      )}

      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={sidebarClass}
        onClick={handleSidebarClick}
      >
        <div className={cn("flex items-center px-4 border-neutral-200 dark:border-neutral-800/50", isHorizontal ? "h-16 border-r flex-shrink-0" : "h-20 border-b")}>
          <div className="h-10 w-10 min-w-[40px] bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl flex items-center justify-center mr-3 shadow-md mx-auto md:mx-0">
            <img src="/logo.svg" alt="Control 360°" className="h-7 w-7" referrerPolicy="no-referrer" />
          </div>
          {!isSidebarCollapsed && (
            <div className="flex flex-col truncate animate-in fade-in duration-300">
              <span className="text-lg font-bold text-neutral-900 dark:text-neutral-50 truncate">
                Control 360°
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                {profile?.role === 'SUPERADMIN' ? 'Admin Panel' : 'Plataforma'}
              </span>
            </div>
          )}
        </div>

        <nav className={cn("flex-1 p-3 custom-scrollbar", isHorizontal ? "flex flex-row overflow-x-auto space-x-1 items-center" : "overflow-y-auto space-y-1")}>
          {navigation.map((item) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isActive = item.href ? location.pathname === item.href || location.pathname.startsWith(item.href) : isSubItemActive(item.subItems);
            
            if (!hasSubItems) {
              return (
                <Link
                  key={item.name}
                  to={item.href!}
                  onClick={() => window.innerWidth < 768 && setIsSidebarCollapsed(true)}
                  className={cn(
                    "flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative",
                    isActive
                      ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 shadow-sm"
                      : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 flex-shrink-0", !isSidebarCollapsed && "mr-3", isActive && "scale-110 transition-transform")} />
                  {!isSidebarCollapsed && <span className="animate-in fade-in duration-300">{item.name}</span>}
                  
                  {/* Tooltip for collapsed state */}
                  {isSidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                      {item.name}
                    </div>
                  )}
                </Link>
              );
            }

            return (
              <div key={item.name} className="space-y-1 relative group">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleMenu(item.name); }}
                  className={cn(
                    "w-full flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                    isActive && !openMenus[item.name]
                      ? "bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                      : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/50",
                    openMenus[item.name] && "text-indigo-700 dark:text-indigo-300 bg-indigo-50/30 dark:bg-indigo-900/10"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 flex-shrink-0", !isSidebarCollapsed && "mr-3", isActive && "scale-110 transition-transform")} />
                  {!isSidebarCollapsed && (
                    <>
                      <span className="flex-1 text-left animate-in fade-in duration-300">{item.name}</span>
                      <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", openMenus[item.name] && "transform rotate-180")} />
                    </>
                  )}
                </button>
                
                {/* Tooltip for collapsed state */}
                {isSidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                    {item.name}
                  </div>
                )}

                {openMenus[item.name] && !isSidebarCollapsed && (
                  <div className={cn("pr-2 py-2 animate-in slide-in-from-top-2 duration-200", isHorizontal ? "absolute top-full left-0 mt-1 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl z-50 p-2 space-y-1" : "pl-10 space-y-1")}>
                    {item.subItems!.map(subItem => {
                      const isSubActive = location.pathname === subItem.href || location.pathname.startsWith(subItem.href);
                      return (
                        <Link
                          key={subItem.name}
                          to={subItem.href}
                          className={cn(
                            "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all",
                            isSubActive
                              ? "bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300"
                              : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
                          )}
                        >
                          <subItem.icon className="w-4 h-4 mr-3" />
                          {subItem.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800/50 space-y-4">
          <div className="flex items-center p-2 rounded-xl bg-neutral-100/50 dark:bg-neutral-800/30">
            <div className="h-10 w-10 min-w-[40px] rounded-xl bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold shadow-inner">
              {profile?.name?.charAt(0) || user.email?.charAt(0)}
            </div>
            {!isSidebarCollapsed && (
              <div className="ml-3 truncate animate-in fade-in duration-300">
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">{profile?.name}</p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate tracking-tight">{user.email}</p>
              </div>
            )}
          </div>
          
          <button
            onClick={logout}
            className={cn(
              "flex items-center px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-200",
              isSidebarCollapsed ? "justify-center w-full" : "w-full"
            )}
          >
            <LogOut className={cn("h-5 w-5", !isSidebarCollapsed && "mr-3")} />
            {!isSidebarCollapsed && <span>Cerrar Sesión</span>}
          </button>
          
          {!isSidebarCollapsed && (
            <div className="pt-2 animate-in fade-in duration-300">
              <p className="text-[9px] text-neutral-400 dark:text-neutral-600 font-mono text-center tracking-widest uppercase">Control 360° v{CURRENT_VERSION}</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile top bar */}
      <div className={cn(
        "md:hidden flex items-center justify-between p-4 border-b sticky top-0 z-50 transition-colors",
        isGlass 
          ? "bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-neutral-200/50 dark:border-neutral-800/50" 
          : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
      )}>
        <div className="flex items-center">
          <div className="h-8 w-8 bg-indigo-600 dark:bg-indigo-500 rounded-lg flex items-center justify-center mr-2">
            <CheckCircle className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-neutral-900 dark:text-neutral-50 truncate max-w-[150px]">
            {profile?.name || 'Control 360°'}
          </span>
        </div>
        <button onClick={logout} className="p-2 text-red-600 dark:text-red-400">
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto overflow-x-hidden pb-20 md:pb-0 relative z-10">
        {impersonatedUser && (
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 text-white font-semibold py-3.5 px-6 md:px-8 flex flex-col sm:flex-row justify-between items-center gap-3 shadow-md animate-in slide-in-from-top duration-500 sticky top-0 z-[100] border-b border-indigo-500/30">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
              </span>
              <p className="text-xs md:text-sm tracking-wide">
                <span className="font-black uppercase bg-indigo-950/50 px-2 py-0.5 rounded text-[9px] mr-2">Simulación Activa</span>
                Interactuando como <span className="font-bold underline">{profile?.name || impersonatedUser.displayName || 'Control 360°'}</span> (<span className="font-mono text-xs text-indigo-200">{impersonatedUser.email}</span>)
              </p>
            </div>
            <button
              onClick={() => impersonateUser(null)}
              className="flex items-center gap-2 px-4 py-1.5 bg-white hover:bg-neutral-100 text-indigo-700 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200 hover:scale-[1.03] active:scale-95 shadow cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
              Salir de Simulación
            </button>
          </div>
        )}
        
        <main className={cn(
          "relative z-10 flex-1 p-4 md:p-8 transition-colors duration-300",
          !isGlass && "bg-neutral-50 dark:bg-neutral-950"
        )}>
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <div className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 border-t flex justify-around items-center h-16 px-2 z-50",
        isGlass 
          ? "bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-neutral-200/50 dark:border-neutral-800/50"
          : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
      )}>
        {navigation.map((item) => {
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isActive = item.href ? location.pathname === item.href : isSubItemActive(item.subItems);
          
          return hasSubItems ? (
            <div key={item.name} className="relative flex-1 h-full">
              <button
                onClick={() => toggleMenu(item.name)}
                className={`w-full flex flex-col items-center justify-center h-full rounded-xl transition-all ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                <item.icon className={`h-5 w-5 mb-1 ${isActive ? 'scale-110' : ''}`} />
                <span className="text-[10px] font-bold uppercase tracking-tight">{item.name}</span>
              </button>
              {openMenus[item.name] && (
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl flex flex-col p-2 gap-1 mb-2 animate-in slide-in-from-bottom-4">
                  {item.subItems!.map(subItem => {
                    const isSubActive = location.pathname === subItem.href || location.pathname.startsWith(subItem.href);
                    return (
                      <Link
                        key={subItem.name}
                        to={subItem.href}
                        onClick={() => toggleMenu(item.name)}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                          isSubActive
                            ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                            : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <subItem.icon className="w-4 h-4 mr-3" />
                        {subItem.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <Link
              key={item.name}
              to={item.href!}
              className={`flex flex-col items-center justify-center flex-1 h-full rounded-xl transition-all ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-neutral-500 dark:text-neutral-400'
              }`}
            >
              <item.icon className={`h-5 w-5 mb-1 ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-bold uppercase tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </div>

      <a
        href="https://wa.me/593985441487?text=Hola,%20necesito%20soporte%20con%20la%20App%20Control%20Cheques"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-[100] flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white p-3 md:px-5 md:py-3 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 font-bold group"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="hidden md:inline max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap">
          Soporte / Ventas
        </span>
      </a>
    </div>
  );
}
