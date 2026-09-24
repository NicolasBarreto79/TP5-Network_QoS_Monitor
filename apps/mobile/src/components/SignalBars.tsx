import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SignalBarsProps {
  rssiDbm?: number | null;
  networkType: string;
}

export const SignalBars: React.FC<SignalBarsProps> = ({ rssiDbm, networkType }) => {
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
    if (index > level) return '#1E293B';
    if (level >= 4) return '#10B981'; // Green
    if (level === 3) return '#00F0FF'; // Cyan
    if (level === 2) return '#F59E0B'; // Amber
    return '#EF4444'; // Red
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
      <Text style={styles.dbmText}>
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
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});
