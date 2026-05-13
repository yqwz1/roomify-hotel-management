import { motion } from 'framer-motion';

const EASE = [0.21, 0.47, 0.32, 0.98];

const VARIANTS = {
  up: { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } },
  down: { hidden: { opacity: 0, y: -24 }, visible: { opacity: 1, y: 0 } },
  fade: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
  scale: { hidden: { opacity: 0, scale: 0.96 }, visible: { opacity: 1, scale: 1 } },
};

/**
 * Reveal — fades children in once they scroll into view.
 * Drop-in replacement for a <div>. Pass `delay` to stagger sibling reveals.
 */
export default function Reveal({
  children,
  as: Tag = 'div',
  className,
  delay = 0,
  duration = 0.7,
  variant = 'up',
  once = true,
  margin = '-80px',
  ...rest
}) {
  const MotionTag = motion[Tag] || motion.div;
  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin }}
      variants={VARIANTS[variant] || VARIANTS.up}
      transition={{ duration, delay, ease: EASE }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

export { EASE };
