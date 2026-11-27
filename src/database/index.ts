import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import migrations from './migrations';
import Order from './models/Order';
import schema from './schema';

const adapter = new SQLiteAdapter({
  dbName: 'order_tracking',
  schema,
  migrations,
  // Async bridge mode: works through autolinking with no extra native setup.
  jsi: false,
  onSetUpError: error => {
    console.error('WatermelonDB setup failed', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [Order],
});
