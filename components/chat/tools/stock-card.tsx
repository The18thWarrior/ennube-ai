"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface StockData {
  symbol: string
  price: number
  change: number
  changePercent: number
}

export function StockCard(data: StockData) {
  const isPositive = data.change >= 0
  const ChangeIcon = data.change === 0 ? Minus : isPositive ? TrendingUp : TrendingDown

  return (
    <Card className="my-2 border-green-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">Stock: {data.symbol}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">${data.price.toFixed(2)}</p>
        <div className={cn("flex items-center text-sm", isPositive ? "text-green-600" : "text-red-600")}>
          <ChangeIcon className="mr-1 h-4 w-4" />
          <span>
            {data.change.toFixed(2)} ({data.changePercent.toFixed(2)}%)
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
