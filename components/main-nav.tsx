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

  return (
    <div className="flex items-center gap-4">
      <CustomLink href="/">
        <Button variant="none" className="p-0 text-md content-end flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Home"
            width="48"
            height="48"
            className="min-w-8"
          />
          Ennube.ai
        </Button>
      </CustomLink>
      <TooltipProvider>
        <NavigationMenu>
          {!isLoadingSubscription && 
              <NavigationMenuList>
              {/* <NavigationMenuItem>
                <NavigationMenuTrigger className="px-2">
                  Server Side
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    <ListItem href="/server-example" title="RSC Example">
                      Protecting React Server Component.
                    </ListItem>
                    <ListItem href="/middleware-example" title="Middleware Example">
                      Using Middleware to protect pages & APIs.
                    </ListItem>
                    <ListItem href="/api-example" title="Route Handler Example">
                      Getting the session inside an API Route.
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem> */}
              {/* <NavigationMenuItem>
                <NavigationMenuLink
                  href="/client-example"
                  className={navigationMenuTriggerStyle()}
                >
                  Client Side
                </NavigationMenuLink>
              </NavigationMenuItem> */}

              { 
                <NavigationMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <NavigationMenuLink
                        href="/dashboard"
                        className={cn(
                          navigationMenuTriggerStyle(),
                          highlightDashboard && highlightStyle
                        )}
                      >
                        Dashboard
                      </NavigationMenuLink>
                    </TooltipTrigger>
                    {highlightDashboard && (
                      <TooltipContent side="bottom" className="max-w-[220px] text-center">
                        <p>{dashboardTooltip}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </NavigationMenuItem>
              }
              { 
                <NavigationMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <NavigationMenuLink
                        href="/agents"
                        className={cn(
                          navigationMenuTriggerStyle(),
                          highlightAgents && highlightStyle
                        )}
                      >
                        Agents
                      </NavigationMenuLink>
                    </TooltipTrigger>
                    {highlightAgents && (
                      <TooltipContent side="bottom" className="max-w-[220px] text-center">
                        <p>{agentsTooltip}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </NavigationMenuItem>
              }
              <NavigationMenuItem>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <NavigationMenuLink
                      href="/integrations"
                      className={cn(
                        navigationMenuTriggerStyle(),
                        highlightIntegrations && highlightStyle
                      )}
                    >
                      Integrations
                    </NavigationMenuLink>
                  </TooltipTrigger>
                  {highlightIntegrations && (
                    <TooltipContent side="bottom" className="max-w-[220px] text-center">
                      <p>{integrationTooltip}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </NavigationMenuItem>
              {licenseCount > 2 && isPrimary && 
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
