"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Shield, Users, Heart, Star, X, Clipboard } from "lucide-react"
import { agents } from "@/resources/agent-defintion"
import { AgentProfileHeader } from "../agent-profile-header"

const prospectFinderAgent = agents.find(agent => agent.apiName === 'prospect-finder')
export default function ProspectFinderHeader() {
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
              className="absolute -top-12 right-0 p-2 text-white hover:text-muted transition-colors"
              onClick={() => setIsImageModalOpen(false)}
            >
              <Image
                src={prospectFinderAgent?.image || "/prospect-finder.png"}
                alt="Prospect Finder Profile"
                width={800}
                height={800}
                className="object-contain max-h-[90vh]"
              />
            </button>
          </div>
        </div>
      )}
    
      <AgentProfileHeader
        name={prospectFinderAgent?.name || "Prospect Finder"}
        tagline="Track down high-quality prospects"
        imageSrc={prospectFinderAgent?.image || "/prospect-finder.png"}
        hasImage={true}
        status="Online Now"
        onImageClick={() => setIsImageModalOpen(true)}
      />
    </>
  )
}
