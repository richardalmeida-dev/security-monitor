import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  DEFAULT_SETTINGS,
  loadDeliveries,
  loadRoute,
  loadSettings,
  saveDeliveries,
  saveRoute,
  saveSettings,
} from './storage';
import { Delivery, OptimizedRoute, Settings } from './types';

type AppStore = {
  ready: boolean;
  deliveries: Delivery[];
  settings: Settings;
  route: OptimizedRoute | null;
  addDelivery: (delivery: Delivery) => void;
  updateDelivery: (id: string, patch: Partial<Delivery>) => void;
  removeDelivery: (id: string) => void;
  markDelivered: (id: string) => void;
  undoDelivered: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setRoute: (route: OptimizedRoute | null) => void;
};

const StoreContext = createContext<AppStore | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [route, setRouteState] = useState<OptimizedRoute | null>(null);

  useEffect(() => {
    (async () => {
      const [d, s, r] = await Promise.all([loadDeliveries(), loadSettings(), loadRoute()]);
      setDeliveries(d);
      setSettings(s);
      setRouteState(r);
      setReady(true);
    })();
  }, []);

  const persistDeliveries = useCallback((next: Delivery[]) => {
    setDeliveries(next);
    saveDeliveries(next).catch(() => {});
  }, []);

  const addDelivery = useCallback(
    (delivery: Delivery) => {
      persistDeliveries([...deliveries, delivery]);
    },
    [deliveries, persistDeliveries]
  );

  const updateDelivery = useCallback(
    (id: string, patch: Partial<Delivery>) => {
      persistDeliveries(deliveries.map((d) => (d.id === id ? { ...d, ...patch } : d)));
    },
    [deliveries, persistDeliveries]
  );

  const removeDelivery = useCallback(
    (id: string) => {
      persistDeliveries(deliveries.filter((d) => d.id !== id));
    },
    [deliveries, persistDeliveries]
  );

  const markDelivered = useCallback(
    (id: string) => {
      updateDelivery(id, { status: 'delivered', deliveredAt: new Date().toISOString() });
    },
    [updateDelivery]
  );

  const undoDelivered = useCallback(
    (id: string) => {
      updateDelivery(id, { status: 'pending', deliveredAt: undefined });
    },
    [updateDelivery]
  );

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      const next = { ...settings, ...patch };
      setSettings(next);
      saveSettings(next).catch(() => {});
    },
    [settings]
  );

  const setRoute = useCallback((next: OptimizedRoute | null) => {
    setRouteState(next);
    saveRoute(next).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({
      ready,
      deliveries,
      settings,
      route,
      addDelivery,
      updateDelivery,
      removeDelivery,
      markDelivered,
      undoDelivered,
      updateSettings,
      setRoute,
    }),
    [
      ready,
      deliveries,
      settings,
      route,
      addDelivery,
      updateDelivery,
      removeDelivery,
      markDelivered,
      undoDelivered,
      updateSettings,
      setRoute,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): AppStore {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore precisa estar dentro de <StoreProvider>');
  return store;
}
