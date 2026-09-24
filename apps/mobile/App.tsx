import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useQoSStore } from './src/store/useQoSStore';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { SpeedtestScreen } from './src/screens/SpeedtestScreen';
import { PingProbeScreen } from './src/screens/PingProbeScreen';
import { CoverageMapScreen } from './src/screens/CoverageMapScreen';
import { TemporalChartsScreen } from './src/screens/TemporalChartsScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

type TabKey = 'dashboard' | 'speedtest' | 'ping' | 'map' | 'charts' | 'history' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const initialize = useQoSStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'speedtest':
        return <SpeedtestScreen />;
      case 'ping':
        return <PingProbeScreen />;
      case 'map':
        return <CoverageMapScreen />;
      case 'charts':
        return <TemporalChartsScreen />;
      case 'history':
        return <HistoryScreen />;
      case 'settings':
        return <SettingsScreen />;
    }
  };

  const navItems: { key: TabKey; label: string; icon: string }[] = [
    { key: 'dashboard', label: 'Inicio', icon: '⚡' },
    { key: 'speedtest', label: 'Velocidad', icon: '🚀' },
    { key: 'ping', label: 'Sondas', icon: '📡' },
    { key: 'map', label: 'Mapa', icon: '🗺️' },
    { key: 'charts', label: 'Gráficas', icon: '📈' },
    { key: 'history', label: 'Historial', icon: '📋' },
    { key: 'settings', label: 'Ajustes', icon: '⚙️' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />
      <View style={styles.container}>
        {/* Main Screen Body */}
        <View style={styles.screenContainer}>{renderActiveScreen()}</View>

        {/* Bottom Navigation Bar */}
        <View style={styles.navBar}>
          {navItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.navItem, isActive && styles.navItemActive]}
                onPress={() => setActiveTab(item.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.navIcon, isActive && styles.navIconActive]}>
                  {item.icon}
                </Text>
                <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  screenContainer: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
    paddingVertical: 6,
    paddingHorizontal: 4,
    justifyContent: 'space-around',
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  navItemActive: {
    backgroundColor: '#1E293B',
  },
  navIcon: {
    fontSize: 16,
    marginBottom: 2,
    opacity: 0.6,
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
  navLabelActive: {
    color: '#00F0FF',
    fontWeight: '800',
  },
});
