import { motion, useReducedMotion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

import { EASE } from './Reveal';

export default function PageTransition({ children, className = '' }) {
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      key={location.pathname}
      className={`min-w-0 ${className}`}
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
