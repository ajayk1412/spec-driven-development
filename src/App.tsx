import React from 'react';
import { DatabaseProvider } from '@nozbe/watermelondb/DatabaseProvider';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { database } from './database';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  return (
    <DatabaseProvider database={database}>
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </DatabaseProvider>
  );
}
