import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ArticlesTab from '../components/inventory/ArticlesTab';
import WarehousesTab from '../components/inventory/WarehousesTab';
import TransfersTab from '../components/inventory/TransfersTab';
import LoansReturnsTab from '../components/inventory/LoansReturnsTab';
import SalesTab from '../components/inventory/SalesTab';
import { Package, Home, ArrowLeftRight, ShoppingBag, ShoppingCart, Store } from 'lucide-react';
import { cn } from '../lib/utils';

type TabType = 'articles' | 'warehouses' | 'transfers' | 'loans-returns' | 'sales';

export default function Inventory() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('articles');

  const tabs = [
    { id: 'articles', name: 'Artículos', icon: Package },
    { id: 'warehouses', name: 'Bodegas', icon: Home },
    { id: 'transfers', name: 'Transferencias', icon: ArrowLeftRight },
    { id: 'loans-returns', name: 'Préstamos / Devoluciones', icon: ShoppingBag },
    { id: 'sales', name: 'Ventas de Almacén', icon: ShoppingCart },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-in fade-in duration-300">
      {/* Title block */}
      <div className="flex items-center gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div className="w-14 h-14 bg-indigo-600 dark:bg-indigo-500 rounded-[1.5rem] flex items-center justify-center text-white shadow-lg shadow-indigo-100 dark:shadow-none">
          <Store className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-50 tracking-tighter uppercase italic">Control de Inventario</h1>
          <p className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
            {profile?.role === 'BODEGUERO' 
              ? `Terminal de Almacén • Operando para la empresa: ${profile.enterpriseName || 'Asignada'}` 
              : 'Gestión Completa de Stock, Bodegas, Distribución y Ventas de Almacén'}
          </p>
        </div>
      </div>

      {/* Tabs list switcher */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto scrollbar-none gap-2 pb-0.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={cn(
                "flex items-center gap-2 px-5 py-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all whitespace-nowrap",
                isActive
                  ? "border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 font-extrabold"
                  : "border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Active Tab Screen */}
      <div className="min-h-[500px]">
        {activeTab === 'articles' && <ArticlesTab />}
        {activeTab === 'warehouses' && <WarehousesTab />}
        {activeTab === 'transfers' && <TransfersTab />}
        {activeTab === 'loans-returns' && <LoansReturnsTab />}
        {activeTab === 'sales' && <SalesTab />}
      </div>
    </div>
  );
}
