import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Share,
} from 'react-native';
import { useQoSStore } from '../store/useQoSStore';
import {
  exportMeasurementsToCsv,
  exportMeasurementsToJson,
  ConnectionType,
} from '@qos-monitor/contracts';

export const HistoryScreen: React.FC = () => {
  const { measurements, alerts, clearHistory } = useQoSStore();
  const [activeTab, setActiveTab] = useState<'MEASUREMENTS' | 'ALERTS'>('MEASUREMENTS');
  const [filterTech, setFilterTech] = useState<ConnectionType | 'ALL'>('ALL');
  const [filterPeriod, setFilterPeriod] = useState<'ALL' | 'TODAY'>('ALL');
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportContent, setExportContent] = useState('');
  const [exportType, setExportType] = useState<'CSV' | 'JSON'>('CSV');

  // Filter records
  let filtered = [...measurements];
  if (filterTech !== 'ALL') {
    filtered = filtered.filter((r) => r.network.type === filterTech);
  }
  if (filterPeriod === 'TODAY') {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    filtered = filtered.filter((r) => r.timestamp >= startOfToday.getTime());
  }

  const handleOpenExport = (type: 'CSV' | 'JSON') => {
    setExportType(type);
    if (type === 'CSV') {
      const csv = exportMeasurementsToCsv(filtered);
      setExportContent(csv);
    } else {
      const jsonStr = exportMeasurementsToJson(filtered, {
        author: 'Nicolas Barreto - FCyT UADER',
      });
      setExportContent(jsonStr);
    }
    setExportModalVisible(true);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: exportContent,
        title: `QoS_Export_${exportType}_${Date.now()}`,
      });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Switcher: Mediciones vs Alertas */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'MEASUREMENTS' && styles.tabBtnActive]}
          onPress={() => setActiveTab('MEASUREMENTS')}
        >
          <Text
            style={[
              styles.tabBtnText,
              activeTab === 'MEASUREMENTS' && styles.tabBtnTextActive,
            ]}
          >
            Mediciones ({filtered.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'ALERTS' && styles.tabBtnActive]}
          onPress={() => setActiveTab('ALERTS')}
        >
          <Text
            style={[
              styles.tabBtnText,
              activeTab === 'ALERTS' && styles.tabBtnTextActive,
            ]}
          >
            Alertas de Degradación ({alerts.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      {activeTab === 'MEASUREMENTS' ? (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Action Toolbar & Filters (RF-09 & RF-08) */}
          <View style={styles.toolbar}>
            <View style={styles.exportButtons}>
              <TouchableOpacity
                style={styles.exportBtn}
                onPress={() => handleOpenExport('CSV')}
              >
                <Text style={styles.exportBtnText}>EXPORTAR CSV</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exportBtn}
                onPress={() => handleOpenExport('JSON')}
              >
                <Text style={styles.exportBtnText}>EXPORTAR JSON</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.clearBtn} onPress={clearHistory}>
              <Text style={styles.clearBtnText}>LIMPIAR</Text>
            </TouchableOpacity>
          </View>

          {/* Filter Chips (RF-09) */}
          <View style={styles.chipsRow}>
            {(['ALL', '5g', '4g', '3g'] as const).map((tech) => (
              <TouchableOpacity
                key={tech}
                style={[
                  styles.filterChip,
                  filterTech === tech && styles.filterChipActive,
                ]}
                onPress={() => setFilterTech(tech)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filterTech === tech && styles.filterChipTextActive,
                  ]}
                >
                  {tech === 'ALL' ? 'Todas' : tech.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[
                styles.filterChip,
                filterPeriod === 'TODAY' && styles.filterChipActive,
              ]}
              onPress={() =>
                setFilterPeriod(filterPeriod === 'TODAY' ? 'ALL' : 'TODAY')
              }
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterPeriod === 'TODAY' && styles.filterChipTextActive,
                ]}
              >
                {filterPeriod === 'TODAY' ? '✓ Solo Hoy' : 'Hoy'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Measurement Items List */}
          {filtered.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay mediciones en este filtro</Text>
            </View>
          ) : (
            filtered.map((item) => {
              const ping = item.pingSummary?.[0];
              const dl = item.throughput?.download?.speedMbps;
              const ul = item.throughput?.upload?.speedMbps;

              return (
                <View key={item.id} style={styles.recordCard}>
                  <View style={styles.recordHeader}>
                    <View style={styles.recordBadgeGroup}>
                      <View style={styles.techTag}>
                        <Text style={styles.techTagText}>
                          {item.network.type.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.recordCarrier}>
                        {item.network.carrier || 'Operador'}
                      </Text>
                      {item.isBackground && (
                        <View style={styles.bgTag}>
                          <Text style={styles.bgTagText}>BACKGROUND</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.scorePill}>
                      <Text style={styles.scorePillText}>
                        QoS {item.qos.score}/100
                      </Text>
                    </View>
                  </View>

                  <View style={styles.recordBody}>
                    <View style={styles.metricCol}>
                      <Text style={styles.colLabel}>RTT / Jitter</Text>
                      <Text style={styles.colVal}>
                        {ping ? `${ping.avgRttMs}ms / ${ping.jitterMs}ms` : '--'}
                      </Text>
                    </View>
                    <View style={styles.metricCol}>
                      <Text style={styles.colLabel}>Velocidad</Text>
                      <Text style={styles.colVal}>
                        ↓{dl ? dl.toFixed(1) : '--'} ↑{ul ? ul.toFixed(1) : '--'} Mb
                      </Text>
                    </View>
                    <View style={styles.metricCol}>
                      <Text style={styles.colLabel}>Señal / Celda</Text>
                      <Text style={styles.colVal}>
                        {item.network.cellular?.rssiDbm
                          ? `${item.network.cellular.rssiDbm} dBm`
                          : '--'}
                      </Text>
                    </View>
                  </View>

                  {item.notes && (
                    <Text style={styles.recordNotes}>{item.notes}</Text>
                  )}

                  <View style={styles.recordFooter}>
                    <Text style={styles.recordDate}>
                      {new Date(item.timestamp).toLocaleString()}
                    </Text>
                    {item.location && (
                      <Text style={styles.recordLoc}>
                        {item.location.latitude.toFixed(4)},{' '}
                        {item.location.longitude.toFixed(4)}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      ) : (
        /* Alerts Tab (RF-07) */
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.alertNotice}>
            REGISTRO DE ALERTAS POR DEGRADACIÓN SEVERA DE RED (RF-07)
          </Text>
          {alerts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No se han detectado degradaciones severas</Text>
            </View>
          ) : (
            alerts.map((al) => (
              <View
                key={al.id}
                style={[
                  styles.alertCard,
                  al.severity === 'CRITICAL' && styles.alertCardCritical,
                ]}
              >
                <View style={styles.alertHeader}>
                  <View
                    style={[
                      styles.alertBadge,
                      {
                        backgroundColor:
                          al.severity === 'CRITICAL' ? '#EF4444' : '#F59E0B',
                      },
                    ]}
                  >
                    <Text style={styles.alertBadgeText}>{al.severity}</Text>
                  </View>
                  <Text style={styles.alertTime}>
                    {new Date(al.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
                <Text style={styles.alertReason}>{al.reason}</Text>
                <Text style={styles.alertMetrics}>
                  Métrica: {al.metricName.toUpperCase()} • Umbral:{' '}
                  {al.thresholdValue} • Medido: {al.actualValue}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Export Modal (RF-08) */}
      <Modal visible={exportModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                EXPORTACIÓN {exportType} ({filtered.length} REGISTROS)
              </Text>
              <TouchableOpacity onPress={() => setExportModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalTextPreview}
              multiline
              editable={false}
              value={exportContent}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalShareBtn} onPress={handleShare}>
                <Text style={styles.modalShareBtnText}>COMPARTIR / COPIAR</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setExportModalVisible(false)}
              >
                <Text style={styles.modalCloseBtnText}>CERRAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#00F0FF',
  },
  tabBtnText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: '#00F0FF',
    fontWeight: '800',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exportButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  exportBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  exportBtnText: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  clearBtnText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '800',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  filterChip: {
    backgroundColor: '#111827',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  filterChipActive: {
    borderColor: '#00F0FF',
    backgroundColor: '#00F0FF15',
  },
  filterChipText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#00F0FF',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
  },
  recordCard: {
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recordBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  techTag: {
    backgroundColor: '#00F0FF22',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  techTagText: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: '800',
  },
  recordCarrier: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  bgTag: {
    backgroundColor: '#8B5CF622',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  bgTagText: {
    color: '#8B5CF6',
    fontSize: 8,
    fontWeight: '800',
  },
  scorePill: {
    backgroundColor: '#0B0F19',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  scorePillText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  recordBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0B0F19',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  metricCol: {
    flex: 1,
  },
  colLabel: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '700',
  },
  colVal: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  recordNotes: {
    color: '#94A3B8',
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  recordFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
    paddingTop: 8,
  },
  recordDate: {
    color: '#64748B',
    fontSize: 10,
  },
  recordLoc: {
    color: '#64748B',
    fontSize: 10,
    fontVariant: ['tabular-nums'],
  },
  alertNotice: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  alertCard: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  alertCardCritical: {
    borderLeftColor: '#EF4444',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  alertBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  alertBadgeText: {
    color: '#0B0F19',
    fontSize: 9,
    fontWeight: '900',
  },
  alertTime: {
    color: '#64748B',
    fontSize: 10,
  },
  alertReason: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  alertMetrics: {
    color: '#94A3B8',
    fontSize: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000BB',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  modalClose: {
    color: '#94A3B8',
    fontSize: 18,
    fontWeight: '700',
  },
  modalTextPreview: {
    backgroundColor: '#0B0F19',
    color: '#CBD5E1',
    fontFamily: 'monospace',
    fontSize: 10,
    padding: 12,
    borderRadius: 8,
    height: 300,
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalShareBtn: {
    flex: 1,
    backgroundColor: '#00F0FF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalShareBtnText: {
    color: '#0B0F19',
    fontSize: 12,
    fontWeight: '900',
  },
  modalCloseBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
});
