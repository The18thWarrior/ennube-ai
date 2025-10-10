"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Shield, Users, Heart, Star, X, Clipboard } from "lucide-react"
import { agents } from "@/resources/agent-defintion"
import { AgentProfileHeader } from "../agent-profile-header"

const meetingBookerAgent = agents.find(agent => agent.apiName === 'meetings-booker')
export default function MeetingsBookerHeader() {
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
                src={meetingBookerAgent?.image || "/meeting-booker.png"}
                alt="Meeting Booker Profile"
                width={800}
                height={800}
                className="object-contain max-h-[90vh]"
              />
            </button>
          </div>
        </div>
      )}
    
      <AgentProfileHeader
        name={meetingBookerAgent?.name || "Meeting Booker"}
        tagline="Schedule and manage your meetings effortlessly"
        imageSrc={meetingBookerAgent?.image || "/meeting-booker.png"}
        hasImage={true}
        status="Online Now"
        onImageClick={() => setIsImageModalOpen(true)}
      />
    </>
  )
}
