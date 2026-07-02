import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { DeliveriesScreen } from './src/screens/DeliveriesScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { RouteScreen } from './src/screens/RouteScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { StoreProvider, useStore } from './src/store';
import { colors } from './src/theme';

type Tab = 'deliveries' | 'route' | 'history' | 'settings';

const TABS: { key: Tab; label: string; emoji: string }[] = [
  { key: 'deliveries', label: 'Entregas', emoji: '📦' },
  { key: 'route', label: 'Rota', emoji: '🗺️' },
  { key: 'history', label: 'Histórico', emoji: '✅' },
  { key: 'settings', label: 'Ajustes', emoji: '⚙️' },
];

function Main() {
  const { ready, deliveries } = useStore();
  const [tab, setTab] = useState<Tab>('deliveries');

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const pendingCount = deliveries.filter((d) => d.status === 'pending').length;

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        {tab === 'deliveries' && <DeliveriesScreen />}
        {tab === 'route' && <RouteScreen />}
        {tab === 'history' && <HistoryScreen />}
        {tab === 'settings' && <SettingsScreen />}
      </View>
      <View style={styles.tabBar}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={styles.tabItem}
              onPress={() => setTab(t.key)}
              activeOpacity={0.7}
            >
              <View>
                <Text style={styles.tabEmoji}>{t.emoji}</Text>
                {t.key === 'deliveries' && pendingCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{pendingCount}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <SafeAreaView style={styles.safe}>
        <StatusBar style="light" />
        <Main />
      </SafeAreaView>
    </StoreProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
    paddingBottom: Platform.OS === 'ios' ? 4 : 6,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabEmoji: {
    fontSize: 20,
  },
  tabLabel: {
    color: colors.dim,
    fontSize: 11,
    marginTop: 3,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: colors.accent,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -12,
    backgroundColor: colors.red,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
});
