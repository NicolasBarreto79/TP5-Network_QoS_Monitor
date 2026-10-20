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
    alerts,
    refreshNetworkStatus,
    runFullQoSTest,
  } = useQoSStore();

  const getNetworkBadgeStyle = (type: string) => {
    switch (type) {
      case '5g':
        return {
          bg: '#F3E8FF',
          border: '#DDD6FE',
          text: '#6D28D9',
          dot: '#7C3AED',
        };
      case '4g':
        return {
          bg: '#E0F2FE',
          border: '#BAE6FD',
          text: '#0369A1',
          dot: '#0284C7',
        };
      case '3g':
        return {
          bg: '#FEF3C7',
          border: '#FDE68A',
          text: '#B45309',
          dot: '#D97706',
        };
      case 'wifi':
        return {
          bg: '#D1FAE5',
          border: '#A7F3D0',
          text: '#047857',
          dot: '#059669',
        };
      default:
        return {
          bg: '#F1F5F9',
          border: '#E2E8F0',
          text: '#475569',
          dot: '#64748B',
        };
    }
  };

  const getQoSCategoryStyle = (category?: string) => {
    switch (category) {
      case 'EXCELLENT':
        return {
          bg: '#D1FAE5',
          border: '#A7F3D0',
          text: '#047857',
          color: '#059669',
        };
      case 'GOOD':
        return {
          bg: '#E0F2FE',
          border: '#BAE6FD',
          text: '#0369A1',
          color: '#0284C7',
        };
      case 'FAIR':
        return {
          bg: '#FEF3C7',
          border: '#FDE68A',
          text: '#B45309',
          color: '#D97706',
        };
      case 'POOR':
      case 'CRITICAL':
        return {
          bg: '#FEE2E2',
          border: '#FECACA',
          text: '#B91C1C',
          color: '#DC2626',
        };
      default:
        return {
          bg: '#F1F5F9',
          border: '#E2E8F0',
          text: '#475569',
          color: '#64748B',
        };
    }
  };

  const primaryPing = latestPingResults[0];
  const badgeStyle = getNetworkBadgeStyle(network.type);
  const qosStyle = getQoSCategoryStyle(latestQoS?.category);

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
          activeOpacity={0.7}
        >
          {isNetworkLoading ? (
            <ActivityIndicator size="small" color="#0284C7" />
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
                {
                  backgroundColor: badgeStyle.bg,
                  borderColor: badgeStyle.border,
                },
              ]}
            >
              <View
                style={[
                  styles.pulseDot,
                  { backgroundColor: badgeStyle.dot },
                ]}
              />
              <Text
                style={[
                  styles.techBadgeText,
                  { color: badgeStyle.text },
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
            theme="light"
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

      {/* Degradation Alert Banner (RF-07) if active */}
      {alerts && alerts.length > 0 && (
        <View style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <View style={styles.alertBadge}>
              <Text style={styles.alertBadgeText}>ALERTA DE DEGRADACIÓN</Text>
            </View>
            <Text style={styles.alertMetric}>
              {alerts[0].metricName.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.alertMessage}>{alerts[0].reason}</Text>
        </View>
      )}

      {/* Compound QoS Score Card */}
      <View style={styles.card}>
        <View style={styles.qosHeader}>
          <Text style={styles.cardTitle}>ÍNDICE DE CALIDAD DE SERVICIO (QoS)</Text>
          {latestQoS && (
            <View
              style={[
                styles.categoryBadge,
                {
                  backgroundColor: qosStyle.bg,
                  borderColor: qosStyle.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  { color: qosStyle.text },
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
                { color: qosStyle.color },
              ]}
            >
              {latestQoS ? latestQoS.score : '--'}
            </Text>
            <Text style={styles.scoreTotal}>/ 100</Text>
          </View>
          <View style={styles.scoreDetails}>
            <Text style={styles.mosText}>
              MOS Estimado:{' '}
              <Text style={{ color: '#0284C7', fontWeight: '800' }}>
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
            <ActivityIndicator size="small" color="#FFFFFF" />
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
            style={[
              styles.scenarioBtn,
              { borderColor: '#7C3AED', backgroundColor: '#FAF5FF' },
            ]}
            onPress={async () => {
              TelephonyBridge.setMockScenario('EXCELLENT_5G');
              await refreshNetworkStatus();
            }}
          >
            <Text style={[styles.scenarioBtnText, { color: '#7C3AED' }]}>5G NR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.scenarioBtn,
              { borderColor: '#0284C7', backgroundColor: '#F0F9FF' },
            ]}
            onPress={async () => {
              TelephonyBridge.setMockScenario('GOOD_4G');
              await refreshNetworkStatus();
            }}
          >
            <Text style={[styles.scenarioBtnText, { color: '#0284C7' }]}>4G ÓPTIMO</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.scenarioBtn,
              { borderColor: '#D97706', backgroundColor: '#FFFBEB' },
            ]}
            onPress={async () => {
              TelephonyBridge.setMockScenario('WEAK_4G');
              await refreshNetworkStatus();
            }}
          >
            <Text style={[styles.scenarioBtnText, { color: '#D97706' }]}>4G DÉBIL</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.scenarioBtn,
              { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
            ]}
            onPress={async () => {
              TelephonyBridge.setMockScenario('CRITICAL_3G');
              await refreshNetworkStatus();
            }}
          >
            <Text style={[styles.scenarioBtnText, { color: '#DC2626' }]}>3G CRÍTICO</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  headerSubtitle: {
    color: '#0284C7',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
  },
  refreshBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  refreshText: {
    color: '#0284C7',
    fontSize: 11,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
    borderWidth: 1,
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
    color: '#0F172A',
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
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  radioLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  radioValue: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  geoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 6,
  },
  geoLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
  geoCoords: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  alertCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 16,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  alertBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  alertBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  alertMetric: {
    color: '#991B1B',
    fontSize: 11,
    fontWeight: '700',
  },
  alertMessage: {
    color: '#7F1D1D',
    fontSize: 12,
    fontWeight: '500',
  },
  qosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
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
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    color: '#0F172A',
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
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiLabel: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '700',
    textAlign: 'center',
  },
  kpiValue: {
    color: '#0F172A',
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
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0284C7',
  },
  statusText: {
    color: '#0284C7',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  mainActionBtn: {
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
  mainActionBtnDisabled: {
    opacity: 0.6,
  },
  mainActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  simulationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  simulationTitle: {
    color: '#64748B',
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
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  scenarioBtnText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
