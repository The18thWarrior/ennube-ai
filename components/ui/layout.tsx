import React from 'react'

export interface LayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Restrict max width: 'sm' | 'md' | 'lg' | 'xl' */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl'
}

const maxWidthClasses: Record<NonNullable<LayoutProps['maxWidth']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl'
}

export const Layout: React.FC<LayoutProps> = ({
  maxWidth = 'xl',
  className = '',
  children,
  ...props
}) => {
  const classes = [
    'mx-auto',
    'px-4',
    maxWidthClasses[maxWidth],
    className
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}

export default Layout
