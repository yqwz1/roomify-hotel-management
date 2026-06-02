import { motion, useReducedMotion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

import { EASE } from './Reveal';

export default function PageTransition({ children, className = '' }) {
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      key={location.pathname}
      className={`motion-stagger-parent min-w-0 ${className}`}
      initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.985, filter: 'blur(4px)' }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
