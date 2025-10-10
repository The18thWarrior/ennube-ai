"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import ExecuteButton from "./agents/data-steward/data-steward-execute-button"
import UsageButton from "./agents/usage-button"
import CustomLink from "./custom-link"
import { MainNav } from "./main-nav"
import { ThemeToggle } from "./theme-toggle"
import UserButton from "./user-button"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import AdminDropdown from "./admin-dropdown"
import { usePathname } from "next/navigation"

type Props = {
  checkAdmin: boolean;
  user: { name: string | undefined | null; email: string | undefined | null; image: string | undefined | null} | null;
}

export default function HeaderClient({ checkAdmin, user }: Props) {
  const pathname = usePathname() || "/"
  const isChat = useMemo(() => pathname.startsWith("/chat"), [pathname])
  //const [navVisible, setNavVisible] = useState(!isChat)
  const [navVisible, setNavVisible] = useState(true)
  const hoverRef = useRef<HTMLDivElement | null>(null)
  const headerRef = useRef<HTMLElement | null>(null)
  // Track whether either the floating UserButton or the header is being hovered
  const isHoveringButtonRef = useRef(false)
  const isHoveringHeaderRef = useRef(false)
  // Optional timeout to delay hiding so quick moves between button and header don't flicker
  const hideTimeoutRef = useRef<number | null>(null)

  // Height in px of the navbar; keep in sync with CSS h-16 used elsewhere
  const NAV_HEIGHT = 64

  // Manage top padding on the main content to avoid being hidden by the fixed header
  useEffect(() => {
    const root = document.documentElement
    if (true) {
      // For non-chat routes, ensure content is pushed down by nav height
      root.style.setProperty("--site-header-height", `${NAV_HEIGHT}px`)
      document.body.style.paddingTop = `${NAV_HEIGHT}px`
    } else {
      // For chat routes, remove top padding
      root.style.removeProperty("--site-header-height")
      document.body.style.paddingTop = `0px`
    }

    return () => {
      // Tidy up when component unmounts
      root.style.removeProperty("--site-header-height")
      document.body.style.paddingTop = ""
    }
  }, [isChat])

  // Keep navVisible in sync with route changes
  // useEffect(() => {
  //   setNavVisible(!isChat)
  // }, [isChat])

  // Hover handlers for the floating button
  function handleMouseEnter() {
    if (!isChat) return
    // Hovering the floating button
    isHoveringButtonRef.current = true
    // Cancel any pending hide
    if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current)
    setNavVisible(true)
  }
  function handleMouseLeave() {
    // if (!isChat) return
    // // Left the floating button; schedule hide only if not hovering header
    // isHoveringButtonRef.current = false
    // if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current)
    // hideTimeoutRef.current = window.setTimeout(() => {
    //   if (!isHoveringHeaderRef.current && !isHoveringButtonRef.current) {
    //     setNavVisible(false)
    //   }
    //   hideTimeoutRef.current = null
    // }, 150)
  }

  // Header hover handlers
  function handleHeaderMouseEnter() {
    // if (!isChat) return
    // isHoveringHeaderRef.current = true
    // if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current)
    // setNavVisible(true)
  }

  function handleHeaderMouseLeave() {
    // if (!isChat) return
    // isHoveringHeaderRef.current = false
    // if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current)
    // hideTimeoutRef.current = window.setTimeout(() => {
    //   if (!isHoveringHeaderRef.current && !isHoveringButtonRef.current) {
    //     setNavVisible(false)
    //   }
    //   hideTimeoutRef.current = null
    // }, 150)
  }

  return (
    <>
      <header
        ref={headerRef}
        onMouseEnter={handleHeaderMouseEnter}
        onMouseLeave={handleHeaderMouseLeave}
        className={`fixed top-0 left-0 right-0 z-40 border-b backdrop-blur transition-transform duration-300 ease-in-out ${navVisible ? "translate-y-0" : "-translate-y-full"}`}
        style={{
          // Ensure the header does not take layout space (we manage padding on body)
          height: NAV_HEIGHT,
        }}
      >
        <div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <CustomLink href="/">
              <Button variant="none" className="p-0 text-lg font-bold content-end flex items-center gap-2">
                <Image src="/logo.png" alt="Home" width={48} height={48} className="min-w-8" />
                Ennube.ai
              </Button>
            </CustomLink>
            {checkAdmin && (
              <div className="flex items-center gap-4">
                <AdminDropdown />
              </div>
            )}
          </div>

          <MainNav />

          <div className="flex items-center gap-4">
            <ThemeToggle />
            {!isChat ? <UserButton user={user} /> : <div className={'p-2'}></div>}
            
          </div>
        </div>
      </header>

      {/* Floating expand button for chat routes */}
      {isChat && (
        <div
          ref={hoverRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="fixed top-4 right-4 z-50"
        >
          <UserButton user={user} />
        </div>
      )}
    </>
  )
}

/*
Overview:
 - Client header that is fixed to the top of viewport.
 - Uses next/navigation usePathname to toggle chat state behavior.
 - For non-chat pages, body gets top padding equal to NAV_HEIGHT to prevent content overlap.
 - For chat pages, main nav is hidden (translated -Y) and a floating button appears in top-right.
 - Hovering the floating button toggles nav visibility using translate animations.

Notes:
 - Keeps changes local to header; page content should naturally respect body padding.
 - NAV_HEIGHT is synced with previous h-16 (64px).
*/
