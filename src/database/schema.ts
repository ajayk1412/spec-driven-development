import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'orders',
      columns: [
        // `order_number` must be unique; WatermelonDB cannot enforce this,
        // so orderRepository checks it inside the write transaction.
        { name: 'order_number', type: 'string', isIndexed: true },
        { name: 'customer_name', type: 'string', isIndexed: true },
        { name: 'customer_phone', type: 'string', isOptional: true },
        { name: 'customer_email', type: 'string', isOptional: true },
        { name: 'status', type: 'string', isIndexed: true },
        { name: 'items_summary', type: 'string' },
        { name: 'total_amount', type: 'number' },
        { name: 'currency', type: 'string' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number', isIndexed: true },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
