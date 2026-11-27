import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Order from '../database/models/Order';
import { formatMoney, formatShortDate } from '../utils/format';
import StatusBadge from './StatusBadge';

type Props = {
  order: Order;
  onPress: (order: Order) => void;
};

export default function OrderListItem({ order, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Order ${order.orderNumber} for ${order.customerName}`}
      onPress={() => onPress(order)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.line}>
        <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        <Text style={styles.date}>{formatShortDate(order.createdAt)}</Text>
      </View>
      <Text style={styles.customer} numberOfLines={1}>
        {order.customerName}
      </Text>
      <View style={styles.line}>
        <StatusBadge status={order.status} />
        <Text style={styles.amount}>
          {formatMoney(order.totalAmount, order.currency)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  pressed: { backgroundColor: '#F0F0F0' },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumber: { fontSize: 14, color: '#666666' },
  date: { fontSize: 14, color: '#666666' },
  customer: { fontSize: 17, fontWeight: '600', color: '#111111' },
  amount: { fontSize: 16, color: '#111111' },
});
