import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export const ORDER_STATUSES = [
  'pending',
  'shipped',
  'delivered',
  'cancelled',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const CURRENCIES = ['INR', 'USD'] as const;
export type Currency = (typeof CURRENCIES)[number];

export default class Order extends Model {
  static table = 'orders';

  @field('order_number') orderNumber!: string;
  @field('customer_name') customerName!: string;
  @field('customer_phone') customerPhone!: string | null;
  @field('customer_email') customerEmail!: string | null;
  @field('status') status!: OrderStatus;
  @field('items_summary') itemsSummary!: string;
  @field('total_amount') totalAmount!: number;
  @field('currency') currency!: Currency;
  @field('notes') notes!: string | null;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
}
