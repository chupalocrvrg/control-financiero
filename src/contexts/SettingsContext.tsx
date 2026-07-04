import React, { createContext, useContext, useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

type Theme = 'light' | 'dark' | 'system';
type Currency = 'USD' | 'EUR' | 'ARS' | 'CLP' | 'BRL';

interface Settings {
  theme: Theme;
  currency: Currency;
  language: string;
  iva: number;
  banks?: string[];
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('app-settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved settings:', e);
      }
    }
    return {
      theme: 'system',
      currency: 'USD',
      language: 'es',
      iva: 15,
    };
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: () => void = () => {};

    const setupSettings = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      const settingsRef = doc(db, 'settings', user.uid);
      
      unsubscribe = onSnapshot(settingsRef, (docSnap) => {
        if (docSnap.exists()) {
          setSettings(docSnap.data() as Settings);
        } else {
          // Initialize default settings if they don't exist
          setDoc(settingsRef, {
            theme: 'system',
            currency: 'USD',
            language: 'es',
            iva: 15,
          }).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `settings/${user.uid}`);
          });
        }
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `settings/${user.uid}`);
        setLoading(false);
      });
    };

    const authUnsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setupSettings();
      } else {
        setLoading(false);
        unsubscribe();
      }
    });

    return () => {
      authUnsubscribe();
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const applyTheme = (theme: Theme) => {
      console.log('Applying theme:', theme);
      root.classList.remove('light', 'dark');
      let appliedTheme: 'light' | 'dark';
      
      if (theme === 'system') {
        appliedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        console.log('System theme resolved to:', appliedTheme);
      } else {
        appliedTheme = theme as 'light' | 'dark';
      }
      
      root.classList.add(appliedTheme);
      root.style.colorScheme = appliedTheme;
      console.log('Root classes after update:', root.className);
    };

    applyTheme(settings.theme);

    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme('system');
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [settings.theme]);

  const updateSettings = async (newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('app-settings', JSON.stringify(updated));

    const user = auth.currentUser;
    if (user) {
      const settingsRef = doc(db, 'settings', user.uid);
      try {
        await setDoc(settingsRef, updated);
        // Only log major setting changes worth auditing
        if (newSettings.iva !== undefined || newSettings.currency !== undefined || newSettings.banks !== undefined) {
          import('../lib/audit').then(({ logAudit, AuditAction }) => {
            logAudit(AuditAction.SETTINGS_UPDATE, `Configuraciones de sistema actualizadas: ${Object.keys(newSettings).join(', ')}`);
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `settings/${user.uid}`);
      }
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
