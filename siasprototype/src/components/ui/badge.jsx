import React from 'react';

export const Badge = ({ children, variant = 'default' }) => {
  const styles = {
    default: 'bg-emerald-100 text-emerald-700',
    secondary: 'bg-amber-100 text-amber-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    error: 'bg-rose-100 text-rose-700',
    destructive: 'bg-rose-100 text-rose-700',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[variant]}`}>
      {children}
    </span>
  );
};
