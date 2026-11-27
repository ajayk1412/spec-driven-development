import { Q } from '@nozbe/watermelondb';
import { Observable } from 'rxjs';

import { database } from '../database';
import Order, { OrderStatus } from '../database/models/Order';
import { formatDateStamp } from '../utils/format';
import { CreateOrderInput, UpdateOrderInput } from '../utils/validation';

export type { CreateOrderInput, UpdateOrderInput };

export type ObserveOrdersFilter = {
  search?: string;
  status?: OrderStatus;
};

const orders = () => database.get<Order>('orders');

// Columns shown in the list; changes to these re-emit the observed query.
const LIST_COLUMNS = [
  'order_number',
  'customer_name',
  'status',
  'total_amount',
  'currency',
  'created_at',
];

/** Live list of orders, newest first (BR-4), with optional search/status filter. */
export const observeOrders = ({
  search,
  status,
}: ObserveOrdersFilter = {}): Observable<Order[]> => {
  const conditions: Q.Clause[] = [];

  if (status) {
    conditions.push(Q.where('status', status));
  }

  const term = search?.trim();
  if (term) {
    const like = `%${Q.sanitizeLikeString(term)}%`;
    conditions.push(
      Q.or(
        Q.where('customer_name', Q.like(like)),
        Q.where('order_number', Q.like(like)),
      ),
    );
  }

  return orders()
    .query(...conditions, Q.sortBy('created_at', Q.desc))
    .observeWithColumns(LIST_COLUMNS);
};

export const getOrderById = async (id: string): Promise<Order | null> => {
  try {
    return await orders().find(id);
  } catch {
    // WatermelonDB throws when the record does not exist.
    return null;
  }
};

/** Next free `ORD-YYYYMMDD-####` for today (device local date). */
const nextOrderNumber = async (): Promise<string> => {
  const prefix = `ORD-${formatDateStamp(Date.now())}-`;
  const existing = await orders()
    .query(Q.where('order_number', Q.like(`${Q.sanitizeLikeString(prefix)}%`)))
    .fetch();

  let seq = existing.reduce((max, o) => {
    const n = parseInt(o.orderNumber.slice(prefix.length), 10);
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);

  // BR-1: on conflict regenerate the sequence for that day.
  let candidate: string;
  do {
    seq += 1;
    candidate = `${prefix}${String(seq).padStart(4, '0')}`;
  } while (
    (await orders().query(Q.where('order_number', candidate)).fetchCount()) > 0
  );
  return candidate;
};

export const generateOrderNumber = (): Promise<string> => nextOrderNumber();

export const createOrder = (input: CreateOrderInput): Promise<Order> =>
  // Writes are serialized by WatermelonDB, so number generation + insert is
  // atomic and rapid consecutive creates always get distinct numbers.
  database.write(async () => {
    const orderNumber = await nextOrderNumber();
    const now = Date.now();
    return orders().create(order => {
      order.orderNumber = orderNumber;
      order.customerName = input.customerName;
      order.customerPhone = input.customerPhone;
      order.customerEmail = input.customerEmail;
      order.status = input.status;
      order.itemsSummary = input.itemsSummary;
      order.totalAmount = input.totalAmount;
      order.currency = input.currency;
      order.notes = input.notes;
      order.createdAt = now;
      order.updatedAt = now;
    });
  });

export const updateOrder = (
  id: string,
  input: UpdateOrderInput,
): Promise<Order> =>
  database.write(async () => {
    const order = await orders().find(id);
    return order.update(o => {
      o.customerName = input.customerName;
      o.customerPhone = input.customerPhone;
      o.customerEmail = input.customerEmail;
      o.status = input.status;
      o.itemsSummary = input.itemsSummary;
      o.totalAmount = input.totalAmount;
      o.currency = input.currency;
      o.notes = input.notes;
      o.updatedAt = Date.now();
    });
  });

/** Hard delete (BR-3). */
export const deleteOrder = (id: string): Promise<void> =>
  database.write(async () => {
    const order = await orders().find(id);
    await order.destroyPermanently();
  });
