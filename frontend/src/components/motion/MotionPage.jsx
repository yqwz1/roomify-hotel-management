import { motion, useReducedMotion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

export const premiumEase = [0.22, 1, 0.36, 1];
export const outExpoEase = [0.16, 1, 0.3, 1];

const makeTransition = (shouldReduce, duration = 0.48, delay = 0) => ({
  duration: shouldReduce ? 0 : duration,
  delay: shouldReduce ? 0 : delay,
  ease: outExpoEase,
});

export function MotionPage({ children, className = '', as = 'div', ...props }) {
  const shouldReduce = useReducedMotion();
  const location = useLocation();
  const MotionTag = motion[as] || motion.div;

  return (
    <MotionTag
      key={location.pathname}
      className={`motion-page-enter min-w-0 ${className}`}
      initial={shouldReduce ? false : { opacity: 0, y: 18, scale: 0.992, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={shouldReduce ? undefined : { opacity: 0, y: -8, scale: 0.998, filter: 'blur(4px)' }}
      transition={makeTransition(shouldReduce, 0.56)}
      {...props}
    >
      {children}
    </MotionTag>
  );
}

export function MotionSection({ children, className = '', as = 'section', delay = 0, ...props }) {
  const shouldReduce = useReducedMotion();
  const MotionTag = motion[as] || motion.section;

  return (
    <MotionTag
      className={`motion-section-reveal min-w-0 ${className}`}
      initial={shouldReduce ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={makeTransition(shouldReduce, 0.5, delay)}
      {...props}
    >
      {children}
    </MotionTag>
  );
}

export function MotionStagger({ children, className = '', as = 'div', delayChildren = 0.06, ...props }) {
  const shouldReduce = useReducedMotion();
  const MotionTag = motion[as] || motion.div;

  return (
    <MotionTag
      className={`min-w-0 ${className}`}
      initial={shouldReduce ? false : 'hidden'}
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: shouldReduce ? 0 : 0.07,
            delayChildren: shouldReduce ? 0 : delayChildren,
          },
        },
      }}
      {...props}
    >
      {children}
    </MotionTag>
  );
}

export function MotionItem({ children, className = '', as = 'div', ...props }) {
  const shouldReduce = useReducedMotion();
  const MotionTag = motion[as] || motion.div;

  return (
    <MotionTag
      className={`motion-card-pop min-w-0 ${className}`}
      variants={{
        hidden: shouldReduce ? {} : { opacity: 0, y: 16, scale: 0.975 },
        visible: { opacity: 1, y: 0, scale: 1 },
      }}
      transition={makeTransition(shouldReduce, 0.42)}
      {...props}
    >
      {children}
    </MotionTag>
  );
}

export default MotionPage;
