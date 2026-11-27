import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FormField, OptionSelect } from '../components/FormField';
import { CURRENCIES, ORDER_STATUSES } from '../database/models/Order';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
  createOrder,
  getOrderById,
  updateOrder,
} from '../repositories/orderRepository';
import {
  EMPTY_FORM_VALUES,
  OrderFormErrors,
  OrderFormValues,
  toOrderInput,
  validateOrderForm,
} from '../utils/validation';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderForm'>;

export default function OrderFormScreen({ navigation, route }: Props) {
  const params = route.params;
  const orderId = params.mode === 'edit' ? params.orderId : null;
  const insets = useSafeAreaInsets();

  const [values, setValues] = useState<OrderFormValues>(EMPTY_FORM_VALUES);
  const [errors, setErrors] = useState<OrderFormErrors>({});
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(orderId !== null);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const dirty = useRef(false);

  // Edit mode: prefill from DB.
  useEffect(() => {
    if (orderId === null) {
      return;
    }
    let active = true;
    getOrderById(orderId).then(order => {
      if (!active) {
        return;
      }
      if (!order) {
        setNotFound(true);
      } else {
        setOrderNumber(order.orderNumber);
        setValues({
          customerName: order.customerName,
          customerPhone: order.customerPhone ?? '',
          customerEmail: order.customerEmail ?? '',
          status: order.status,
          itemsSummary: order.itemsSummary,
          totalAmount: String(order.totalAmount),
          currency: order.currency,
          notes: order.notes ?? '',
        });
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [orderId]);

  // Confirm before leaving with unsaved changes (Cancel, back button, swipe).
  useEffect(
    () =>
      navigation.addListener('beforeRemove', event => {
        if (!dirty.current) {
          return;
        }
        event.preventDefault();
        Alert.alert('Discard changes?', 'Your changes will not be saved.', [
          { text: 'Keep editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              dirty.current = false;
              navigation.dispatch(event.data.action);
            },
          },
        ]);
      }),
    [navigation],
  );

  const setField = <K extends keyof OrderFormValues>(
    key: K,
    value: OrderFormValues[K],
  ) => {
    dirty.current = true;
    setValues(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const onSave = async () => {
    const found = validateOrderForm(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      return;
    }

    setSaving(true);
    try {
      const input = toOrderInput(values);
      const saved =
        orderId === null
          ? await createOrder(input)
          : await updateOrder(orderId, input);
      dirty.current = false;
      if (orderId === null) {
        // Replace the form so Back from Detail returns to the list.
        navigation.replace('OrderDetail', { orderId: saved.id });
      } else {
        navigation.goBack();
      }
    } catch {
      setSaving(false);
      Alert.alert('Could not save order');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (notFound) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Order not found</Text>
        <Button title="Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <Text style={styles.label}>Order number</Text>
          <Text style={styles.readOnly}>
            {orderNumber ?? 'Generated on save'}
          </Text>
        </View>

        <FormField
          label="Customer name"
          value={values.customerName}
          onChangeText={t => setField('customerName', t)}
          error={errors.customerName}
          maxLength={100}
        />
        <FormField
          label="Phone"
          value={values.customerPhone}
          onChangeText={t => setField('customerPhone', t)}
          error={errors.customerPhone}
          keyboardType="phone-pad"
          maxLength={20}
        />
        <FormField
          label="Email"
          value={values.customerEmail}
          onChangeText={t => setField('customerEmail', t)}
          error={errors.customerEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <OptionSelect
          label="Status"
          value={values.status}
          options={ORDER_STATUSES}
          onChange={v => setField('status', v)}
          error={errors.status}
        />
        <FormField
          label="Items summary"
          value={values.itemsSummary}
          onChangeText={t => setField('itemsSummary', t)}
          error={errors.itemsSummary}
          placeholder="e.g. 2x Widget A, 1x Widget B"
          multiline
          maxLength={500}
          style={styles.multiline}
        />
        <FormField
          label="Total amount"
          value={values.totalAmount}
          onChangeText={t => setField('totalAmount', t)}
          error={errors.totalAmount}
          keyboardType="decimal-pad"
        />
        <OptionSelect
          label="Currency"
          value={values.currency}
          options={CURRENCIES}
          onChange={v => setField('currency', v)}
          error={errors.currency}
        />
        <FormField
          label="Notes"
          value={values.notes}
          onChangeText={t => setField('notes', t)}
          error={errors.notes}
          multiline
          maxLength={1000}
          style={styles.multiline}
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: 12 + insets.bottom }]}>
        <View accessibilityLabel="Cancel" style={styles.footerButton}>
          <Button
            title="Cancel"
            color="#666666"
            onPress={() => navigation.goBack()}
            disabled={saving}
          />
        </View>
        <View accessibilityLabel="Save" style={styles.footerButton}>
          <Button title="Save" onPress={onSave} disabled={saving} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFound: { fontSize: 17, color: '#666666' },
  content: { padding: 16 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, color: '#444444', marginBottom: 4 },
  readOnly: { fontSize: 16, color: '#666666' },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#CCCCCC',
  },
  footerButton: { flex: 1 },
});
