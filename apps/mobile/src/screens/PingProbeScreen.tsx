import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useQoSStore } from '../store/useQoSStore';

export const PingProbeScreen: React.FC = () => {
  const {
    isTesting,
    pingTargets,
    latestPingResults,
    statusMessage,
    runPingTestOnly,
  } = useQoSStore();

  const getJitterColor = (jitterMs: number) => {
    if (jitterMs <= 5) return '#10B981'; // Excellent
    if (jitterMs <= 15) return '#0284C7'; // Good
    if (jitterMs <= 35) return '#D97706'; // Fair
    return '#DC2626'; // Poor
  };

  const getRttColor = (rttMs: number) => {
    if (rttMs <= 30) return '#10B981';
    if (rttMs <= 80) return '#0284C7';
    if (rttMs <= 150) return '#D97706';
    return '#DC2626';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.subtitle}>SONDAS MULTI-HOST TCP/UDP (RF-02)</Text>
        <Text style={styles.title}>Latencia y Jitter RFC 3550</Text>
      </View>

      {/* Target Host Cards */}
      {pingTargets.map((target, idx) => {
        const stats = latestPingResults.find(
          (s) => s.host === target.name || s.host === target.host
        );

        return (
          <View key={idx} style={styles.hostCard}>
            <View style={styles.hostHeader}>
              <View>
                <Text style={styles.hostName}>{target.name}</Text>
                <Text style={styles.hostEndpoint}>{target.host}</Text>
              </View>
              <View style={styles.lossBadge}>
                <Text
                  style={[
                    styles.lossText,
                    {
                      color:
                        stats && stats.packetLossPercent > 0 ? '#EF4444' : '#10B981',
                    },
                  ]}
                >
                  Pérdida: {stats ? `${stats.packetLossPercent}%` : '0%'}
                </Text>
              </View>
            </View>

            {/* Metrics Breakdown Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>AVG RTT</Text>
                <Text
                  style={[
                    styles.statValue,
                    { color: stats ? getRttColor(stats.avgRttMs) : '#64748B' },
                  ]}
                >
                  {stats ? `${stats.avgRttMs}` : '--'}
                </Text>
                <Text style={styles.statUnit}>ms</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statLabel}>JITTER (RFC 3550)</Text>
                <Text
                  style={[
                    styles.statValue,
                    { color: stats ? getJitterColor(stats.jitterMs) : '#64748B' },
                  ]}
                >
                  {stats ? `${stats.jitterMs}` : '--'}
                </Text>
                <Text style={styles.statUnit}>ms</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statLabel}>MIN / MAX</Text>
                <Text style={styles.statSubValue}>
                  {stats ? `${stats.minRttMs} / ${stats.maxRttMs}` : '-- / --'}
                </Text>
                <Text style={styles.statUnit}>ms</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statLabel}>PAQUETES</Text>
                <Text style={styles.statSubValue}>
                  {stats ? `${stats.packetsReceived}/${stats.packetsSent}` : '--/--'}
                </Text>
                <Text style={styles.statUnit}>recibidos</Text>
              </View>
            </View>

            {/* RTT Samples Visualizer */}
            {stats && stats.samples.length > 0 && (
              <View style={styles.samplesRow}>
                <Text style={styles.samplesTitle}>Muestras RTT:</Text>
                <View style={styles.samplesDots}>
                  {stats.samples.map((s, sIdx) => (
                    <View key={sIdx} style={styles.sampleItem}>
                      <View
                        style={[
                          styles.sampleBar,
                          {
                            height: Math.min(26, Math.max(6, s / 5)),
                            backgroundColor: getRttColor(s),
                          },
                        ]}
                      />
                      <Text style={styles.sampleText}>{s.toFixed(0)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        );
      })}

      {/* RFC Methodology Note */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>METODOLOGÍA RFC 3550 & RFC 2544</Text>
        <Text style={styles.infoText}>
          El jitter interarrival se computa mediante la ecuación continua de varianza estadística:
          {'\n'}J(i) = J(i-1) + (|D(i-1, i)| - J(i-1)) / 16.
          {'\n'}Mide la estabilidad temporal de los paquetes, esencial para servicios en tiempo real.
        </Text>
      </View>

      {/* Status feedback */}
      {isTesting && (
        <View style={{ alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ color: '#0284C7', fontSize: 13, fontWeight: '700' }}>
            {statusMessage}
          </Text>
        </View>
      )}

      {/* Action Button */}
      <TouchableOpacity
        style={[styles.probeBtn, isTesting && styles.probeBtnDisabled]}
        onPress={runPingTestOnly}
        disabled={isTesting}
      >
        {isTesting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.probeBtnText}>SONDEAR TODOS LOS HOSTS (3x)</Text>
        )}
      </TouchableOpacity>
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
    marginTop: 8,
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
  hostCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  hostHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  hostName: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  hostEndpoint: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  lossBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  lossText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statLabel: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '800',
    textAlign: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  statSubValue: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  statUnit: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '600',
  },
  samplesRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  samplesTitle: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
  samplesDots: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  sampleItem: {
    alignItems: 'center',
  },
  sampleBar: {
    width: 6,
    borderRadius: 2,
    marginBottom: 2,
  },
  sampleText: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  infoTitle: {
    color: '#0284C7',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  infoText: {
    color: '#475569',
    fontSize: 11,
    lineHeight: 16,
  },
  probeBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  probeBtnDisabled: {
    opacity: 0.6,
  },
  probeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
