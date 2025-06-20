"use client"

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

// Props interfaces for collapsible components
export interface CollapsibleProps extends React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Root> {}
export interface CollapsibleTriggerProps extends React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleTrigger> {}
export interface CollapsibleContentProps extends React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleContent> {}

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger

const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
