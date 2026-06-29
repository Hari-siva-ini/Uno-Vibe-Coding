import { motion, type Variants } from 'framer-motion';

export const cardVariants: Variants = {
  hidden: { opacity: 0, y: 50, rotateY: 180 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateY: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: 'easeOut' },
  }),
  hover: { y: -20, scale: 1.08, transition: { duration: 0.2 } },
  tap: { scale: 0.95 },
};

export const dealVariants: Variants = {
  hidden: { opacity: 0, x: -200, rotate: -30 },
  visible: { opacity: 1, x: 0, rotate: 0, transition: { type: 'spring', stiffness: 200 } },
};

export const flipVariants: Variants = {
  front: { rotateY: 0 },
  back: { rotateY: 180 },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300 } },
};

export const unoFlashVariants: Variants = {
  animate: {
    scale: [1, 1.3, 1],
    opacity: [1, 0.7, 1],
    transition: { duration: 0.6, repeat: 3 },
  },
};

export const winnerVariants: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 200, damping: 10 },
  },
};

export const MotionDiv = motion.div;
