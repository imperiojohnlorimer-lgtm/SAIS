import React from 'react';

export const Card = ({ children, className = "", ...props }) => (
  <div 
    className={`bg-white rounded-2xl border border-slate-200 shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const CardContent = ({ children, className = "", ...props }) => (
  <div className={`${className}`} {...props}>
    {children}
  </div>
);
