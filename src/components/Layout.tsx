import React, { useState } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import UpdatesNotification from './UpdatesNotification';
import PWAPrompt from './PWAPrompt';
import { useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { CURRENT_VERSION } from '../lib/changelog';
import { isSuperAdminEmail } from '../lib/utils';

export default function Layout() {
  const { user, profile, loading, logout, isAdmin, impersonatedUser, impersonateUser, originalUser } = useAuth();
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    'Finanzas': false,
    'Comercio': false,
  });

  const toggleMenu = (menuName: string) => {
    setOpenMenus(prev => ({ ...prev, [menuName]: !prev[menuName] }));
  };

  // Silent automatic migration of unassigned checks to Almacenes Derick on startup
  useEffect(() => {
    let active = true;
    const runSilentMigration = async () => {
      try {
        // Query unassigned checks (checks with no enterpriseId)
        const checksQ = query(collection(db, 'checks'));
        const checksSnap = await getDocs(checksQ);
        const unassignedChecks = checksSnap.docs.filter(d => !d.data().enterpriseId);
        
        if (unassignedChecks.length === 0) return;

        // Get Almacenes Derick enterprise ID
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

        // Migrate all unassigned checks
        for (const checkDoc of unassignedChecks) {
          if (!active) break;
          await updateDoc(doc(db, 'checks', checkDoc.id), {
            enterpriseId: targetId
          });
        }

        // Also migrate unassigned invoices and beneficiaries to keep them clean
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

        console.log(`[Auto-Migration] Successfully migrated ${unassignedChecks.length} unassigned checks to Almacenes Derick.`);
      } catch (e) {
        console.error("Error in automatic background checks migration:", e);
      }
    };

    if (user && profile) {
      runSilentMigration();
    }

    return () => {
      active = false;
    };
  }, [user, profile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!profile && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  const navigation = profile?.role === 'BODEGUERO' 
    ? [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Inventario', href: '/inventory', icon: Store },
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
        { name: 'Inventario', href: '/inventory', icon: Store },
        { name: 'Configuración', href: '/settings', icon: Settings },
      ];

  const canAccessAdmin = isSuperAdminEmail(originalUser?.email);
  if (canAccessAdmin && profile?.role !== 'BODEGUERO') {
    navigation.push({ name: 'Admin', href: '/admin', icon: Shield });
  }

  const isSubItemActive = (subItems?: {href: string}[]) => {
    return subItems?.some(item => location.pathname === item.href) || false;
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col md:flex-row transition-colors duration-300">
      <UpdatesNotification />
      <PWAPrompt />
      {/* Sidebar - Hidden on mobile, shown as bottom nav on mobile */}
      <div className="hidden md:flex w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex-col sticky top-0 h-screen">
        <div className="h-20 flex items-center px-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="h-10 w-10 bg-indigo-600 dark:bg-indigo-500 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-indigo-200 dark:shadow-none">
            <CheckCircle className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col truncate">
            <span className="text-lg font-bold text-neutral-900 dark:text-neutral-50 truncate">
              {profile?.name || 'Control 360°'}
            </span>
            {(!profile?.name) && <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">by Trennd</span>}
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isActive = item.href ? location.pathname === item.href : isSubItemActive(item.subItems);
            
            return (
              <div key={item.name} className="flex flex-col">
                {hasSubItems ? (
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 shadow-sm'
                        : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center">
                      <item.icon
                        className={`mr-3 flex-shrink-0 h-5 w-5 ${
                          isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-400 dark:text-neutral-500'
                        }`}
                      />
                      {item.name}
                    </div>
                    {openMenus[item.name] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                ) : (
                  <Link
                    to={item.href!}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 shadow-sm'
                        : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-200'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 flex-shrink-0 h-5 w-5 ${
                        isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-400 dark:text-neutral-500'
                      }`}
                    />
                    {item.name}
                  </Link>
                )}
                
                {hasSubItems && openMenus[item.name] && (
                  <div className="mt-1 ml-4 space-y-1 pl-4 border-l-2 border-neutral-100 dark:border-neutral-800">
                    {item.subItems!.map(subItem => {
                      const isSubActive = location.pathname === subItem.href;
                      return (
                        <Link
                          key={subItem.name}
                          to={subItem.href}
                          className={`flex items-center px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                            isSubActive
                              ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20'
                              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                          }`}
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

        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 space-y-4">
          <div className="flex items-center p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
            <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold shadow-inner">
              {profile?.name?.charAt(0) || user.email?.charAt(0)}
            </div>
            <div className="ml-3 truncate">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">{profile?.name}</p>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate tracking-tight">{user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-200"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Cerrar Sesión
          </button>
          <div className="pt-2">
            <p className="text-[9px] text-neutral-400 dark:text-neutral-600 font-mono text-center tracking-widest uppercase">Control 360° v{CURRENT_VERSION}</p>
          </div>
        </div>
      </div>

      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-50">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-indigo-600 dark:bg-indigo-500 rounded-lg flex items-center justify-center mr-2">
            <CheckCircle className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-neutral-900 dark:text-neutral-50 truncate max-w-[150px]">
            {profile?.name || 'Control 360°'}
          </span>
        </div>
        <button
          onClick={logout}
          className="p-2 text-red-600 dark:text-red-400"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden pb-20 md:pb-0">
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
        <main className="flex-1 p-4 md:p-8 bg-neutral-50 dark:bg-neutral-950 transition-colors duration-300">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex justify-around items-center h-16 px-2 z-50">
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
                    const isSubActive = location.pathname === subItem.href;
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

      {/* WhatsApp Floating Button */}
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
