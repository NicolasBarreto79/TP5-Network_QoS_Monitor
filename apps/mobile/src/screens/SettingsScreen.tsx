import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { useQoSStore } from '../store/useQoSStore';

export const SettingsScreen: React.FC = () => {
  const {
    backendUrl,
    pingTargets,
    thresholds,
    isBackgroundEnabled,
    updateSettings,
  } = useQoSStore();

  const [localBackendUrl, setLocalBackendUrl] = useState(backendUrl);
  const [bgEnabled, setBgEnabled] = useState(isBackgroundEnabled);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  const handleSaveBackend = () => {
    updateSettings({ backendUrl: localBackendUrl.trim() });
    Alert.alert('Configuración guardada', 'URL del backend actualizada.');
  };

  const handleTestConnection = async () => {
    setIsPinging(true);
    setTestResult(null);
    try {
      const start = performance.now();
      const res = await fetch(`${localBackendUrl.trim()}/health`);
      const elapsed = (performance.now() - start).toFixed(0);
      if (res.ok) {
        setTestResult(`Conexión exitosa (${elapsed} ms)`);
      } else {
        setTestResult(`Error HTTP: ${res.status}`);
      }
    } catch (err: unknown) {
      setTestResult(`Fallo de conexión: ${err instanceof Error ? err.message : 'Timeout'}`);
    } finally {
      setIsPinging(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.subtitle}>PARÁMETROS Y SONDAS</Text>
        <Text style={styles.title}>Configuración</Text>
      </View>

      {/* Backend Reference Service Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>BACKEND DE REFERENCIA (THROUGHPUT TEST)</Text>
        <Text style={styles.cardSubtitle}>
          Endpoint Node.js/Docker para pruebas de descarga y subida
        </Text>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={localBackendUrl}
            onChangeText={setLocalBackendUrl}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="http://10.0.2.2:3000"
            placeholderTextColor="#94A3B8"
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveBackend}>
            <Text style={styles.saveBtnText}>GUARDAR</Text>
          </TouchableOpacity>
        </View>

        {/* LAN Quick Presets */}
        <View style={styles.presetsRow}>
          <TouchableOpacity
            style={styles.presetChip}
            onPress={() => setLocalBackendUrl('http://localhost:3000')}
          >
            <Text style={styles.presetText}>localhost:3000</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.presetChip}
            onPress={() => setLocalBackendUrl('http://10.0.2.2:3000')}
          >
            <Text style={styles.presetText}>10.0.2.2 (Emulador)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.presetChip}
            onPress={() => setLocalBackendUrl('http://192.168.0.10:3000')}
          >
            <Text style={styles.presetText}>LAN IP (Móvil)</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.testBtn}
          onPress={handleTestConnection}
          disabled={isPinging}
        >
          <Text style={styles.testBtnText}>
            {isPinging ? 'Probando...' : 'PROBAR CONEXIÓN (/health)'}
          </Text>
        </TouchableOpacity>

        {testResult && (
          <Text
            style={[
              styles.testResultText,
              {
                color: testResult.includes('exitosa') ? '#059669' : '#DC2626',
              },
            ]}
          >
            {testResult}
          </Text>
        )}
      </View>

      {/* Background Sampling Configuration (RF-07) */}
      <View style={styles.card}>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>MUESTREO EN SEGUNDO PLANO</Text>
            <Text style={styles.cardSubtitle}>
              Ejecutar periódicamente sondas de calidad con la app minimizada
            </Text>
          </View>
          <Switch
            value={bgEnabled}
            onValueChange={(val) => {
              setBgEnabled(val);
              updateSettings({ isBackgroundEnabled: val });
            }}
            trackColor={{ false: '#CBD5E1', true: '#0284C7' }}
            thumbColor="#FFFFFF"
          />
        </View>
        <Text style={styles.bgInterval}>
          Intervalo de sondeo: <Text style={{ color: '#0284C7', fontWeight: '700' }}>Cada 15 minutos</Text>
        </Text>
      </View>

      {/* Degradation Thresholds Configuration (RF-07) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>UMBRALES DE ALERTA DE DEGRADACIÓN SEVERA</Text>

        <View style={styles.thresholdRow}>
          <Text style={styles.thresholdLabel}>Latencia RTT Crítica:</Text>
          <Text style={styles.thresholdVal}>{thresholds.rttCriticalMs} ms</Text>
        </View>

        <View style={styles.thresholdRow}>
          <Text style={styles.thresholdLabel}>Jitter RFC 3550 Crítico:</Text>
          <Text style={styles.thresholdVal}>{thresholds.jitterCriticalMs} ms</Text>
        </View>

        <View style={styles.thresholdRow}>
          <Text style={styles.thresholdLabel}>Pérdida de Paquetes Crítica:</Text>
          <Text style={styles.thresholdVal}>{thresholds.lossCriticalPercent} %</Text>
        </View>

        <View style={styles.thresholdRow}>
          <Text style={styles.thresholdLabel}>Señal RSSI Crítica:</Text>
          <Text style={styles.thresholdVal}>{thresholds.rssiCriticalDbm} dBm</Text>
        </View>

        <View style={styles.thresholdRow}>
          <Text style={styles.thresholdLabel}>Throughput Mínimo Crítico:</Text>
          <Text style={styles.thresholdVal}>{thresholds.throughputCriticalMbps} Mbps</Text>
        </View>
      </View>

      {/* Academic Credits */}
      <View style={styles.creditsCard}>
        <Text style={styles.creditsTitle}>FCyT UADER - SEDE CONCEPCIÓN DEL URUGUAY</Text>
        <Text style={styles.creditsBody}>
          Licenciatura en Sistemas de Información{'\n'}
          Desarrollo de Aplicaciones Móviles - 2026{'\n'}
          TP5: Network QoS Monitor
        </Text>
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: 12,
  },
  saveBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    borderRadius: 8,
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  presetChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '600',
  },
  testBtn: {
    backgroundColor: '#F0F9FF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  testBtnText: {
    color: '#0284C7',
    fontSize: 11,
    fontWeight: '800',
  },
  testResultText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bgInterval: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 8,
  },
  thresholdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  thresholdLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  thresholdVal: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  creditsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  creditsTitle: {
    color: '#0284C7',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: 'center',
  },
  creditsBody: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});
