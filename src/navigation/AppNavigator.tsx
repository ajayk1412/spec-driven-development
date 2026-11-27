import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import OrderDetailScreen from '../screens/OrderDetailScreen';
import OrderFormScreen from '../screens/OrderFormScreen';
import OrderListScreen from '../screens/OrderListScreen';

export type RootStackParamList = {
  OrderList: undefined;
  OrderForm: { mode: 'create' } | { mode: 'edit'; orderId: string };
  OrderDetail: { orderId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="OrderList">
        <Stack.Screen
          name="OrderList"
          component={OrderListScreen}
          options={{ title: 'Orders' }}
        />
        <Stack.Screen
          name="OrderForm"
          component={OrderFormScreen}
          options={({ route }) => ({
            title: route.params.mode === 'edit' ? 'Edit Order' : 'New Order',
          })}
        />
        <Stack.Screen
          name="OrderDetail"
          component={OrderDetailScreen}
          options={{ title: 'Order' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
