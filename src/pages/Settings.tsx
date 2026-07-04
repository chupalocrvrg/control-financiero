import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { Save, Plus, Trash2, Send, MessageCircle, Shield, Globe, Palette, Moon, Sun, Monitor, Bell, Calculator, Building } from 'lucide-react';
import { format, isBefore, isToday, isTomorrow, parseISO, startOfDay } from 'date-fns';
import { formatCurrency, cn } from '../lib/utils';

interface Recipient {
  name: string;
  phone: string;
  email: string;
}

interface Check {
  id: string;
  beneficiaryName: string;
  checkNumber: string;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'PAID';
}

export default function Settings() {
  const { user } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [loading, setLoading] = useState(false);
  const { profile, updateProfile } = useAuth();
  const [securityData, setSecurityData] = useState({
    pin: '',
    pinInactivityLimit: 60,
  });

  useEffect(() => {
    if (user) {
      if (profile) {
        setSecurityData({
          pin: profile.pin || '',
          pinInactivityLimit: profile.pinInactivityLimit || 60,
        });
      }
    }
  }, [user, profile]);

  const handleSaveSecurity = async () => {
    if (securityData.pin.length !== 6) {
      alert("El PIN debe tener 6 dígitos");
      return;
    }
    setLoading(true);
    try {
      await updateProfile(securityData);
      import('../lib/audit').then(({ logAudit, AuditAction }) => {
        logAudit(AuditAction.SETTINGS_UPDATE, `Actualización de parámetros de seguridad: PIN/Inactividad`);
      });
      alert("Configuración de seguridad actualizada");
    } catch (e) {
      alert("Error al actualizar seguridad");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBank = () => {
    const currentBanks = settings.banks || [];
    updateSettings({ banks: [...currentBanks, ''] });
  };

  const handleBankChange = (index: number, val: string) => {
    const currentBanks = [...(settings.banks || [])];
    currentBanks[index] = val;
    updateSettings({ banks: currentBanks });
  };

  const handleRemoveBank = (index: number) => {
    const currentBanks = [...(settings.banks || [])];
    currentBanks.splice(index, 1);
    updateSettings({ banks: currentBanks });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <header>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">Configuración de Sistema</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-2">Ajusta las preferencias de visualización, moneda y seguridad del panel.</p>
      </header>

      {/* Preferencias de Interfaz */}
      <section className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 dark:text-indigo-400">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">Apariencia y Localización</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Personaliza tu experiencia visual</p>
          </div>
        </div>
        
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <label className="text-sm font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
              <Moon className="w-4 h-4" /> Tema del Sistema
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'light', name: 'Claro', icon: Sun },
                { id: 'dark', name: 'Oscuro', icon: Moon },
                { id: 'system', name: 'Auto', icon: Monitor },
              ].map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => updateSettings({ theme: theme.id as any })}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 gap-2 font-medium text-sm",
                    settings.theme === theme.id
                      ? "bg-indigo-50 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 shadow-sm"
                      : "bg-white dark:bg-neutral-800/40 border-neutral-100 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:border-indigo-200 dark:hover:border-indigo-800"
                  )}
                >
                  <theme.icon className="w-5 h-5" />
                  {theme.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
              <Globe className="w-4 h-4" /> Moneda de Visualización
            </label>
            <select
              value={settings.currency}
              onChange={(e) => updateSettings({ currency: e.target.value as any })}
              className="w-full bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-4 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              <option value="USD">Dólar Estadounidense (USD)</option>
              <option value="EUR">Euro (EUR)</option>
              <option value="ARS">Peso Argentino (ARS)</option>
              <option value="CLP">Peso Chileno (CLP)</option>
              <option value="BRL">Real Brasileño (BRL)</option>
            </select>
            <p className="text-[10px] text-neutral-400 italic">Esto solo afecta la visualización de los montos.</p>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
              <Calculator className="w-4 h-4" /> Configuración de IVA (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={settings.iva}
              onChange={(e) => updateSettings({ iva: parseFloat(e.target.value) || 0 })}
              className="w-full bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-4 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="15"
            />
            <p className="text-[10px] text-neutral-400 italic">Porcentaje de IVA aplicado a retenciones específicas.</p>
          </div>
        </div>
      </section>

      {/* Seguridad Section */}
      <section className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-4">
          <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-2xl text-red-600 dark:text-red-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">Control de Accesos</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Protege tu información sensible</p>
          </div>
        </div>
        
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Código PIN (6 dígitos)</label>
            <input
              type="password"
              maxLength={6}
              value={securityData.pin}
              onChange={(e) => setSecurityData({ ...securityData, pin: e.target.value.replace(/\D/g, '') })}
              className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-4 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono tracking-widest text-lg"
              placeholder="••••••"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Sesión Auto-protegida</label>
            <select
              value={securityData.pinInactivityLimit}
              onChange={(e) => setSecurityData({ ...securityData, pinInactivityLimit: parseInt(e.target.value) })}
              className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-4 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              <option value={1}>Bloqueo: 1 Minuto</option>
              <option value={5}>Bloqueo: 5 Minutos</option>
              <option value={15}>Bloqueo: 15 Minutos</option>
              <option value={60}>Bloqueo: 1 Hora</option>
              <option value={1440}>Bloqueo: 24 Horas</option>
            </select>
          </div>
        </div>
        <div className="px-8 py-4 bg-neutral-50 dark:bg-neutral-950/40 border-t border-neutral-100 dark:border-neutral-800 flex justify-end items-center">
          <button
            onClick={handleSaveSecurity}
            className="px-6 py-3 bg-red-600 dark:bg-red-500 text-white rounded-2xl text-sm font-bold hover:bg-red-700 dark:hover:bg-red-600 transition-all shadow-lg shadow-red-100 dark:shadow-none flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Guardar Seguridad
          </button>
        </div>
      </section>

      {/* Bancos Section */}
      <section className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400">
            <Building className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">Bancos / Entidades Financieras</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Agrega tus bancos (opcional) para clasificar cheques.</p>
          </div>
          <button 
            onClick={handleAddBank}
            className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl font-bold text-sm tracking-wide hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Nuevo Banco
          </button>
        </div>
        
        <div className="p-8 space-y-4">
          {(!settings.banks || settings.banks.length === 0) ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400 italic">No tienes entidades bancarias configuradas. Tus cheques se registrarán de manera general.</p>
          ) : (
            settings.banks.map((bank, idx) => (
              <div key={idx} className="flex gap-4">
                <input 
                  type="text" 
                  value={bank}
                  onChange={e => handleBankChange(idx, e.target.value)}
                  className="flex-1 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-4 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Ej: Banco Pichincha, Guayaquil, etc"
                />
                <button 
                  onClick={() => handleRemoveBank(idx)}
                  className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
