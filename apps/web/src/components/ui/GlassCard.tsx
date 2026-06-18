import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  hoverEffect?: boolean;
  variant?: 'default' | 'elevated' | 'sunken' | 'accent' | 'danger';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hoverEffect = false,
  variant = 'default',
  ...props
}) => {
  const variantClass = {
    default:  'glass-card',
    elevated: 'glass-card border-white/15 bg-white/[0.09]',
    sunken:   'bg-white/[0.03] border border-white/[0.06] rounded-[20px]',
    accent:   'bg-[rgba(255,159,124,0.07)] border border-[rgba(255,159,124,0.18)] rounded-[20px]',
    danger:   'bg-[rgba(232,85,85,0.06)] border border-[rgba(232,85,85,0.18)] rounded-[20px]',
  }[variant];

  return (
    <motion.div
      className={`${variantClass} p-6 transition-colors duration-200 ${
        hoverEffect
          ? 'cursor-pointer hover:bg-white/[0.10] hover:border-white/20'
          : ''
      } ${className}`}
      whileHover={hoverEffect ? { y: -2 } : undefined}
      transition={hoverEffect ? { duration: 0.18, ease: [0.16, 1, 0.3, 1] } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;
