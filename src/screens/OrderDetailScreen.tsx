import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import StatusBadge from '../components/StatusBadge';
import Order from '../database/models/Order';
import { RootStackParamList } from '../navigation/AppNavigator';
import { deleteOrder, getOrderById } from '../repositories/orderRepository';
import { formatDateTime, formatMoney } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderDetail'>;

export default function OrderDetailScreen({ navigation, route }: Props) {
  const { orderId } = route.params;
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Reload on focus so edits made on the form screen are reflected.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getOrderById(orderId).then(found => {
        if (active) {
          setOrder(found);
          setLoading(false);
        }
      });
      return () => {
        active = false;
      };
    }, [orderId]),
  );

  const confirmDelete = () => {
    Alert.alert('Delete order?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteOrder(orderId);
            navigation.goBack();
          } catch {
            Alert.alert('Could not delete order');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Order not found</Text>
        <Button title="Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Row label="Order number" value={order.orderNumber} />
        <Row label="Customer name" value={order.customerName} />
        <Row label="Phone" value={order.customerPhone} />
        <Row label="Email" value={order.customerEmail} />
        <View style={styles.row}>
          <Text style={styles.label}>Status</Text>
          <StatusBadge status={order.status} />
        </View>
        <Row label="Items summary" value={order.itemsSummary} />
        <Row
          label="Total amount"
          value={formatMoney(order.totalAmount, order.currency)}
        />
        <Row label="Currency" value={order.currency} />
        <Row label="Notes" value={order.notes} />
        <Row label="Created" value={formatDateTime(order.createdAt)} />
        <Row label="Updated" value={formatDateTime(order.updatedAt)} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: 12 + insets.bottom }]}>
        <View accessibilityLabel="Edit order" style={styles.footerButton}>
          <Button
            title="Edit"
            onPress={() =>
              navigation.navigate('OrderForm', { mode: 'edit', orderId })
            }
          />
        </View>
        <View accessibilityLabel="Delete order" style={styles.footerButton}>
          <Button title="Delete" color="#C62828" onPress={confirmDelete} />
        </View>
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value ? value : '-'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFound: { fontSize: 17, color: '#666666' },
  content: { padding: 16 },
  row: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DDDDDD',
    gap: 4,
  },
  label: { fontSize: 13, color: '#777777' },
  value: { fontSize: 16, color: '#111111' },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#CCCCCC',
  },
  footerButton: { flex: 1 },
});
