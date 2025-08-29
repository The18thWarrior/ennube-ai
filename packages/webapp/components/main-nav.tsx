"use client"

import Image from "next/image"

import { cn } from "@/lib/utils"
import CustomLink from "./custom-link"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "./ui/navigation-menu"
import React from "react"
import { Button } from "./ui/button"
import { SubscribeButton } from "./subscribe-button"
import { ThemeToggle } from "./theme-toggle"
import { useStripe } from "@/lib/stripe-context"
import { useRouter } from "next/navigation"
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { it } from "node:test"

interface NavigationListItem {
  href: string;
  title: string;
  description?: string;
  icon?: React.ElementType;
  children?: React.ReactNode;
}

export function MainNav() {
  const { hasSubscription, isPrimary, isLoadingSubscription, isLoading, licenseCount } = useStripe();
  const { stage, isLoading: isLoadingOnboarding } = useOnboardingStatus();
  const router = useRouter();
  const handleHome = () => {
    router.push('/');
  }

  // Determine highlighted menu items based on onboarding status
  const highlightIntegrations = stage === 'needs_credential';
  const highlightAgents = stage === 'needs_agent_config';
  const highlightDashboard = stage === 'has_not_executed';

  // Define tooltip content based on onboarding stage
  const integrationTooltip = "Connect your Salesforce account to get started";
  const agentsTooltip = "Configure your agent settings to start automating tasks";
  const dashboardTooltip = "Run your first agent to complete setup";
  
  // Highlight style for the menu item that needs attention
  const highlightStyle = "bg-amber-100 dark:bg-amber-900 border border-amber-300 dark:border-amber-700 font-medium";

  const navigationList = [
    {
      href: "/chat",
      title: "Chat",
      description: "Manage your chat conversations",
    },
    {
      href: "/apps",
      title: "Apps",
      description: "Manage your applications",
    },
    {
      href: "/dashboard",
      title: "Usage",
      description: "View your usage statistics",
    },
    // {
    //   href: "/agents",
    //   title: "Agents",
    //   description: "Manage your applications",
    // },
    {
      href: "/integrations",
      title: "Connections",
      description: "Manage your applications",
    }
  ] as NavigationListItem[];
  return (
    <div className="flex items-center gap-4">
      <TooltipProvider>
        <NavigationMenu>
          {!isLoadingSubscription && 
              <NavigationMenuList>
                {navigationList.map((item, index) => {
                  if (item.children) {
                    return (
                      <NavigationMenuItem key={index}>
                        {item.children}
                      </NavigationMenuItem>
                    );
                  }
                  return (
                    <NavigationMenuLink
                      href={item.href}
                      key={index}
                      className={navigationMenuTriggerStyle()}
                    >
                      {item.title}
                  </NavigationMenuLink>
                  )


                })}
              {licenseCount >= 2 && isPrimary && 
                <NavigationMenuItem>
                  <NavigationMenuLink
                    href="/account/users"
                    className={navigationMenuTriggerStyle()}
                  >
                    Users
                  </NavigationMenuLink>
                </NavigationMenuItem>
              }
              {!hasSubscription && isPrimary && 
                <NavigationMenuItem>
                  <SubscribeButton />
                </NavigationMenuItem>
              }
              
              {/* <NavigationMenuItem>
                <ThemeToggle />
              </NavigationMenuItem> */}
            </NavigationMenuList>
          }
        </NavigationMenu>
      </TooltipProvider>
    </div>
  )
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"
