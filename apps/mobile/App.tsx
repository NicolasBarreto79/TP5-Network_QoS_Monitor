import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import Svg, { Path, Circle, Rect, Polyline } from 'react-native-svg';
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

  const navItems: { key: TabKey; label: string }[] = [
    { key: 'dashboard', label: 'Inicio' },
    { key: 'speedtest', label: 'Velocidad' },
    { key: 'ping', label: 'Sondas' },
    { key: 'map', label: 'Mapa' },
    { key: 'charts', label: 'Gráficas' },
    { key: 'history', label: 'Historial' },
    { key: 'settings', label: 'Ajustes' },
  ];

  const renderNavIcon = (key: TabKey, color: string) => {
    switch (key) {
      case 'dashboard':
        return (
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Rect x="3" y="3" width="7" height="9" rx="1" />
            <Rect x="14" y="3" width="7" height="5" rx="1" />
            <Rect x="14" y="12" width="7" height="9" rx="1" />
            <Rect x="3" y="16" width="7" height="5" rx="1" />
          </Svg>
        );
      case 'speedtest':
        return (
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 2v4M4.93 4.93l2.83 2.83M2 12h4M19.07 4.93l-2.83 2.83M22 12h-4" />
            <Path d="m14 14-4-4" />
            <Path d="M12 22a8 8 0 1 0-8-8" />
          </Svg>
        );
      case 'ping':
        return (
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
            <Circle cx="12" cy="12" r="2" />
            <Path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5M19.1 4.9C23 8.8 23 15.2 19.1 19.1" />
          </Svg>
        );
      case 'map':
        return (
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z" />
            <Circle cx="12" cy="9" r="2.5" />
          </Svg>
        );
      case 'charts':
        return (
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M3 3v18h18" />
            <Path d="m19 9-5 5-4-4-5 5" />
          </Svg>
        );
      case 'history':
        return (
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <Polyline points="14 2 14 8 20 8" />
            <Path d="M16 13H8M16 17H8M10 9H8" />
          </Svg>
        );
      case 'settings':
        return (
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Circle cx="12" cy="12" r="3" />
            <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </Svg>
        );
    }
  };

  const isDashboard = activeTab === 'dashboard';

  return (
    <SafeAreaView style={[styles.safeArea, isDashboard && styles.safeAreaLight]}>
      <StatusBar
        barStyle={isDashboard ? 'dark-content' : 'light-content'}
        backgroundColor={isDashboard ? '#F8FAFC' : '#0B0F19'}
      />
      <View style={[styles.container, isDashboard && styles.containerLight]}>
        {/* Main Screen Body */}
        <View style={styles.screenContainer}>{renderActiveScreen()}</View>

        {/* Bottom Navigation Bar */}
        <View style={[styles.navBar, isDashboard && styles.navBarLight]}>
          {navItems.map((item) => {
            const isActive = activeTab === item.key;
            const iconColor = isActive
              ? (isDashboard ? '#0284C7' : '#00F0FF')
              : '#64748B';
            return (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.navItem,
                  isActive && (isDashboard ? styles.navItemActiveLight : styles.navItemActive),
                ]}
                onPress={() => setActiveTab(item.key)}
                activeOpacity={0.7}
              >
                <View style={styles.navIconContainer}>
                  {renderNavIcon(item.key, iconColor)}
                </View>
                <Text
                  style={[
                    styles.navLabel,
                    isActive && (isDashboard ? styles.navLabelActiveLight : styles.navLabelActive),
                  ]}
                >
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
  safeAreaLight: {
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  containerLight: {
    backgroundColor: '#F8FAFC',
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
  navBarLight: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E2E8F0',
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
  navItemActiveLight: {
    backgroundColor: '#F0F9FF',
  },
  navIconContainer: {
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 3,
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
  navLabelActiveLight: {
    color: '#0284C7',
    fontWeight: '800',
  },
});
