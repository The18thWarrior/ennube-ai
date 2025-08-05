"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sun, Cloud, CloudRain, CloudSun } from "lucide-react"

interface WeatherData {
  location: string
  temperature: number
  condition: string
  forecast: { day: string; temp: number }[]
}

const weatherIcons: { [key: string]: React.ElementType } = {
  Sunny: Sun,
  Cloudy: Cloud,
  "Partly Cloudy": CloudSun,
  Rainy: CloudRain,
}

export function WeatherCard(data: WeatherData) {
  const IconComponent = weatherIcons[data.condition] || Cloud
  return (
    <Card className="my-2 border-blue-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <IconComponent className="mr-2 h-6 w-6 text-blue-500" />
          Weather in {data.location}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{data.temperature}°C</p>
        <p className="text-muted-foreground">{data.condition}</p>
        <div className="mt-2">
          <h4 className="text-sm font-semibold">Forecast:</h4>
          <div className="flex space-x-2 text-xs">
            {data.forecast.map((f) => (
              <div key={f.day} className="text-center">
                <p>{f.day}</p>
                <p>{f.temp}°C</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
