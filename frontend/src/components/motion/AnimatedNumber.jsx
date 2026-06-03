export default function AnimatedNumber({ value, className, dir }) {
  return (
    <span dir={dir} className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {value}
    </span>
  );
}
