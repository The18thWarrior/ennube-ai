
import React, { useState } from 'react'
import * as UI from '@/components/ui'
// Import prop types for each UI component
// Add an interface export called ToggleProps
import type { FlexProps } from '@/components/ui/flex'
import type { TextProps } from '@/components/ui/text'
import type { ButtonProps } from '@/components/ui/button'
import type { JsonViewProps } from '@/components/ui/json-view'
import type { FormProps, FormItemProps, FormLabelProps, FormControlProps, FormDescriptionProps, FormMessageProps, FormFieldProps, useFormFieldProps } from '@/components/ui/form'
import type { InputProps } from '@/components/ui/input'
import type { CheckboxProps } from '@/components/ui/checkbox'
import type { SelectProps } from '@/components/ui/select'
import type { RadioGroupProps, RadioGroupItemProps } from '@/components/ui/radio-group'
import type { SwitchProps } from '@/components/ui/switch'
import type { TextareaProps } from '@/components/ui/textarea'
import type { DialogProps, DialogTriggerProps, DialogContentProps, DialogHeaderProps, DialogFooterProps } from '@/components/ui/dialog'
import type { TooltipProps, TooltipTriggerProps, TooltipContentProps } from '@/components/ui/tooltip'
import type { AlertDialogProps, AlertDialogTriggerProps, AlertDialogContentProps, AlertDialogHeaderProps, AlertDialogFooterProps } from '@/components/ui/alert-dialog'
import type { AvatarProps, AvatarImageProps, AvatarFallbackProps } from '@/components/ui/avatar'
import type { BadgeProps } from '@/components/ui/badge'
import type { ProgressProps } from '@/components/ui/progress'
import type { CardProps, CardHeaderProps, CardTitleProps, CardDescriptionProps, CardContentProps, CardFooterProps } from '@/components/ui/card'
import type { TabsProps, TabsListProps, TabsTriggerProps, TabsContentProps } from '@/components/ui/tabs'
import type { AccordionProps, AccordionItemProps, AccordionTriggerProps, AccordionContentProps } from '@/components/ui/accordion'
import type { TableProps, TableHeaderProps, TableBodyProps, TableRowProps, TableCellProps, TableHeadProps } from '@/components/ui/table'
import type { PopoverProps, PopoverTriggerProps, PopoverContentProps } from '@/components/ui/popover'
import type { ScrollAreaProps, ScrollBarProps } from '@/components/ui/scroll-area'
import type { ToastProps, ToastProviderProps, ToastViewportProps, ToastTitleProps, ToastDescriptionProps } from '@/components/ui/toast'
import type { SkeletonProps } from '@/components/ui/skeleton'
import type { CollapsibleProps, CollapsibleTriggerProps, CollapsibleContentProps } from '@/components/ui/collapsible'
import type { LabelProps } from '@/components/ui/label'
import type { LayoutProps } from '@/components/ui/layout'
import type { ToggleProps } from '@/components/ui/toggle'


// Map component type string to their props type
type UIComponentPropsMap = {
  Flex: FlexProps
  Text: TextProps
  Button: ButtonProps
  JsonView: JsonViewProps
  useFormField: useFormFieldProps
  Form: FormProps
  FormItem: FormItemProps
  FormLabel: FormLabelProps
  FormControl: FormControlProps
  FormDescription: FormDescriptionProps
  FormMessage: FormMessageProps
  FormField: FormFieldProps
  Input: InputProps
  Checkbox: CheckboxProps
  Select: SelectProps
  RadioGroup: RadioGroupProps
  RadioGroupItem: RadioGroupItemProps
  Switch: SwitchProps
  Textarea: TextareaProps
  Dialog: DialogProps
  DialogTrigger: DialogTriggerProps
  DialogContent: DialogContentProps
  DialogHeader: DialogHeaderProps
  DialogFooter: DialogFooterProps
  Tooltip: TooltipProps
  TooltipTrigger: TooltipTriggerProps
  TooltipContent: TooltipContentProps
  AlertDialog: AlertDialogProps
  AlertDialogTrigger: AlertDialogTriggerProps
  AlertDialogContent: AlertDialogContentProps
  AlertDialogHeader: AlertDialogHeaderProps
  AlertDialogFooter: AlertDialogFooterProps
  Avatar: AvatarProps
  AvatarImage: AvatarImageProps
  AvatarFallback: AvatarFallbackProps
  Badge: BadgeProps
  Progress: ProgressProps
  Card: CardProps
  CardHeader: CardHeaderProps
  CardTitle: CardTitleProps
  CardDescription: CardDescriptionProps
  CardContent: CardContentProps
  CardFooter: CardFooterProps
  Tabs: TabsProps
  TabsList: TabsListProps
  TabsTrigger: TabsTriggerProps
  TabsContent: TabsContentProps
  Accordion: AccordionProps
  AccordionItem: AccordionItemProps
  AccordionTrigger: AccordionTriggerProps
  AccordionContent: AccordionContentProps
  Table: TableProps
  TableHeader: TableHeaderProps
  TableBody: TableBodyProps
  TableRow: TableRowProps
  TableCell: TableCellProps
  TableHead: TableHeadProps
  Popover: PopoverProps
  PopoverTrigger: PopoverTriggerProps
  PopoverContent: PopoverContentProps
  ScrollArea: ScrollAreaProps
  ScrollBar: ScrollBarProps
  Toast: ToastProps
  ToastProvider: ToastProviderProps
  ToastViewport: ToastViewportProps
  ToastTitle: ToastTitleProps
  ToastDescription: ToastDescriptionProps
  Skeleton: SkeletonProps
  Collapsible: CollapsibleProps
  CollapsibleTrigger: CollapsibleTriggerProps
  CollapsibleContent: CollapsibleContentProps
  Layout: LayoutProps
  Toggle: ToggleProps
}


