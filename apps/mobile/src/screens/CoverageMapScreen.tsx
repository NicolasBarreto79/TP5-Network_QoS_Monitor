import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useQoSStore } from '../store/useQoSStore';
import { HeatmapGenerator, HeatmapMetricMode } from '../geo/heatmapGenerator';
import { ConnectionType } from '@qos-monitor/contracts';

export const CoverageMapScreen: React.FC = () => {
  const { measurements, currentLocation } = useQoSStore();
  const [metricMode, setMetricMode] = useState<HeatmapMetricMode>('QOS_SCORE');
  const [selectedTech, setSelectedTech] = useState<ConnectionType | 'ALL'>('ALL');
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);

  const filterTech = selectedTech === 'ALL' ? undefined : selectedTech;
  const heatmapPoints = HeatmapGenerator.generatePoints(measurements, metricMode, filterTech);

  const getWeightColor = (weight: number) => {
    if (weight >= 0.8) return '#10B981'; // Green (Excellent)
    if (weight >= 0.6) return '#00F0FF'; // Cyan (Good)
    if (weight >= 0.4) return '#F59E0B'; // Amber (Fair)
    return '#EF4444'; // Red (Critical)
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.subtitle}>MAPEO DE COBERTURA PERSONAL (RF-05)</Text>
        <Text style={styles.title}>Mapa de Calor (Heatmap)</Text>
      </View>

      {/* Metric Mode Filter Tabs */}
      <View style={styles.modeTabs}>
        <TouchableOpacity
          style={[styles.modeTab, metricMode === 'QOS_SCORE' && styles.modeTabActive]}
          onPress={() => setMetricMode('QOS_SCORE')}
        >
          <Text
            style={[
              styles.modeTabText,
              metricMode === 'QOS_SCORE' && styles.modeTabTextActive,
            ]}
          >
            Calidad QoS
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeTab, metricMode === 'SIGNAL_RSSI' && styles.modeTabActive]}
          onPress={() => setMetricMode('SIGNAL_RSSI')}
        >
          <Text
            style={[
              styles.modeTabText,
              metricMode === 'SIGNAL_RSSI' && styles.modeTabTextActive,
            ]}
          >
            Señal RSSI
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeTab, metricMode === 'LATENCY_RTT' && styles.modeTabActive]}
          onPress={() => setMetricMode('LATENCY_RTT')}
        >
          <Text
            style={[
              styles.modeTabText,
              metricMode === 'LATENCY_RTT' && styles.modeTabTextActive,
            ]}
          >
            Latencia RTT
          </Text>
        </TouchableOpacity>
      </View>

      {/* Technology Filter Chips */}
      <View style={styles.techFilterRow}>
        {(['ALL', '5g', '4g', '3g'] as const).map((tech) => (
          <TouchableOpacity
            key={tech}
            style={[
              styles.techChip,
              selectedTech === tech && styles.techChipActive,
            ]}
            onPress={() => setSelectedTech(tech)}
          >
            <Text
              style={[
                styles.techChipText,
                selectedTech === tech && styles.techChipTextActive,
              ]}
            >
              {tech === 'ALL' ? 'TODAS LAS REDES' : tech.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Interactive Heatmap Map Canvas View */}
      <View style={styles.mapContainer}>
        {/* Radar / Grid Background */}
        <View style={styles.gridOverlay}>
          <View style={styles.gridHLine} />
          <View style={styles.gridHLine} />
          <View style={styles.gridVLine} />
          <View style={styles.gridVLine} />
        </View>

        {/* Heatmap Points Rendered */}
        {heatmapPoints.map((pt, idx) => {
          const isSelected = selectedPointIndex === idx;
          // Normalización espacial relativa en el canvas de preview
          const centerLat = -32.4825;
          const centerLon = -58.2325;
          const posX = 160 + (pt.longitude - centerLon) * 5000;
          const posY = 130 - (pt.latitude - centerLat) * 5000;

          const clampedX = Math.min(290, Math.max(20, posX));
          const clampedY = Math.min(230, Math.max(20, posY));

          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.heatNode,
                {
                  left: clampedX - 16,
                  top: clampedY - 16,
                  backgroundColor: getWeightColor(pt.weight) + '33',
                  borderColor: getWeightColor(pt.weight),
                  transform: [{ scale: isSelected ? 1.3 : 1 }],
                },
              ]}
              onPress={() => setSelectedPointIndex(idx)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.heatCenter,
                  { backgroundColor: getWeightColor(pt.weight) },
                ]}
              />
              <Text style={styles.heatBadgeText}>
                {pt.qosScore}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Legend */}
        <View style={styles.mapLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendLabel}>Excelente</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#00F0FF' }]} />
            <Text style={styles.legendLabel}>Bueno</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendLabel}>Regular</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendLabel}>Crítico</Text>
          </View>
        </View>

        <View style={styles.mapFooter}>
          <Text style={styles.mapFooterText}>
            Ubicación base: Concepción del Uruguay (UADER FCyT) • {heatmapPoints.length} puntos mapeados
          </Text>
        </View>
      </View>

      {/* Selected Point Callout Detail Card */}
      {selectedPointIndex !== null && heatmapPoints[selectedPointIndex] && (
        <View style={styles.calloutCard}>
          <View style={styles.calloutHeader}>
            <Text style={styles.calloutTitle}>DETALLE DE LA MEDICIÓN SELECCIONADA</Text>
            <TouchableOpacity onPress={() => setSelectedPointIndex(null)}>
              <Text style={styles.calloutClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.calloutGrid}>
            <View style={styles.calloutItem}>
              <Text style={styles.calloutLabel}>RED</Text>
              <Text style={styles.calloutVal}>
                {heatmapPoints[selectedPointIndex].networkType.toUpperCase()}
              </Text>
            </View>
            <View style={styles.calloutItem}>
              <Text style={styles.calloutLabel}>QoS SCORE</Text>
              <Text
                style={[
                  styles.calloutVal,
                  { color: getWeightColor(heatmapPoints[selectedPointIndex].weight) },
                ]}
              >
                {heatmapPoints[selectedPointIndex].qosScore}/100
              </Text>
            </View>
            <View style={styles.calloutItem}>
              <Text style={styles.calloutLabel}>SEÑAL (RSSI)</Text>
              <Text style={styles.calloutVal}>
                {heatmapPoints[selectedPointIndex].rssiDbm != null
                  ? `${heatmapPoints[selectedPointIndex].rssiDbm} dBm`
                  : '--'}
              </Text>
            </View>
            <View style={styles.calloutItem}>
              <Text style={styles.calloutLabel}>COORDENADAS</Text>
              <Text style={styles.calloutVal} numberOfLines={1}>
                {heatmapPoints[selectedPointIndex].latitude.toFixed(4)},{' '}
                {heatmapPoints[selectedPointIndex].longitude.toFixed(4)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Surveyed Points List */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>REGISTRO DE PUNTOS GEORREFERENCIADOS</Text>
      </View>

      {heatmapPoints.map((pt, idx) => (
        <TouchableOpacity
          key={idx}
          style={[
            styles.listItem,
            selectedPointIndex === idx && styles.listItemActive,
          ]}
          onPress={() => setSelectedPointIndex(idx)}
        >
          <View
            style={[
              styles.listDot,
              { backgroundColor: getWeightColor(pt.weight) },
            ]}
          />
          <View style={styles.listInfo}>
            <Text style={styles.listCoord}>
              {pt.latitude.toFixed(4)}, {pt.longitude.toFixed(4)}
            </Text>
            <Text style={styles.listMeta}>
              {pt.networkType.toUpperCase()} • {pt.rssiDbm ? `${pt.rssiDbm} dBm` : 'N/A'} • {new Date(pt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={styles.listScoreBadge}>
            <Text style={styles.listScoreText}>{pt.qosScore}</Text>
          </View>
        </TouchableOpacity>
      ))}
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
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  modeTabActive: {
    backgroundColor: '#0284C7',
  },
  modeTabText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  modeTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  techFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  techChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  techChipActive: {
    borderColor: '#0284C7',
    backgroundColor: '#E0F2FE',
  },
  techChipText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
  techChipTextActive: {
    color: '#0284C7',
    fontWeight: '800',
  },
  mapContainer: {
    height: 280,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-around',
  },
  gridHLine: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  gridVLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#E2E8F0',
    left: '50%',
  },
  heatNode: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heatCenter: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heatBadgeText: {
    position: 'absolute',
    bottom: -14,
    color: '#0F172A',
    fontSize: 9,
    fontWeight: '800',
    backgroundColor: '#FFFFFFEE',
    paddingHorizontal: 4,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mapLegend: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFFFFFEE',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendLabel: {
    color: '#475569',
    fontSize: 9,
    fontWeight: '700',
  },
  mapFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFFEE',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  mapFooterText: {
    color: '#64748B',
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
  calloutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 16,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  calloutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  calloutTitle: {
    color: '#0284C7',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  calloutClose: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  calloutGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  calloutItem: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  calloutLabel: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '700',
  },
  calloutVal: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  listHeader: {
    marginBottom: 10,
  },
  listTitle: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  listItemActive: {
    borderColor: '#0284C7',
  },
  listDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  listInfo: {
    flex: 1,
  },
  listCoord: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  listMeta: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  listScoreBadge: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  listScoreText: {
    color: '#0284C7',
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
