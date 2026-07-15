import React, { createContext, useContext, useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

type Theme = 'light' | 'dark' | 'system';
type Currency = 'USD' | 'EUR' | 'ARS' | 'CLP' | 'BRL';
export type UIStyle = 'classic' | 'glass' | 'liquid-glass';

interface Settings {
  theme: Theme;
  currency: Currency;
  language: string;
  iva: number;
  banks?: string[];
  uiStyle?: UIStyle;
  accentColor?: string;
  fontFamily?: string;
  menuPosition?: 'left' | 'right' | 'top' | 'bottom';
  liquidBackgroundType?: 'gradient' | 'animated' | 'custom';
  liquidBackgroundValue?: string;
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
      uiStyle: "classic",
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

      // First, check if user profile has an enterpriseId to load the shared settings
      let targetId = user.uid;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.enterpriseId) {
            targetId = userData.enterpriseId;
          }
        }
      } catch (err) {
        console.warn('Error fetching user profile for settings ID, falling back to user.uid:', err);
      }

      const settingsRef = doc(db, 'settings', targetId);
      
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
      uiStyle: "classic",
          }).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `settings/${targetId}`);
          });
        }
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `settings/${targetId}`);
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

    // Apply Accent Color
    const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
    if (settings.accentColor && settings.accentColor !== "indigo") {
      shades.forEach(shade => {
        root.style.setProperty(`--color-indigo-${shade}`, `var(--color-${settings.accentColor}-${shade})`);
      });
    } else {
      shades.forEach(shade => {
        root.style.removeProperty(`--color-indigo-${shade}`);
      });
    }

    // Apply Font Family
    if (settings.fontFamily) {
      root.style.setProperty("--font-sans", settings.fontFamily);
    } else {
      root.style.removeProperty("--font-sans");
    }

    applyTheme(settings.theme);

    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme('system');
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [settings.theme, settings.accentColor, settings.fontFamily]);

  const updateSettings = async (newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('app-settings', JSON.stringify(updated));

    const user = auth.currentUser;
    if (user) {
      let targetId = user.uid;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.enterpriseId) {
            targetId = userData.enterpriseId;
          }
        }
      } catch (err) {
        console.warn('Error fetching user profile for setting update:', err);
      }

      const settingsRef = doc(db, 'settings', targetId);
      try {
        await setDoc(settingsRef, updated);
        // Only log major setting changes worth auditing
        if (newSettings.iva !== undefined || newSettings.currency !== undefined || newSettings.banks !== undefined) {
          import('../lib/audit').then(({ logAudit, AuditAction }) => {
            logAudit(AuditAction.SETTINGS_UPDATE, `Configuraciones de sistema actualizadas: ${Object.keys(newSettings).join(', ')}`);
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `settings/${targetId}`);
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
