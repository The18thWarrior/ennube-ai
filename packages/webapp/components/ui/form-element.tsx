import React from 'react'

export interface FormElementProps extends React.FormHTMLAttributes<HTMLFormElement> {}

export const FormElement: React.FC<FormElementProps> = ({ children, ...props }) => (
  <form {...props}>
    {children}
  </form>
)

export default FormElement
