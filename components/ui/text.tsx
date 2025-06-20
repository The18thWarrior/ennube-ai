import React from 'react';

export interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: 'default' | 'muted' | 'label';
}

export const Text: React.FC<TextProps> = ({ children, className = '', variant = 'default', ...props }) => (
  <p className={`${className} text-${variant}`} {...props}>
    {children}
  </p>
);

export default Text;
