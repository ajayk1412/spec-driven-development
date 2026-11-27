import {
  CURRENCIES,
  Currency,
  ORDER_STATUSES,
  OrderStatus,
} from '../database/models/Order';

/** Values as typed in the form (everything is a string). */
export type OrderFormValues = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  status: OrderStatus;
  itemsSummary: string;
  totalAmount: string;
  currency: Currency;
  notes: string;
};

/** Validated, normalized order fields (§12 CreateOrderInput / UpdateOrderInput). */
export type OrderInput = {
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  status: OrderStatus;
  itemsSummary: string;
  totalAmount: number;
  currency: Currency;
  notes: string | null;
};
export type CreateOrderInput = OrderInput;
export type UpdateOrderInput = OrderInput;

export type OrderFormErrors = Partial<
  Record<keyof OrderFormValues, string>
>;

export const EMPTY_FORM_VALUES: OrderFormValues = {
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  status: 'pending',
  itemsSummary: '',
  totalAmount: '',
  currency: 'INR',
  notes: '',
};

const MAX = {
  customerName: 100,
  customerPhone: 20,
  itemsSummary: 500,
  notes: 1000,
};

export const isValidEmail = (email: string): boolean =>
  email.includes('@') && email.includes('.');

/** Returns inline errors keyed by field; empty object means valid. */
export const validateOrderForm = (values: OrderFormValues): OrderFormErrors => {
  const errors: OrderFormErrors = {};

  const name = values.customerName.trim();
  if (name.length < 1) {
    errors.customerName = 'Customer name is required';
  } else if (name.length > MAX.customerName) {
    errors.customerName = `Max ${MAX.customerName} characters`;
  }

  if (values.customerPhone.trim().length > MAX.customerPhone) {
    errors.customerPhone = `Max ${MAX.customerPhone} characters`;
  }

  const email = values.customerEmail.trim();
  if (email.length > 0 && !isValidEmail(email)) {
    errors.customerEmail = 'Enter a valid email address';
  }

  if (!ORDER_STATUSES.includes(values.status)) {
    errors.status = 'Select a valid status';
  }

  const items = values.itemsSummary.trim();
  if (items.length < 1) {
    errors.itemsSummary = 'Items summary is required';
  } else if (items.length > MAX.itemsSummary) {
    errors.itemsSummary = `Max ${MAX.itemsSummary} characters`;
  }

  const amountText = values.totalAmount.trim();
  const amount = Number(amountText);
  if (amountText.length < 1) {
    errors.totalAmount = 'Total amount is required';
  } else if (!Number.isFinite(amount) || amount < 0) {
    errors.totalAmount = 'Enter a number that is 0 or greater';
  }

  if (!CURRENCIES.includes(values.currency)) {
    errors.currency = 'Select a valid currency';
  }

  if (values.notes.trim().length > MAX.notes) {
    errors.notes = `Max ${MAX.notes} characters`;
  }

  return errors;
};

/** Convert form strings to repository input. Call only after validation passes. */
export const toOrderInput = (values: OrderFormValues): OrderInput => ({
  customerName: values.customerName.trim(),
  customerPhone: values.customerPhone.trim() || null,
  customerEmail: values.customerEmail.trim() || null,
  status: values.status,
  itemsSummary: values.itemsSummary.trim(),
  totalAmount: Number(values.totalAmount.trim()),
  currency: values.currency,
  notes: values.notes.trim() || null,
});
