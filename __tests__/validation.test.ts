import {
  EMPTY_FORM_VALUES,
  OrderFormValues,
  toOrderInput,
  validateOrderForm,
} from '../src/utils/validation';

const valid: OrderFormValues = {
  ...EMPTY_FORM_VALUES,
  customerName: 'Rahul Sharma',
  itemsSummary: '1x Router, 2x Cable',
  totalAmount: '2499.5',
};

const errorsFor = (overrides: Partial<OrderFormValues>) =>
  validateOrderForm({ ...valid, ...overrides });

describe('validateOrderForm', () => {
  it('accepts a valid form', () => {
    expect(validateOrderForm(valid)).toEqual({});
  });

  it('requires name, items and amount', () => {
    const errors = validateOrderForm(EMPTY_FORM_VALUES);
    expect(Object.keys(errors).sort()).toEqual([
      'customerName',
      'itemsSummary',
      'totalAmount',
    ]);
  });

  it('trims whitespace-only values', () => {
    const errors = errorsFor({ customerName: '   ', itemsSummary: '  ' });
    expect(errors.customerName).toBeDefined();
    expect(errors.itemsSummary).toBeDefined();
  });

  it('rejects negative and non-numeric amounts', () => {
    expect(errorsFor({ totalAmount: '-1' }).totalAmount).toBeDefined();
    expect(errorsFor({ totalAmount: 'abc' }).totalAmount).toBeDefined();
    expect(errorsFor({ totalAmount: 'Infinity' }).totalAmount).toBeDefined();
    expect(errorsFor({ totalAmount: '0' }).totalAmount).toBeUndefined();
  });

  it('validates email only when set', () => {
    expect(errorsFor({ customerEmail: '' })).toEqual({});
    expect(errorsFor({ customerEmail: 'a@b.com' })).toEqual({});
    expect(errorsFor({ customerEmail: 'nope' }).customerEmail).toBeDefined();
  });

  it('enforces max lengths', () => {
    expect(errorsFor({ customerName: 'x'.repeat(101) }).customerName).toBeDefined();
    expect(errorsFor({ customerPhone: '1'.repeat(21) }).customerPhone).toBeDefined();
    expect(errorsFor({ itemsSummary: 'x'.repeat(501) }).itemsSummary).toBeDefined();
    expect(errorsFor({ notes: 'x'.repeat(1001) }).notes).toBeDefined();
  });
});

describe('toOrderInput', () => {
  it('trims, parses the amount and nulls empty optionals', () => {
    expect(toOrderInput({ ...valid, customerName: ' Rahul ' })).toEqual({
      customerName: 'Rahul',
      customerPhone: null,
      customerEmail: null,
      status: 'pending',
      itemsSummary: '1x Router, 2x Cable',
      totalAmount: 2499.5,
      currency: 'INR',
      notes: null,
    });
  });
});
