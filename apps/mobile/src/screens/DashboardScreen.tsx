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
import { SignalBars } from '../components/SignalBars';
import { TelephonyBridge } from '../native/telephonyBridge';

export const DashboardScreen: React.FC = () => {
  const {
    network,
    isNetworkLoading,
    currentLocation,
    isTesting,
    activeTestStage,
    statusMessage,
    testProgressPercent,
    latestQoS,
    latestPingResults,
    latestThroughput,
    refreshNetworkStatus,
    runFullQoSTest,
  } = useQoSStore();

  const getNetworkTypeColor = (type: string) => {
    switch (type) {
      case '5g':
        return '#8B5CF6'; // Purple / 5G
      case '4g':
        return '#00F0FF'; // Cyan / 4G
      case '3g':
        return '#F59E0B'; // Amber / 3G
      case 'wifi':
        return '#10B981'; // Green / WiFi
      default:
        return '#64748B';
    }
  };

  const getQoSCategoryColor = (category?: string) => {
    switch (category) {
      case 'EXCELLENT':
        return '#10B981';
      case 'GOOD':
        return '#00F0FF';
      case 'FAIR':
        return '#F59E0B';
      case 'POOR':
      case 'CRITICAL':
        return '#EF4444';
      default:
        return '#64748B';
    }
  };

  const primaryPing = latestPingResults[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Banner */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>MONITOR DE CALIDAD DE SERVICIO</Text>
          <Text style={styles.headerTitle}>Network QoS Monitor</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={refreshNetworkStatus}
          disabled={isNetworkLoading || isTesting}
        >
          {isNetworkLoading ? (
            <ActivityIndicator size="small" color="#00F0FF" />
          ) : (
            <Text style={styles.refreshText}>ACTUALIZAR</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Real-time Cellular & Radio Card (RF-01) */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.techBadgeContainer}>
            <View
              style={[
                styles.techBadge,
                { backgroundColor: getNetworkTypeColor(network.type) + '22' },
              ]}
            >
              <View
                style={[
                  styles.pulseDot,
                  { backgroundColor: getNetworkTypeColor(network.type) },
                ]}
              />
              <Text
                style={[
                  styles.techBadgeText,
                  { color: getNetworkTypeColor(network.type) },
                ]}
              >
                {network.type.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.carrierText}>
              {network.carrier || 'Operador Móvil'}
            </Text>
          </View>
          <SignalBars
            rssiDbm={network.cellular?.rssiDbm}
            networkType={network.type}
          />
        </View>

        {/* Detailed Radio Metrics Grid */}
        <View style={styles.radioGrid}>
          <View style={styles.radioItem}>
            <Text style={styles.radioLabel}>SEÑAL (RSSI)</Text>
            <Text style={styles.radioValue}>
              {network.cellular?.rssiDbm ? `${network.cellular.rssiDbm} dBm` : '--'}
            </Text>
          </View>
          <View style={styles.radioItem}>
            <Text style={styles.radioLabel}>RSRP</Text>
            <Text style={styles.radioValue}>
              {network.cellular?.rsrpDbm ? `${network.cellular.rsrpDbm} dBm` : 'N/A'}
            </Text>
          </View>
          <View style={styles.radioItem}>
            <Text style={styles.radioLabel}>SINR</Text>
            <Text style={styles.radioValue}>
              {network.cellular?.sinrDb ? `${network.cellular.sinrDb} dB` : 'N/A'}
            </Text>
          </View>
          <View style={styles.radioItem}>
            <Text style={styles.radioLabel}>ASU</Text>
            <Text style={styles.radioValue}>{network.cellular?.asuLevel ?? '--'}</Text>
          </View>
          <View style={styles.radioItem}>
            <Text style={styles.radioLabel}>CELL ID</Text>
            <Text style={styles.radioValue}>{network.cellular?.cellId ?? '--'}</Text>
          </View>
          <View style={styles.radioItem}>
            <Text style={styles.radioLabel}>BANDA</Text>
            <Text style={styles.radioValue}>{network.cellular?.band ?? 'Auto'}</Text>
          </View>
        </View>

        {/* GPS location coordinates (RF-04) */}
        <View style={styles.geoBar}>
          <Text style={styles.geoLabel}>COORDENADAS GPS:</Text>
          <Text style={styles.geoCoords}>
            {currentLocation
              ? `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)} (±${currentLocation.accuracy.toFixed(0)}m)`
              : 'Adquiriendo satélites GPS...'}
          </Text>
        </View>
      </View>

      {/* Compound QoS Score Card */}
      <View style={styles.card}>
        <View style={styles.qosHeader}>
          <Text style={styles.cardTitle}>ÍNDICE DE CALIDAD DE SERVICIO (QoS)</Text>
          {latestQoS && (
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: getQoSCategoryColor(latestQoS.category) + '22' },
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  { color: getQoSCategoryColor(latestQoS.category) },
                ]}
              >
                {latestQoS.category}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.scoreRow}>
          <View style={styles.scoreDial}>
            <Text
              style={[
                styles.scoreNumber,
                { color: getQoSCategoryColor(latestQoS?.category) },
              ]}
            >
              {latestQoS ? latestQoS.score : '--'}
            </Text>
            <Text style={styles.scoreTotal}>/ 100</Text>
          </View>
          <View style={styles.scoreDetails}>
            <Text style={styles.mosText}>
              MOS Estimado:{' '}
              <Text style={{ color: '#00F0FF', fontWeight: '800' }}>
                {latestQoS ? `${latestQoS.mosEstimated} / 5.0` : '--'}
              </Text>
            </Text>
            <Text style={styles.mosDesc}>
              Apto para VoIP, streaming 4K y gaming competitivo según RFC 2544
            </Text>
          </View>
        </View>

        {/* Quick KPI Tiles */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiTile}>
            <Text style={styles.kpiLabel}>LATENCIA (RTT)</Text>
            <Text style={styles.kpiValue}>
              {primaryPing ? `${primaryPing.avgRttMs} ms` : '--'}
            </Text>
          </View>
          <View style={styles.kpiTile}>
            <Text style={styles.kpiLabel}>JITTER RFC 3550</Text>
            <Text style={styles.kpiValue}>
              {primaryPing ? `${primaryPing.jitterMs} ms` : '--'}
            </Text>
          </View>
          <View style={styles.kpiTile}>
            <Text style={styles.kpiLabel}>BAJADA</Text>
            <Text style={styles.kpiValue}>
              {latestThroughput.download
                ? `${latestThroughput.download.speedMbps} Mb`
                : '--'}
            </Text>
          </View>
          <View style={styles.kpiTile}>
            <Text style={styles.kpiLabel}>SUBIDA</Text>
            <Text style={styles.kpiValue}>
              {latestThroughput.upload
                ? `${latestThroughput.upload.speedMbps} Mb`
                : '--'}
            </Text>
          </View>
        </View>
      </View>

      {/* Main Execution Button & Progress */}
      <View style={styles.actionContainer}>
        {isTesting && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${testProgressPercent}%` },
                ]}
              />
            </View>
            <Text style={styles.statusText}>{statusMessage}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.mainActionBtn, isTesting && styles.mainActionBtnDisabled]}
          onPress={() => runFullQoSTest()}
          disabled={isTesting}
          activeOpacity={0.8}
        >
          {isTesting ? (
            <ActivityIndicator size="small" color="#0B0F19" />
          ) : (
            <Text style={styles.mainActionBtnText}>EJECUTAR TEST COMPLETO DE QoS</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Scenario Simulator Toolbar (Testing & Evaluation) */}
      <View style={styles.simulationCard}>
        <Text style={styles.simulationTitle}>
          SIMULADOR DE ESCENARIOS CELULARES (DEMO / EVALUACIÓN)
        </Text>
        <View style={styles.scenarioRow}>
          <TouchableOpacity
            style={[styles.scenarioBtn, { borderColor: '#8B5CF6' }]}
            onPress={async () => {
              TelephonyBridge.setMockScenario('EXCELLENT_5G');
              await refreshNetworkStatus();
            }}
          >
            <Text style={[styles.scenarioBtnText, { color: '#8B5CF6' }]}>5G NR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.scenarioBtn, { borderColor: '#00F0FF' }]}
            onPress={async () => {
              TelephonyBridge.setMockScenario('GOOD_4G');
              await refreshNetworkStatus();
            }}
          >
            <Text style={[styles.scenarioBtnText, { color: '#00F0FF' }]}>4G ÓPTIMO</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.scenarioBtn, { borderColor: '#F59E0B' }]}
            onPress={async () => {
              TelephonyBridge.setMockScenario('WEAK_4G');
              await refreshNetworkStatus();
            }}
          >
            <Text style={[styles.scenarioBtnText, { color: '#F59E0B' }]}>4G DÉBIL</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.scenarioBtn, { borderColor: '#EF4444' }]}
            onPress={async () => {
              TelephonyBridge.setMockScenario('CRITICAL_3G');
              await refreshNetworkStatus();
            }}
          >
            <Text style={[styles.scenarioBtnText, { color: '#EF4444' }]}>3G CRÍTICO</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  headerSubtitle: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '800',
  },
  refreshBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  refreshText: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
    paddingBottom: 12,
    marginBottom: 12,
  },
  techBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  techBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  techBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  carrierText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  radioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  radioItem: {
    width: '31%',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  radioLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  radioValue: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  geoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
    gap: 6,
  },
  geoLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
  geoCoords: {
    color: '#94A3B8',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  qosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  scoreDial: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#0B0F19',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  scoreTotal: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 4,
  },
  scoreDetails: {
    flex: 1,
  },
  mosText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  mosDesc: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  kpiTile: {
    flex: 1,
    backgroundColor: '#0B0F19',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  kpiLabel: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '700',
    textAlign: 'center',
  },
  kpiValue: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  actionContainer: {
    marginVertical: 8,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00F0FF',
  },
  statusText: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  mainActionBtn: {
    backgroundColor: '#00F0FF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  mainActionBtnDisabled: {
    opacity: 0.6,
  },
  mainActionBtnText: {
    color: '#0B0F19',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  simulationCard: {
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1F2937',
    marginTop: 8,
  },
  simulationTitle: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  scenarioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  scenarioBtn: {
    flex: 1,
    backgroundColor: '#0B0F19',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  scenarioBtnText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
