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
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderRadius: 10,
    padding: 4,
    marginBottom: 12,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  modeTabActive: {
    backgroundColor: '#1E293B',
  },
  modeTabText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  modeTabTextActive: {
    color: '#00F0FF',
    fontWeight: '800',
  },
  techFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  techChip: {
    backgroundColor: '#111827',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  techChipActive: {
    borderColor: '#00F0FF',
    backgroundColor: '#00F0FF15',
  },
  techChipText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
  techChipTextActive: {
    color: '#00F0FF',
  },
  mapContainer: {
    height: 280,
    backgroundColor: '#0A101D',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 16,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-around',
  },
  gridHLine: {
    height: 1,
    backgroundColor: '#1E293B33',
  },
  gridVLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#1E293B33',
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
    color: '#F8FAFC',
    fontSize: 9,
    fontWeight: '800',
    backgroundColor: '#0B0F19EE',
    paddingHorizontal: 3,
    borderRadius: 3,
  },
  mapLegend: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#0B0F19DD',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 4,
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
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '600',
  },
  mapFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0B0F19EE',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  mapFooterText: {
    color: '#64748B',
    fontSize: 10,
    textAlign: 'center',
  },
  calloutCard: {
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#00F0FF44',
    marginBottom: 16,
  },
  calloutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  calloutTitle: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  calloutClose: {
    color: '#94A3B8',
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
    backgroundColor: '#0B0F19',
    padding: 8,
    borderRadius: 8,
  },
  calloutLabel: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '700',
  },
  calloutVal: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  listHeader: {
    marginBottom: 10,
  },
  listTitle: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  listItemActive: {
    borderColor: '#00F0FF',
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
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  listMeta: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
  },
  listScoreBadge: {
    backgroundColor: '#0B0F19',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  listScoreText: {
    color: '#00F0FF',
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
