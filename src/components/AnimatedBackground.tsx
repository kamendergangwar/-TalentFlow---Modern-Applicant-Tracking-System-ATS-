import { motion, useReducedMotion } from "framer-motion";

const AnimatedBackground = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 background-wash" />

      <motion.div
        className="background-glow background-glow-one"
        animate={
          prefersReducedMotion
            ? { opacity: 0.45 }
            : { x: [0, 36, -18, 0], y: [0, -24, 12, 0], scale: [1, 1.06, 0.98, 1] }
        }
        transition={{ duration: 20, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
      />

      <motion.div
        className="background-glow background-glow-two"
        animate={
          prefersReducedMotion
            ? { opacity: 0.38 }
            : { x: [0, -30, 16, 0], y: [0, 20, -14, 0], scale: [1, 0.96, 1.05, 1] }
        }
        transition={{ duration: 24, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
      />

      <motion.div
        className="background-panel background-panel-one"
        animate={
          prefersReducedMotion
            ? { opacity: 0.72 }
            : { x: [0, 20, -10, 0], y: [0, -14, 10, 0], rotate: [-12, -10, -13, -12] }
        }
        transition={{ duration: 22, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
      />

      <motion.div
        className="background-panel background-panel-two"
        animate={
          prefersReducedMotion
            ? { opacity: 0.56 }
            : { x: [0, -18, 14, 0], y: [0, 18, -10, 0], rotate: [10, 12, 8, 10] }
        }
        transition={{ duration: 26, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
      />

      <motion.div
        className="background-beam"
        animate={
          prefersReducedMotion
            ? { opacity: 0.3 }
            : { x: [0, 24, -18, 0], rotate: [-8, -4, -10, -8], opacity: [0.24, 0.38, 0.28, 0.24] }
        }
        transition={{ duration: 20, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
      />

      <motion.div
        className="background-grid"
        animate={prefersReducedMotion ? { opacity: 0.1 } : { opacity: [0.08, 0.14, 0.1] }}
        transition={{ duration: 12, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
      />

      <div className="absolute inset-0 background-dots" />
      <div className="absolute inset-0 background-focus" />
    </div>
  );
};

export default AnimatedBackground;
