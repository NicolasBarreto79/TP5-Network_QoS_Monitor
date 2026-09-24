import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';

interface DataPoint {
  label: string;
  value: number;
}

interface TimeSeriesChartProps {
  title: string;
  unit: string;
  data: DataPoint[];
  color?: string;
  height?: number;
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  title,
  unit,
  data,
  color = '#00F0FF',
  height = 140,
}) => {
  if (data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.emptyText}>Sin datos suficientes para graficar</Text>
      </View>
    );
  }

  const chartWidth = 320;
  const chartHeight = height - 40;
  const paddingX = 25;
  const paddingY = 15;

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values, minVal + 1); // Avoid div by zero

  const getX = (index: number) => {
    if (data.length <= 1) return chartWidth / 2;
    return paddingX + (index / (data.length - 1)) * (chartWidth - paddingX * 2);
  };

  const getY = (val: number) => {
    const norm = (val - minVal) / (maxVal - minVal);
    return chartHeight - paddingY - norm * (chartHeight - paddingY * 2);
  };

  // Build SVG path
  let pathD = '';
  data.forEach((d, idx) => {
    const x = getX(idx);
    const y = getY(d.value);
    if (idx === 0) {
      pathD += `M ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
    }
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.statValue, { color }]}>
          {values[values.length - 1].toFixed(1)} {unit}
        </Text>
      </View>

      <Svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        {/* Horizontal grid lines */}
        <Line
          x1={paddingX}
          y1={paddingY}
          x2={chartWidth - paddingX}
          y2={paddingY}
          stroke="#1E293B"
          strokeDasharray="4 4"
        />
        <Line
          x1={paddingX}
          y1={chartHeight / 2}
          x2={chartWidth - paddingX}
          y2={chartHeight / 2}
          stroke="#1E293B"
          strokeDasharray="4 4"
        />
        <Line
          x1={paddingX}
          y1={chartHeight - paddingY}
          x2={chartWidth - paddingX}
          y2={chartHeight - paddingY}
          stroke="#1E293B"
        />

        {/* Data Line */}
        <Path d={pathD} stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />

        {/* Points */}
        {data.map((d, idx) => (
          <Circle
            key={idx}
            cx={getX(idx)}
            cy={getY(d.value)}
            r="4"
            fill="#0F172A"
            stroke={color}
            strokeWidth="2"
          />
        ))}
      </Svg>

      <View style={styles.legendRow}>
        <Text style={styles.legendText}>Min: {minVal.toFixed(1)} {unit}</Text>
        <Text style={styles.legendText}>Max: {maxVal.toFixed(1)} {unit}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 30,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  legendText: {
    color: '#64748B',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
});
