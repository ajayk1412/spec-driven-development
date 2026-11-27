import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { OrderStatus } from '../database/models/Order';
import { capitalize } from '../utils/format';

const COLORS: Record<OrderStatus, { bg: string; fg: string }> = {
  pending: { bg: '#FFF3CD', fg: '#8A6D00' },
  shipped: { bg: '#DCEBFF', fg: '#0B5CAD' },
  delivered: { bg: '#DDF3E1', fg: '#1E7B34' },
  cancelled: { bg: '#E6E6E6', fg: '#555555' },
};

type Props = { status: OrderStatus };

export default function StatusBadge({ status }: Props) {
  const color = COLORS[status] ?? COLORS.cancelled;
  return (
    <View style={[styles.badge, { backgroundColor: color.bg }]}>
      <Text style={[styles.text, { color: color.fg }]}>
        {capitalize(status)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  text: { fontSize: 12, fontWeight: '600' },
});
