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
            placeholderTextColor="#64748B"
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
                color: testResult.includes('exitosa') ? '#10B981' : '#EF4444',
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
            trackColor={{ false: '#1E293B', true: '#00F0FF' }}
            thumbColor="#F8FAFC"
          />
        </View>
        <Text style={styles.bgInterval}>
          Intervalo de sondeo: <Text style={{ color: '#00F0FF' }}>Cada 15 minutos</Text>
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
  card: {
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1F2937',
    marginBottom: 16,
  },
  cardTitle: {
    color: '#F8FAFC',
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
    backgroundColor: '#0B0F19',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#1E293B',
    fontSize: 12,
  },
  saveBtn: {
    backgroundColor: '#00F0FF',
    paddingHorizontal: 14,
    borderRadius: 8,
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#0B0F19',
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
    backgroundColor: '#0B0F19',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  presetText: {
    color: '#94A3B8',
    fontSize: 10,
  },
  testBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  testBtnText: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: '700',
  },
  testResultText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bgInterval: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 8,
  },
  thresholdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  thresholdLabel: {
    color: '#94A3B8',
    fontSize: 11,
  },
  thresholdVal: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  creditsCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
    marginTop: 10,
  },
  creditsTitle: {
    color: '#00F0FF',
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
