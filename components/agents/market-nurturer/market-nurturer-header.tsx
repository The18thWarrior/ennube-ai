"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Shield, Users, Heart, Star, X, Clipboard } from "lucide-react"
import { agents } from "@/resources/agent-defintion"
import { AgentProfileHeader } from "../agent-profile-header"

const marketNurturerAgent = agents.find(agent => agent.apiName === 'market-nurturer')
export default function MarketNurturerHeader() {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)

  return (
    <>
      {isImageModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300 transition-colors"
              onClick={() => setIsImageModalOpen(false)}
            >
              <Image
                src={marketNurturerAgent?.image || "/market-nurturer.png"}
                alt="Market Nurturer Profile"
                width={800}
                height={800}
                className="object-contain max-h-[90vh]"
              />
            </button>
          </div>
        </div>
      )}
    
      <AgentProfileHeader
        name={marketNurturerAgent?.name || "Market Nurturer"}
        tagline="Nurture and grow your leads"
        imageSrc={marketNurturerAgent?.image || "/market-nurturer.png"}
        hasImage={true}
        status="Online Now"
        onImageClick={() => setIsImageModalOpen(true)}
      />
    </>
  )
}
