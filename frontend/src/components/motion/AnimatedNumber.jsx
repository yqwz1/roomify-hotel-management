import { useEffect, useMemo, useState } from 'react';

const NUMBER_PATTERN = /[-+]?\d[\d,]*(?:\.\d+)?/;
const TEST_MODE = import.meta.env.MODE === 'test';

function parseAnimatedValue(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return {
      finalText: String(value),
      numericValue: value,
      prefix: '',
      suffix: '',
      decimals: 0,
    };
  }

  if (typeof value !== 'string') return null;

  const match = value.match(NUMBER_PATTERN);
  if (!match) return null;

  const rawNumber = match[0];
  const numericValue = Number(rawNumber.replace(/,/g, ''));
  if (!Number.isFinite(numericValue)) return null;

  return {
    finalText: value,
    numericValue,
    prefix: value.slice(0, match.index),
    suffix: value.slice((match.index ?? 0) + rawNumber.length),
    decimals: rawNumber.includes('.') ? rawNumber.split('.')[1].length : 0,
  };
}

function formatValue(parsed, current) {
  const formatter = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: parsed.decimals,
    maximumFractionDigits: parsed.decimals,
  });

  return `${parsed.prefix}${formatter.format(current)}${parsed.suffix}`;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;

    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (event) => setReduced(event.matches);

    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', handleChange);
      return () => query.removeEventListener('change', handleChange);
    }

    query.addListener(handleChange);
    return () => query.removeListener(handleChange);
  }, []);

  return reduced;
}

export default function AnimatedNumber({ value, className, dir }) {
  const parsed = useMemo(() => parseAnimatedValue(value), [value]);
  const reduceMotion = usePrefersReducedMotion();
  const finalText = parsed?.finalText ?? value;
  const [displayText, setDisplayText] = useState(finalText);

  useEffect(() => {
    if (!parsed || reduceMotion || TEST_MODE) {
      setDisplayText(finalText);
      return undefined;
    }

    const requestFrame = typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame
      : (callback) => setTimeout(() => callback(performance.now()), 16);
    const cancelFrame = typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame : clearTimeout;
    const duration = 760;
    const start = parsed.numericValue > 0 ? Math.max(0, parsed.numericValue * 0.18) : 0;
    const delta = parsed.numericValue - start;
    let frameId = null;
    let startTime = null;

    const tick = (timestamp) => {
      if (startTime == null) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayText(formatValue(parsed, start + delta * eased));

      if (progress < 1) {
        frameId = requestFrame(tick);
      } else {
        setDisplayText(finalText);
      }
    };

    setDisplayText(formatValue(parsed, start));
    frameId = requestFrame(tick);

    return () => {
      if (frameId != null) cancelFrame(frameId);
    };
  }, [finalText, parsed, reduceMotion]);

  return (
    <span dir={dir} className={className}>
      {displayText}
    </span>
  );
}
