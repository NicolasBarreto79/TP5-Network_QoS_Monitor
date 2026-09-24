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
        color="#00F0FF"
      />

      {/* Jitter Chart */}
      <TimeSeriesChart
        title="Jitter Interarrival (RFC 3550)"
        unit="ms"
        data={jitterData}
        color="#F59E0B"
      />

      {/* Throughput Download Chart */}
      <TimeSeriesChart
        title="Velocidad de Descarga (Throughput)"
        unit="Mbps"
        data={downloadData}
        color="#10B981"
      />

      {/* Signal Strength RSSI Chart */}
      <TimeSeriesChart
        title="Intensidad de Señal Celular (RSSI)"
        unit="dBm"
        data={rssiData}
        color="#8B5CF6"
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  subtitle: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  title: {
    color: '#F8FAFC',
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
    backgroundColor: '#111827',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  filterBtnActive: {
    borderColor: '#00F0FF',
    backgroundColor: '#00F0FF11',
  },
  filterBtnText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  filterBtnTextActive: {
    color: '#00F0FF',
  },
});
