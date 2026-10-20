import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useQoSStore } from '../store/useQoSStore';
import { TimeSeriesChart } from '../components/TimeSeriesChart';

export const TemporalChartsScreen: React.FC = () => {
  const { measurements } = useQoSStore();
  const [selectedRange, setSelectedRange] = useState<'ALL' | 'LAST_5'>('ALL');

  const orderedRecords = [...measurements].reverse(); // Oldest to newest
  const displayRecords =
    selectedRange === 'LAST_5' ? orderedRecords.slice(-5) : orderedRecords;

  // Latency Series (RTT ms)
  const latencyData = displayRecords.map((r, i) => {
    const rtt = r.pingSummary?.[0]?.avgRttMs ?? 25;
    return {
      label: `#${i + 1}`,
      value: rtt,
    };
  });

  // Jitter Series (ms)
  const jitterData = displayRecords.map((r, i) => {
    const jitter = r.pingSummary?.[0]?.jitterMs ?? 2;
    return {
      label: `#${i + 1}`,
      value: jitter,
    };
  });

  // Download Throughput Series (Mbps)
  const downloadData = displayRecords.map((r, i) => {
    const dl = r.throughput?.download?.speedMbps ?? 20;
    return {
      label: `#${i + 1}`,
      value: dl,
    };
  });

  // Signal Strength Series (RSSI dBm)
  const rssiData = displayRecords.map((r, i) => {
    const rssi = r.network?.cellular?.rssiDbm ?? -80;
    return {
      label: `#${i + 1}`,
      value: rssi,
    };
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.subtitle}>SERIES TEMPORALES POR SESIÓN (RF-06)</Text>
        <Text style={styles.title}>Evolución Temporal</Text>
      </View>

      {/* Range Filter */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterBtn, selectedRange === 'ALL' && styles.filterBtnActive]}
          onPress={() => setSelectedRange('ALL')}
        >
          <Text
            style={[
              styles.filterBtnText,
              selectedRange === 'ALL' && styles.filterBtnTextActive,
            ]}
          >
            Historial Completo ({orderedRecords.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, selectedRange === 'LAST_5' && styles.filterBtnActive]}
          onPress={() => setSelectedRange('LAST_5')}
        >
          <Text
            style={[
              styles.filterBtnText,
              selectedRange === 'LAST_5' && styles.filterBtnTextActive,
            ]}
          >
            Últimas 5 Pruebas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Latency Chart */}
      <TimeSeriesChart
        title="Latencia RTT Promedio"
        unit="ms"
        data={latencyData}
        color="#0284C7"
      />

      {/* Jitter Chart */}
      <TimeSeriesChart
        title="Jitter Interarrival (RFC 3550)"
        unit="ms"
        data={jitterData}
        color="#D97706"
      />

      {/* Throughput Download Chart */}
      <TimeSeriesChart
        title="Velocidad de Descarga (Throughput)"
        unit="Mbps"
        data={downloadData}
        color="#059669"
      />

      {/* Signal Strength RSSI Chart */}
      <TimeSeriesChart
        title="Intensidad de Señal Celular (RSSI)"
        unit="dBm"
        data={rssiData}
        color="#7C3AED"
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  subtitle: {
    color: '#0284C7',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  title: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  filterBtnActive: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  filterBtnText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  filterBtnTextActive: {
    color: '#0284C7',
    fontWeight: '800',
  },
});
