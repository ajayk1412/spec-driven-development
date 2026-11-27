import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  Button,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import OrderListItem from '../components/OrderListItem';
import Order, { ORDER_STATUSES, OrderStatus } from '../database/models/Order';
import { RootStackParamList } from '../navigation/AppNavigator';
import { observeOrders } from '../repositories/orderRepository';
import { capitalize } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderList'>;

type StatusFilter = OrderStatus | 'all';
const FILTERS: readonly StatusFilter[] = ['all', ...ORDER_STATUSES];

export default function OrderListScreen({ navigation }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  // Bumping this re-subscribes, which re-queries the DB (pull to refresh).
  const [reloadKey, setReloadKey] = useState(0);

  const openCreate = useCallback(
    () => navigation.navigate('OrderForm', { mode: 'create' }),
    [navigation],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create order"
          onPress={openCreate}
          hitSlop={8}>
          <Text style={styles.headerPlus}>+</Text>
        </Pressable>
      ),
    });
  }, [navigation, openCreate]);

  useEffect(() => {
    const subscription = observeOrders({
      search,
      status: status === 'all' ? undefined : status,
    }).subscribe(next => {
      setOrders(next);
      setRefreshing(false);
    });
    return () => subscription.unsubscribe();
  }, [search, status, reloadKey]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setReloadKey(k => k + 1);
  }, []);

  const isFiltered = search.trim().length > 0 || status !== 'all';

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          accessibilityLabel="Search orders"
          placeholder="Search by customer or order number"
          placeholderTextColor="#999999"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          returnKeyType="search"
          style={styles.searchInput}
        />
      </View>

      <View style={styles.chips}>
        {FILTERS.map(filter => {
          const selected = filter === status;
          return (
            <Pressable
              key={filter}
              accessibilityRole="button"
              accessibilityLabel={`Filter ${filter}`}
              accessibilityState={{ selected }}
              onPress={() => setStatus(filter)}
              style={[styles.chip, selected && styles.chipSelected]}>
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {capitalize(filter)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={orders}
        keyExtractor={order => order.id}
        renderItem={({ item }) => (
          <OrderListItem
            order={item}
            onPress={order =>
              navigation.navigate('OrderDetail', { orderId: order.id })
            }
          />
        )}
        ItemSeparatorComponent={Separator}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={orders.length === 0 && styles.emptyContainer}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {isFiltered ? 'No matching orders' : 'No orders yet'}
            </Text>
            {!isFiltered && (
              <Button title="Create order" onPress={openCreate} />
            )}
          </View>
        }
      />
    </View>
  );
}

const Separator = () => <View style={styles.separator} />;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  headerPlus: { fontSize: 30, lineHeight: 32, color: '#007AFF' },
  searchBar: { padding: 12, paddingBottom: 4, backgroundColor: '#FFFFFF' },
  searchInput: {
    backgroundColor: '#EFEFF4',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#111111',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#CCCCCC',
  },
  chip: {
    borderWidth: 1,
    borderColor: '#BBBBBB',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  chipSelected: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  chipText: { fontSize: 14, color: '#333333' },
  chipTextSelected: { color: '#FFFFFF', fontWeight: '600' },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#CCCCCC',
  },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', gap: 12, padding: 24 },
  emptyText: { fontSize: 17, color: '#666666' },
});
