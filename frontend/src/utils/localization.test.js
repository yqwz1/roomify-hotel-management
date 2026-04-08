import { describe, expect, it } from 'vitest';
import { extractApiErrorMessage } from './apiError';
import { getInvoiceDeliveryStatusLabel, translateBillLineItemLabel } from './localization';

const t = (key, options) => {
  const translations = {
    invoiceDeliveryStatusAttempt: 'Attempting',
    invoiceLineRoomCharge: 'Room charge',
    invoiceLineServiceCharges: 'Service charges',
    invoiceLineVat: 'VAT',
    invoiceLineDiscount: 'Discount',
    invoiceLineBalanceDue: 'Balance due',
    invoiceLineOutstandingBalance: 'Outstanding balance',
    invoiceLineTotalPaid: 'Total paid',
  };

  if (key === 'checkoutPage.roomChargeLabel') {
    return `Room charge (${options.count} nights x ${options.rate})`;
  }

  if (key === 'checkoutPage.vatLabel') {
    return `VAT (${options.rate}%)`;
  }

  return translations[key] ?? key;
};

describe('localization helpers', () => {
  it('maps backend ATTEMPT delivery status explicitly', () => {
    expect(getInvoiceDeliveryStatusLabel('ATTEMPT', t)).toBe('Attempting');
  });

  it('normalizes backend bill line item labels', () => {
    expect(translateBillLineItemLabel('Additional Service Charges', t)).toBe('Service charges');
    expect(translateBillLineItemLabel('Room Charge (2 nights x 120.00)', t)).toBe(
      'Room charge (2 nights x 120.00)'
    );
    expect(translateBillLineItemLabel('VAT (15%)', t)).toBe('VAT (15%)');
  });

  it('prefers structured payment validation details when available', () => {
    const message = extractApiErrorMessage({
      response: {
        data: {
          code: 'PAYMENT_BALANCE_DUE',
          message: 'Outstanding balance must be 0.00 before checkout',
          details: {
            paymentStatus: 'PARTIALLY_PAID',
            outstandingBalance: 210.5,
            invoiceFinalized: false,
          },
        },
      },
    });

    expect(message).toBe(
      'Outstanding balance remains on this reservation (210.50). Refresh the bill before retrying.'
    );
  });
});
