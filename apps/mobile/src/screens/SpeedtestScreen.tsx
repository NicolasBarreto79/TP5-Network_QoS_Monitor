import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useQoSStore } from '../store/useQoSStore';
import { SpeedGauge } from '../components/SpeedGauge';

export const SpeedtestScreen: React.FC = () => {
  const {
    isTesting,
    activeTestStage,
    statusMessage,
    throughputProgress,
    latestThroughput,
    backendUrl,
    downloadSizeMb,
    uploadSizeMb,
    updateSettings,
    runThroughputTestOnly,
  } = useQoSStore();

  const [selectedPayload, setSelectedPayload] = useState<number>(downloadSizeMb);

  const handleSelectPayload = (mb: number) => {
    setSelectedPayload(mb);
    updateSettings({ downloadSizeMb: mb, uploadSizeMb: Math.max(1, Math.round(mb / 2)) });
  };

  const currentSpeed =
    activeTestStage === 'download' || activeTestStage === 'upload'
      ? throughputProgress.instantSpeedMbps
      : activeTestStage === 'completed'
      ? latestThroughput.download?.speedMbps ?? 0
      : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.subtitle}>THROUGHPUT ENGINE (RF-03)</Text>
        <Text style={styles.title}>Test de Velocidad</Text>
      </View>

      {/* Speedometer Radial Gauge */}
      <View style={styles.gaugeContainer}>
        <SpeedGauge
          speedMbps={currentSpeed}
          maxSpeed={100}
          stage={activeTestStage}
        />

        {/* Progress Bar during test */}
        {isTesting && (
          <View style={styles.progressSection}>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${throughputProgress.percent}%` },
                ]}
              />
            </View>
            <Text style={styles.progressPercent}>
              {throughputProgress.percent}% (
              {(throughputProgress.transferredBytes / (1024 * 1024)).toFixed(1)} MB /{' '}
              {(throughputProgress.totalBytes / (1024 * 1024)).toFixed(1)} MB)
            </Text>
          </View>
        )}
      </View>

      {/* Results Summary Cards */}
      <View style={styles.resultsGrid}>
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>DESCARGA (DOWNLOAD)</Text>
          <Text style={[styles.resultValue, { color: '#00F0FF' }]}>
            {latestThroughput.download
              ? `${latestThroughput.download.speedMbps.toFixed(2)}`
              : '--'}
          </Text>
          <Text style={styles.resultUnit}>Mbps</Text>
          {latestThroughput.download && (
            <Text style={styles.resultSub}>
              {(latestThroughput.download.bytesTransferred / (1024 * 1024)).toFixed(1)} MB en{' '}
              {(latestThroughput.download.durationMs / 1000).toFixed(2)}s
            </Text>
          )}
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>SUBIDA (UPLOAD ECHO)</Text>
          <Text style={[styles.resultValue, { color: '#10B981' }]}>
            {latestThroughput.upload
              ? `${latestThroughput.upload.speedMbps.toFixed(2)}`
              : '--'}
          </Text>
          <Text style={styles.resultUnit}>Mbps</Text>
          {latestThroughput.upload && (
            <Text style={styles.resultSub}>
              {(latestThroughput.upload.bytesTransferred / (1024 * 1024)).toFixed(1)} MB en{' '}
              {(latestThroughput.upload.durationMs / 1000).toFixed(2)}s
            </Text>
          )}
        </View>
      </View>

      {/* Configuration & Payload Picker */}
      <View style={styles.configCard}>
        <Text style={styles.configTitle}>TAMAÑO DEL PAYLOAD DE PRUEBA</Text>
        <View style={styles.payloadSelector}>
          {[1, 5, 10, 25].map((mb) => (
            <TouchableOpacity
              key={mb}
              style={[
                styles.payloadBtn,
                selectedPayload === mb && styles.payloadBtnActive,
              ]}
              onPress={() => handleSelectPayload(mb)}
              disabled={isTesting}
            >
              <Text
                style={[
                  styles.payloadText,
                  selectedPayload === mb && styles.payloadTextActive,
                ]}
              >
                {mb} MB
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.serverInfo}>
          <Text style={styles.serverLabel}>BACKEND DE REFERENCIA:</Text>
          <Text style={styles.serverUrl} numberOfLines={1}>
            {backendUrl}
          </Text>
        </View>
      </View>

      {/* Live status banner */}
      {isTesting && (
        <View style={{ alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ color: '#00F0FF', fontSize: 13, fontWeight: '600' }}>
            {statusMessage}
          </Text>
        </View>
      )}

      {/* Action Button */}
      <TouchableOpacity
        style={[styles.startBtn, isTesting && styles.startBtnDisabled]}
        onPress={runThroughputTestOnly}
        disabled={isTesting}
      >
        {isTesting ? (
          <ActivityIndicator color="#0B0F19" />
        ) : (
          <Text style={styles.startBtnText}>INICIAR TEST DE THROUGHPUT</Text>
        )}
      </TouchableOpacity>
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
  gaugeContainer: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressSection: {
    width: '100%',
    marginTop: 10,
    alignItems: 'center',
  },
  progressBarTrack: {
    width: '90%',
    height: 6,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00F0FF',
  },
  progressPercent: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 6,
    fontVariant: ['tabular-nums'],
  },
  resultsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  resultCard: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1F2937',
    alignItems: 'center',
  },
  resultLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 28,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  resultUnit: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  resultSub: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 6,
    textAlign: 'center',
  },
  configCard: {
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1F2937',
    marginBottom: 16,
  },
  configTitle: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  payloadSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  payloadBtn: {
    flex: 1,
    backgroundColor: '#0B0F19',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  payloadBtnActive: {
    borderColor: '#00F0FF',
    backgroundColor: '#00F0FF11',
  },
  payloadText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  payloadTextActive: {
    color: '#00F0FF',
    fontWeight: '800',
  },
  serverInfo: {
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  serverLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
  serverUrl: {
    color: '#94A3B8',
    fontSize: 11,
    flex: 1,
  },
  startBtn: {
    backgroundColor: '#00F0FF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnDisabled: {
    opacity: 0.6,
  },
  startBtnText: {
    color: '#0B0F19',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
