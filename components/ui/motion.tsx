'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Fade in animation
export const FadeIn = ({ 
  children, 
  className, 
  delay = 0,
  duration = 0.5 
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration, delay }}
    className={cn(className)}
  >
    {children}
  </motion.div>
);

// Stagger animation for lists
export const StaggerContainer = ({ 
  children, 
  className,
  staggerDelay = 0.1
}: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={{
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: staggerDelay
        }
      }
    }}
    className={cn(className)}
  >
    {children}
  </motion.div>
);

// Stagger item
export const StaggerItem = ({ 
  children, 
  className 
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
    }}
    className={cn(className)}
  >
    {children}
  </motion.div>
);

// Scale animation for cards
export const ScaleIn = ({ 
  children, 
  className,
  delay = 0,
  duration = 0.3
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration, delay }}
    className={cn(className)}
  >
    {children}
  </motion.div>
);

// Slide in from left
export const SlideInLeft = ({ 
  children, 
  className,
  delay = 0,
  duration = 0.5
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, x: -50 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration, delay }}
    className={cn(className)}
  >
    {children}
  </motion.div>
);

// Slide in from right
export const SlideInRight = ({ 
  children, 
  className,
  delay = 0,
  duration = 0.5
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, x: 50 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration, delay }}
    className={cn(className)}
  >
    {children}
  </motion.div>
);