export interface ComponentConfig<T extends keyof UIComponentPropsMap = keyof UIComponentPropsMap> {
  type: T
  props?: UIComponentPropsMap[T]
  children?: ComponentConfig[] | string
}

export interface CustomResponseProps {
  config: ComponentConfig | ComponentConfig[]
}

export const CustomResponse: React.FC<CustomResponseProps> = ({ config }) => {
  const configs = Array.isArray(config) ? config : [config]

  // Gather initial values for all Input components
  const initializeState = () => {
    const state: Record<string, any> = {}
    const traverse = (cfgs: ComponentConfig[] | ComponentConfig) => {
      const list = Array.isArray(cfgs) ? cfgs : [cfgs]
      list.forEach((item) => {
        const props = item.props
        if (props && typeof props === 'object' && 'name' in props && typeof props.name === 'string') {
          const name = props.name as string
          if (
            ['Input', 'Textarea', 'Select', 'RadioGroup'].includes(item.type) &&
            ('defaultValue' in props)
          ) {
            state[name] = (props as { defaultValue?: any }).defaultValue ?? ''
          } else if (
            ['Checkbox', 'Switch', 'Toggle'].includes(item.type) &&
            ('defaultChecked' in props)
          ) {
            state[name] = (props as { defaultChecked?: any }).defaultChecked ?? false
          }
        }
        if (Array.isArray(item.children)) traverse(item.children)
      })
    }
    traverse(configs)
    return state
  }

  const [formData, setFormData] = useState<Record<string, any>>(initializeState)

  const renderConfig = (
    cfg: ComponentConfig | string,
    key?: string | number
  ): React.ReactNode => {
    if (typeof cfg === 'string') {
      return cfg
    }

    const { type, props = {}, children } = cfg
    if (!type) {
      console.warn('Component config missing type:', cfg)
      return null
    }
    const Component = (UI as any)[type]

    if (!Component) {
      console.warn(`Unknown component type: ${type}`, cfg)
      return null
    }
    let childNodes: React.ReactNode = null
    if (Array.isArray(children)) {
      childNodes = children.map((c, i) => renderConfig(c, i))
    } else if (typeof children === 'string') {
      childNodes = children
    } else if (children) {
      childNodes = renderConfig(children)
    }

    // Special-case for HTML form element to auto-render <form>
    if (type.toLowerCase() === 'form') {
      // TypeScript: props may not be valid for <form>, so cast to any
      return (
        <form key={key} {...(props as any)}>
          {childNodes}
        </form>
      )
    }

    // Handle Input components by binding state
    if (type === 'Input' && props && typeof props === 'object' && 'name' in props) {
      const nameKey = (props as any).name as string
      const value = formData[nameKey] ?? ''
      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let newVal: any = e.target.value
        if ('type' in props && (props as any).type === 'number') newVal = parseFloat(newVal)
        setFormData(prev => ({ ...prev, [nameKey]: newVal }))
      }
      return (
        <Component
          key={key}
          {...(props as InputProps)}
          value={value}
          onChange={handleChange}
        />
      )
    }
    // Handle Textarea components
    if (type === 'Textarea' && props && typeof props === 'object' && 'name' in props) {
      const nameKey = (props as any).name as string
      const value = formData[nameKey] ?? ''
      const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [nameKey]: e.target.value }))
      }
      return (
        <Component key={key} {...(props as TextareaProps)} value={value} onChange={handleChange} />
      )
    }
    // Handle Checkbox, Switch components
    if ((type === 'Checkbox' || type === 'Switch') && props && typeof props === 'object' && 'name' in props) {
      const nameKey = (props as any).name as string
      const checked = formData[nameKey] ?? false
      const handleChecked = (val: boolean) => setFormData(prev => ({ ...prev, [nameKey]: val }))
      return <Component key={key} {...(props as CheckboxProps | SwitchProps)} checked={checked} onCheckedChange={handleChecked} />
    }
    // Handle Toggle components
    if (type === 'Toggle' && props && typeof props === 'object' && 'name' in props) {
      const nameKey = (props as any).name as string
      const pressed = formData[nameKey] ?? false
      const handlePress = (val: boolean) => setFormData(prev => ({ ...prev, [nameKey]: val }))
      return <Component key={key} {...props as any} pressed={pressed} onPressedChange={handlePress} />
    }
    // Handle RadioGroup, Select components
    if ((type === 'RadioGroup' || type === 'Select') && props && typeof props === 'object' && 'name' in props) {
      const nameKey = (props as any).name as string
      const value = formData[nameKey] ?? ''
      const handleValue = (val: any) => setFormData(prev => ({ ...prev, [nameKey]: val }))
      return <Component key={key} {...(props as RadioGroupProps | SelectProps)} value={value} onValueChange={handleValue}>{childNodes}</Component>
    }
    // Slider is not in UIComponentPropsMap, so skip
    if (Component) {
      return (
        <Component key={key} {...props}>
          {childNodes}
        </Component>
      )
    }

    return childNodes
  }

  return <>{configs.map((cfg, i) => renderConfig(cfg, i))}</>
}

export default CustomResponse
