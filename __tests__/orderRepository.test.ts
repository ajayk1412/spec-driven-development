import Order from '../src/database/models/Order';
import { CreateOrderInput } from '../src/utils/validation';

// Swap the native SQLite database for an in-memory one so the real repository
// code runs under Jest.
jest.mock('../src/database', () => {
  const { Database: Db } = require('@nozbe/watermelondb');
  const Adapter = require('@nozbe/watermelondb/adapters/lokijs').default;
  const OrderModel = require('../src/database/models/Order').default;
  const dbSchema = require('../src/database/schema').default;
  return {
    database: new Db({
      adapter: new Adapter({
        schema: dbSchema,
        useWebWorker: false,
        useIncrementalIndexedDB: false,
      }),
      modelClasses: [OrderModel],
    }),
  };
});

import { database } from '../src/database';
import {
  createOrder,
  deleteOrder,
  getOrderById,
  observeOrders,
  updateOrder,
} from '../src/repositories/orderRepository';

const sleep = (ms: number) =>
  new Promise<void>(resolve => setTimeout(resolve, ms));

const input = (overrides: Partial<CreateOrderInput> = {}): CreateOrderInput => ({
  customerName: 'Rahul Sharma',
  customerPhone: '9876543210',
  customerEmail: 'rahul@example.com',
  status: 'pending',
  itemsSummary: '1x Router',
  totalAmount: 2499.5,
  currency: 'INR',
  notes: null,
  ...overrides,
});

const firstEmission = (filter?: Parameters<typeof observeOrders>[0]) =>
  new Promise<Order[]>(resolve => {
    const sub = observeOrders(filter).subscribe(list => {
      resolve(list);
      setTimeout(() => sub.unsubscribe(), 0);
    });
  });

beforeEach(async () => {
  await database.write(() => database.unsafeResetDatabase());
});

describe('orderRepository', () => {
  it('creates an order with generated number and timestamps', async () => {
    const order = await createOrder(input());
    expect(order.orderNumber).toMatch(/^ORD-\d{8}-0001$/);
    expect(order.createdAt).toBeGreaterThan(0);
    expect(order.updatedAt).toBe(order.createdAt);
    expect(await getOrderById(order.id)).not.toBeNull();
  });

  it('generates unique order numbers across 10 rapid creates', async () => {
    const created = await Promise.all(
      Array.from({ length: 10 }, () => createOrder(input())),
    );
    const numbers = new Set(created.map(o => o.orderNumber));
    expect(numbers.size).toBe(10);
  });

  it('updates fields and bumps updated_at', async () => {
    const order = await createOrder(input());
    // The record instance is mutated in place, so capture the originals.
    const { orderNumber, createdAt, updatedAt } = order;
    await sleep(5);
    const updated = await updateOrder(
      order.id,
      input({ customerName: 'Priya', status: 'shipped', totalAmount: 10 }),
    );
    expect(updated.customerName).toBe('Priya');
    expect(updated.status).toBe('shipped');
    expect(updated.orderNumber).toBe(orderNumber);
    expect(updated.createdAt).toBe(createdAt);
    expect(updated.updatedAt).toBeGreaterThan(updatedAt);
  });

  it('hard deletes an order', async () => {
    const order = await createOrder(input());
    await deleteOrder(order.id);
    expect(await getOrderById(order.id)).toBeNull();
  });

  it('lists newest first and filters by search and status', async () => {
    const a = await createOrder(input({ customerName: 'Alice' }));
    await sleep(5);
    const b = await createOrder(input({ customerName: 'Bob', status: 'shipped' }));

    expect((await firstEmission()).map(o => o.id)).toEqual([b.id, a.id]);
    expect((await firstEmission({ search: 'ali' })).map(o => o.id)).toEqual([a.id]);
    expect((await firstEmission({ search: b.orderNumber })).map(o => o.id)).toEqual([b.id]);
    expect((await firstEmission({ status: 'shipped' })).map(o => o.id)).toEqual([b.id]);
  });
});
