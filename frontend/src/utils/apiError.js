import { localizeKnownServerMessage } from './localization';

const formatPaymentAmount = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(2) : null;
};

const buildPaymentValidationMessage = (data) => {
  const code = String(data?.code ?? '').trim().toUpperCase();
  const details = data?.details;

  if (!code || !details || typeof details !== 'object') {
    return null;
  }

  const outstanding = formatPaymentAmount(details.outstandingBalance);

  if (code === 'PAYMENT_BALANCE_DUE') {
    return outstanding
      ? `Outstanding balance remains on this reservation (${outstanding}). Refresh the bill before retrying.`
      : 'Outstanding balance remains on this reservation. Refresh the bill before retrying.';
  }

  if (code === 'PAYMENT_NOT_FINALIZED') {
    return details.invoiceFinalized === false
      ? 'Invoice finalization is still pending for this reservation. Refresh the bill before retrying.'
      : 'Payment must be finalized before checkout.';
  }

  if (code === 'PAYMENT_OVERPAYMENT_BLOCKED') {
    return outstanding
      ? `Payment amount exceeds the remaining balance (${outstanding}). Refresh the bill and submit a smaller amount.`
      : 'Payment amount exceeds the remaining balance for this reservation.';
  }

  return null;
};

export const extractApiErrorMessage = (
  err,
  fallbackMessage = 'Something went wrong. Please try again.'
) => {
  const data = err?.response?.data;
  if (!data) return localizeKnownServerMessage(err?.message ?? fallbackMessage);

  if (data.validationErrors && typeof data.validationErrors === 'object') {
    const messages = Object.values(data.validationErrors).filter(Boolean);
    if (messages.length) {
      return localizeKnownServerMessage(messages.join(' · '));
    }
  }

  const structuredMessage = buildPaymentValidationMessage(data);
  if (structuredMessage) {
    return localizeKnownServerMessage(structuredMessage);
  }

  if (typeof data.message === 'string' && data.message.trim()) {
    return localizeKnownServerMessage(data.message);
  }

  if (typeof data.error === 'string' && data.error.trim()) {
    return localizeKnownServerMessage(data.error);
  }

  return localizeKnownServerMessage(err?.message ?? fallbackMessage);
};
