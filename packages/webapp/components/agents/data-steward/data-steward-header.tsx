"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Shield, Users, Heart, Star, X, Clipboard } from "lucide-react"
import { agents } from "@/resources/agent-defintion"
import { AgentProfileHeader } from "../agent-profile-header"

const dataStewardAgent = agents.find(agent => agent.apiName === 'data-steward')
export default function DataStewardHeader() {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)

  // return (
  //   <div >
  //     {/* Image Modal */}
  //     {isImageModalOpen && (
  //       <div
  //         className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
  //         onClick={() => setIsImageModalOpen(false)}
  //       >
  //         <div className="relative max-w-4xl max-h-[90vh]">
  //           <button
  //             className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300 transition-colors"
  //             onClick={() => setIsImageModalOpen(false)}
  //           >
  //             <X className="h-8 w-8" />
  //           </button>
  //           <Image
  //             src="/prospect-finder.png"
  //             alt="Prospect Finder Profile"
  //             width={800}
  //             height={800}
  //             className="object-contain max-h-[90vh]"
  //           />
  //         </div>
  //       </div>
  //     )}

  //     {/* Profile Header */}
  //     <div className="relative bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 py-16">
  //       <div className="mx-auto max-w-7xl px-6 lg:px-8">
  //         <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-white">
  //           <div
  //             className="relative w-48 h-48 rounded-lg overflow-hidden border-4 border-white shadow-xl cursor-pointer transition-transform hover:scale-105"
  //             onClick={() => setIsImageModalOpen(true)}
  //           >
  //             <Image
  //               src="/prospect-finder.png"
  //               alt="Prospect Finder Profile"
  //               width={400}
  //               height={400}
  //               className="object-cover"
  //             />
  //             <div className="absolute inset-0 bg-black/0 hover:bg-black/10 flex items-center justify-center transition-all">
  //               <span className="text-white opacity-0 hover:opacity-100 font-medium">Click to zoom</span>
  //             </div>
  //           </div>
  //           <div className="text-center md:text-left">
  //             <div className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-sm mb-2">
  //               Online Now
  //             </div>
  //             <h1 className="text-4xl font-bold">Prospect Finder</h1>
  //             <p className="text-xl opacity-90 mt-1">
  //               🌍 Track down high-quality prospects for the world's best tech teams
  //             </p>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // )

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
                src={dataStewardAgent?.image || "/data-steward.png"}
                alt="Data Steward Profile"
                width={800}
                height={800}
                className="object-contain max-h-[90vh]"
              />
            </button>
          </div>
        </div>
      )}
    
      <AgentProfileHeader
        name={dataStewardAgent?.name || "Data Steward"}
        tagline="Keep your CRM data clean, accurate, and up-to-date"
        imageSrc={dataStewardAgent?.image || "/data-steward.png"}
        hasImage={true}
        status="Online Now"
        onImageClick={() => setIsImageModalOpen(true)}
      />
    </>
  )
}
