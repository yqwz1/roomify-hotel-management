const DEFAULT_LOCALE = 'en-US';

function formatValue(value, {
  formatter,
  locale = DEFAULT_LOCALE,
  decimals,
  currency,
  percent = false,
} = {}) {
  if (typeof formatter === 'function') {
    return formatter(value);
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return value == null ? '' : String(value);
  }

  const fractionDigits = Number.isInteger(decimals) ? decimals : undefined;

  if (currency) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: fractionDigits ?? 0,
      maximumFractionDigits: fractionDigits ?? 0,
    }).format(numericValue);
  }

  if (percent) {
    const normalizedPercent = Math.abs(numericValue) <= 1 ? numericValue : numericValue / 100;
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: fractionDigits ?? 0,
      maximumFractionDigits: fractionDigits ?? 0,
    }).format(normalizedPercent);
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(numericValue);
}

export default function AnimatedNumber({
  value = 0,
  prefix = '',
  suffix = '',
  formatter,
  locale,
  decimals,
  currency,
  percent = false,
  className = '',
  ...props
}) {
  const formatted = formatValue(value, {
    formatter,
    locale,
    decimals,
    currency,
    percent,
  });

  return (
    <span className={`tabular-nums ${className}`} {...props}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
