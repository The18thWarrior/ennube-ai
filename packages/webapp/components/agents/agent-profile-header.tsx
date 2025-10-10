"use client"

import type React from "react"

import Image from "next/image"

export interface AgentProfileHeaderProps {
  name: string
  tagline: string
  imageSrc?: string
  hasImage: boolean
  status: string
  icon?: React.ReactNode
  onImageClick?: () => void
}

export function AgentProfileHeader({
  name,
  tagline,
  imageSrc,
  hasImage,
  status,
  icon,
  onImageClick,
}: AgentProfileHeaderProps) {
  return (
    <div className="relative bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-white">
          <div
            className={`relative w-48 h-48 rounded-lg overflow-hidden border-4 border-white shadow-xl cursor-pointer transition-transform hover:scale-105 ${!hasImage ? "flex items-center justify-center bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500" : ""}`}
            onClick={onImageClick}
          >
            {hasImage && imageSrc ? (
              <Image
                src={imageSrc || "/placeholder.svg"}
                alt={`${name} Profile`}
                width={400}
                height={400}
                className="object-cover"
              />
            ) : (
              icon
            )}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 flex items-center justify-center transition-all">
              <span className="text-white opacity-0 hover:opacity-100 font-medium">Click to zoom</span>
            </div>
          </div>
          <div className="text-center md:text-left">
            <div className="inline-block px-3 py-1 rounded-full /20 backdrop-blur-sm text-sm mb-2">
              {status}
            </div>
            <h1 className="text-4xl font-bold">{name}</h1>
            <p className="text-xl opacity-90 mt-1">{tagline}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
