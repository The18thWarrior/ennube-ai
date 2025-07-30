
"use client"

import {
  User,
  Briefcase,
  Building,
  Target,
  DollarSign,
  Calendar,
  Mail,
  Phone,
  Globe,
  FileText,
  Send,
  Users,
  Tag,
  BarChart,
  ShoppingCart,
  LayoutDashboard,
} from "lucide-react"

import type { LucideIcon } from "lucide-react"

export type RecordType =
  | 'lead'
  | 'account'
  | 'contact'
  | 'opportunity'
  | 'quote'
  | 'email'
  | 'user'
  | 'industry'
  | 'company'
  | 'dashboard'
  | 'shopping'
  | 'tag'
  | 'chart'
  | 'calendar'
  | 'phone'
  | 'website'
  | 'file'
  | 'default';

const iconMap: Record<RecordType, LucideIcon> = {
  lead: Target,
  account: Building,
  contact: User,
  opportunity: DollarSign,
  quote: FileText,
  email: Mail,
  user: User,
  industry: Briefcase,
  company: Building,
  dashboard: LayoutDashboard,
  shopping: ShoppingCart,
  tag: Tag,
  chart: BarChart,
  calendar: Calendar,
  phone: Phone,
  website: Globe,
  file: FileText,
  default: FileText,
};

export class RecordIcon {
  static getIcon(recordType: RecordType): LucideIcon {
    return iconMap[recordType] || iconMap['default'];
  }
}
