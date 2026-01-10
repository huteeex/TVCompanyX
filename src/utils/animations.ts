/**
 * Framer Motion Animation Utilities
 * Premium UI/UX Design System 2026
 */

export const fadeInUp = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
}

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.7 }
}

export const scaleIn = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
}

export const slideInRight = {
  initial: { x: 24, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  transition: { duration: 0.6 }
}

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

export const staggerItem = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1]
    }
  }
}

export const hoverScale = {
  whileHover: { 
    scale: 1.03,
    transition: { duration: 0.25 }
  },
  whileTap: { 
    scale: 0.97,
    transition: { duration: 0.1 }
  }
}

export const hoverLift = {
  whileHover: { 
    y: -8,
    transition: { duration: 0.3 }
  }
}

// Usage example:
// import { fadeInUp, staggerContainer, staggerItem } from '@/utils/animations'
//
// <motion.div {...fadeInUp}>
//   Content
// </motion.div>
//
// <motion.div variants={staggerContainer} initial="hidden" animate="visible">
//   {items.map((item, i) => (
//     <motion.div key={i} variants={staggerItem}>
//       {item}
//     </motion.div>
//   ))}
// </motion.div>
