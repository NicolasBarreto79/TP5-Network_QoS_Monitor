import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SignalBarsProps {
  rssiDbm?: number | null;
  networkType: string;
  theme?: 'light' | 'dark';
}

export const SignalBars: React.FC<SignalBarsProps> = ({ rssiDbm, networkType: _networkType, theme = 'light' }) => {
  const getBarLevel = (dbm?: number | null): number => {
    if (dbm == null) return 3;
    if (dbm >= -70) return 5;
    if (dbm >= -85) return 4;
    if (dbm >= -100) return 3;
    if (dbm >= -112) return 2;
    return 1;
  };

  const level = getBarLevel(rssiDbm);

  const getBarColor = (index: number) => {
    if (index > level) {
      return theme === 'light' ? '#E2E8F0' : '#1E293B';
    }
    if (level >= 4) return '#10B981'; // Emerald Green
    if (level === 3) return '#0284C7'; // Vivid Sky Blue
    if (level === 2) return '#F59E0B'; // Amber Warning
    return '#EF4444'; // Red Alert
  };

  return (
    <View style={styles.container}>
      <View style={styles.barsRow}>
        {[1, 2, 3, 4, 5].map((barIndex) => (
          <View
            key={barIndex}
            style={[
              styles.bar,
              {
                height: barIndex * 4 + 4,
                backgroundColor: getBarColor(barIndex),
              },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.dbmText, theme === 'light' ? styles.dbmTextLight : styles.dbmTextDark]}>
        {rssiDbm != null ? `${Math.round(rssiDbm)} dBm` : '-- dBm'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 24,
    gap: 3,
  },
  bar: {
    width: 4,
    borderRadius: 2,
  },
  dbmText: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  dbmTextLight: {
    color: '#475569',
  },
  dbmTextDark: {
    color: '#94A3B8',
  },
});
