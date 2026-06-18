import React, { forwardRef } from 'react';

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: boolean;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className = '', leftIcon, rightIcon, type, error, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {leftIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-white/35 pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={`glass-input ${error ? 'error' : ''} ${leftIcon ? 'pl-[42px]' : ''} ${
            rightIcon ? 'pr-11' : ''
          } ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-white/40">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';

export default GlassInput;
