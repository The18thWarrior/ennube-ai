import React from 'react';

export interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 'row' for horizontal layout, 'col' for vertical layout */
  direction?: 'row' | 'col';
  /** Tailwind alignment classes suffix, e.g. 'center' for items-center */
  align?: string;
  /** Tailwind justify classes suffix, e.g. 'between' for justify-between */
  justify?: string;
  
  gap?: string | number; // Optional gap prop for spacing between items
}

export const Flex: React.FC<FlexProps> = ({
  direction = 'row',
  align,
  justify,
  className = '',
  children,
  gap,
  ...props
}) => {
  const classes = [
    'flex',
    direction === 'row' ? 'flex-row' : 'flex-col',
    align ? `items-${align}` : '',
    justify ? `justify-${justify}` : '',
    gap ? `gap-${gap}` : '', // Add gap class if provided
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Flex;
