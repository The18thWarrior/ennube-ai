"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ExternalLink, Globe } from "lucide-react"
import { useState, useEffect } from "react"

interface LinkPreviewProps {
  url: string
  title?: string
  description?: string
  image?: string
  domain?: string
}

export function LinkPreview({ url, title, description, image, domain }: LinkPreviewProps) {
  const [favicon, setFavicon] = useState<string>("")

  useEffect(() => {
    if (domain) {
      setFavicon(`https://www.google.com/s2/favicons?domain=${domain}&sz=16`)
    }
  }, [domain])

  return (
    <Card className="my-2 border-blue-200 hover:border-blue-300 transition-colors cursor-pointer">
      <CardContent className="p-3">
        <a href={url} target="_blank" rel="noopener noreferrer" className="block hover:no-underline">
          <div className="flex gap-3">
            {image && (
              <div className="flex-shrink-0">
                <img
                  src={image || "/placeholder.svg"}
                  alt={title || "Link preview"}
                  className="w-16 h-16 object-cover rounded"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {favicon ? (
                  <img src={favicon || "/placeholder.svg"} alt="" className="w-4 h-4" />
                ) : (
                  <Globe className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-xs text-muted-foreground truncate">{domain || new URL(url).hostname}</span>
                <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto flex-shrink-0" />
              </div>
              {title && <h4 className="font-medium text-sm line-clamp-2 text-blue-600 hover:text-blue-800">{title}</h4>}
              {description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{description}</p>}
            </div>
          </div>
        </a>
      </CardContent>
    </Card>
  )
}
