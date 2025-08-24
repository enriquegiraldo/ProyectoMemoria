import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './Card';

// Tipos para las props
interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  hover?: boolean;
  click?: boolean;
  exit?: boolean;
  layout?: boolean;
  whileHover?: object;
  whileTap?: object;
  initial?: object;
  animate?: object;
  exit?: object;
  transition?: object;
}

// Variantes de animación predefinidas
const variants = {
  fadeIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  slideIn: {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 50 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
  },
  bounceIn: {
    initial: { opacity: 0, scale: 0.3 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.3 },
  },
};

// Componente principal
export function AnimatedCard({
  children,
  className = '',
  delay = 0,
  duration = 0.3,
  hover = true,
  click = true,
  exit = true,
  layout = false,
  whileHover,
  whileTap,
  initial,
  animate,
  exit: exitAnimation,
  transition,
}: AnimatedCardProps) {
  // Configuración por defecto
  const defaultInitial = initial || variants.fadeIn.initial;
  const defaultAnimate = animate || variants.fadeIn.animate;
  const defaultExit = exitAnimation || variants.fadeIn.exit;
  const defaultTransition = transition || {
    duration,
    delay,
    ease: [0.4, 0, 0.2, 1],
  };

  // Configuración de hover por defecto
  const defaultWhileHover = whileHover || (hover ? {
    y: -5,
    scale: 1.02,
    transition: { duration: 0.2 },
  } : {});

  // Configuración de click por defecto
  const defaultWhileTap = whileTap || (click ? {
    scale: 0.98,
    transition: { duration: 0.1 },
  } : {});

  const MotionCard = motion(Card);

  return (
    <AnimatePresence mode="wait">
      <MotionCard
        className={className}
        layout={layout}
        initial={defaultInitial}
        animate={defaultAnimate}
        exit={exit ? defaultExit : undefined}
        whileHover={defaultWhileHover}
        whileTap={defaultWhileTap}
        transition={defaultTransition}
      >
        {children}
      </MotionCard>
    </AnimatePresence>
  );
}

// Componente con animación de entrada escalonada
export function StaggeredCard({
  children,
  index = 0,
  staggerDelay = 0.1,
  ...props
}: AnimatedCardProps & { index?: number; staggerDelay?: number }) {
  return (
    <AnimatedCard
      {...props}
      delay={index * staggerDelay}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * staggerDelay,
        ease: [0.4, 0, 0.2, 1],
      }}
    >
      {children}
    </AnimatedCard>
  );
}

// Componente con animación de hover avanzada
export function HoverCard({
  children,
  className = '',
  ...props
}: AnimatedCardProps) {
  return (
    <AnimatedCard
      {...props}
      className={`group relative overflow-hidden ${className}`}
      whileHover={{
        y: -8,
        scale: 1.02,
        transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Efecto de brillo en hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      />
      {children}
    </AnimatedCard>
  );
}

// Componente con animación de carga
export function LoadingCard({
  children,
  loading = false,
  className = '',
  ...props
}: AnimatedCardProps & { loading?: boolean }) {
  return (
    <AnimatedCard
      {...props}
      className={`relative ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      {loading && (
        <motion.div
          className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
      )}
      {children}
    </AnimatedCard>
  );
}

// Componente con animación de flip
export function FlipCard({
  children,
  front,
  back,
  isFlipped = false,
  className = '',
  ...props
}: AnimatedCardProps & {
  front: React.ReactNode;
  back: React.ReactNode;
  isFlipped?: boolean;
}) {
  return (
    <div className={`relative perspective-1000 ${className}`}>
      <motion.div
        className="relative w-full h-full"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Frente */}
        <motion.div
          className="absolute inset-0 backface-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <AnimatedCard {...props}>{front}</AnimatedCard>
        </motion.div>

        {/* Reverso */}
        <motion.div
          className="absolute inset-0 backface-hidden"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <AnimatedCard {...props}>{back}</AnimatedCard>
        </motion.div>
      </motion.div>
    </div>
  );
}

// Componente con animación de aparición en lista
export function ListCard({
  children,
  index = 0,
  total = 1,
  className = '',
  ...props
}: AnimatedCardProps & { index?: number; total?: number }) {
  const progress = index / total;

  return (
    <AnimatedCard
      {...props}
      className={className}
      initial={{ opacity: 0, x: -100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay: progress * 0.1,
        ease: [0.4, 0, 0.2, 1],
      }}
      whileHover={{
        x: 10,
        scale: 1.02,
        transition: { duration: 0.2 },
      }}
    >
      {children}
    </AnimatedCard>
  );
}

// Hook para animaciones personalizadas
export function useCardAnimation() {
  const createAnimation = (type: keyof typeof variants) => {
    return {
      initial: variants[type].initial,
      animate: variants[type].animate,
      exit: variants[type].exit,
    };
  };

  const createStaggerAnimation = (delay: number = 0.1) => {
    return {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { delay },
    };
  };

  return {
    createAnimation,
    createStaggerAnimation,
    variants,
  };
}
