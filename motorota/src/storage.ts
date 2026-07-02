import AsyncStorage from '@react-native-async-storage/async-storage';

import { Delivery, OptimizedRoute, Settings } from './types';

const KEYS = {
  deliveries: '@motorota/deliveries',
  settings: '@motorota/settings',
  route: '@motorota/route',
} as const;

export const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  travelMode: 'TWO_WHEELER',
  returnToStart: true,
};

async function loadJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function loadDeliveries(): Promise<Delivery[]> {
  return loadJson<Delivery[]>(KEYS.deliveries, []);
}

export async function saveDeliveries(deliveries: Delivery[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.deliveries, JSON.stringify(deliveries));
}

export async function loadSettings(): Promise<Settings> {
  const stored = await loadJson<Partial<Settings>>(KEYS.settings, {});
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(KEYS.settings, JSON.stringify(settings));
}

export async function loadRoute(): Promise<OptimizedRoute | null> {
  return loadJson<OptimizedRoute | null>(KEYS.route, null);
}

export async function saveRoute(route: OptimizedRoute | null): Promise<void> {
  if (route == null) {
    await AsyncStorage.removeItem(KEYS.route);
  } else {
    await AsyncStorage.setItem(KEYS.route, JSON.stringify(route));
  }
}
