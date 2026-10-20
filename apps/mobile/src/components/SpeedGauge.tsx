import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface SpeedGaugeProps {
  speedMbps: number;
  maxSpeed?: number;
  stage?: 'idle' | 'download' | 'upload' | 'completed' | 'ping';
}

export const SpeedGauge: React.FC<SpeedGaugeProps> = ({
  speedMbps,
  maxSpeed = 100,
  stage = 'idle',
}) => {
  const clampedSpeed = Math.min(maxSpeed, Math.max(0, speedMbps));
  // 180 degree arc: from angle -180 (left) to 0 (right)
  const angleDeg = -180 + (clampedSpeed / maxSpeed) * 180;
  const angleRad = (angleDeg * Math.PI) / 180;

  const cx = 130;
  const cy = 130;
  const r = 95;

  // Needle tip
  const needleLength = 80;
  const needleX = cx + needleLength * Math.cos(angleRad);
  const needleY = cy + needleLength * Math.sin(angleRad);

  const getStageColor = () => {
    if (stage === 'download') return '#0284C7';
    if (stage === 'upload') return '#10B981';
    if (stage === 'completed') return '#7C3AED';
    return '#64748B';
  };

  return (
    <View style={styles.container}>
      <Svg width={260} height={160} viewBox="0 0 260 160">
        <Defs>
          <LinearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#10B981" />
            <Stop offset="50%" stopColor="#0284C7" />
            <Stop offset="80%" stopColor="#F59E0B" />
            <Stop offset="100%" stopColor="#EF4444" />
          </LinearGradient>
        </Defs>

        {/* Background Track Arc */}
        <Path
          d="M 35 130 A 95 95 0 0 1 225 130"
          stroke="#E2E8F0"
          strokeWidth="16"
          strokeLinecap="round"
          fill="none"
        />

        {/* Active Arc (Colored) */}
        <Path
          d="M 35 130 A 95 95 0 0 1 225 130"
          stroke="url(#arcGrad)"
          strokeWidth="16"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${(clampedSpeed / maxSpeed) * 298.45} 300`}
        />

        {/* Needle Line */}
        <Path
          d={`M ${cx} ${cy} L ${needleX} ${needleY}`}
          stroke={getStageColor()}
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Center Hub */}
        <Circle cx={cx} cy={cy} r="10" fill="#FFFFFF" stroke={getStageColor()} strokeWidth="3" />
      </Svg>

      <View style={styles.readoutContainer}>
        <Text style={[styles.speedText, { color: getStageColor() }]}>
          {speedMbps.toFixed(1)}
        </Text>
        <Text style={styles.unitText}>Mbps</Text>
        <Text style={styles.stageText}>
          {stage === 'download' ? 'DESCARGA' : stage === 'upload' ? 'SUBIDA' : stage === 'completed' ? 'FINALIZADO' : 'EN ESPERA'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  readoutContainer: {
    alignItems: 'center',
    marginTop: -25,
  },
  speedText: {
    fontSize: 42,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  unitText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  stageText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 1.5,
  },
});
