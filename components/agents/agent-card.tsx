"use client"
import React, { useState, useMemo } from 'react';
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Megaphone, Lock, Sparkles, Clock, Users, Settings, Search, Filter, Tag } from "lucide-react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface AgentCardProps {
  // You can add props here as needed
    agent: {
        id: number;
        name: string;
        role: string;
        description: string;
        skills: string[];
        link: string;
        hasImage?: boolean;
        image?: string;
        isNew?: boolean;
        comingSoon?: boolean;
        button: React.ReactNode;
    };
}

export function AgentCard({ agent }: AgentCardProps) {
  return (
    <>
        <div
            key={agent.id}
            className="flex flex-col bg-card text-card-foreground rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 relative border border-border dark:border-border"
        >
            {agent.isNew && (
            <div className="absolute -top-2 right-4">
                <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/20 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-400">
                New
                </span>
            </div>
            )}
            {agent.comingSoon && (
            <div className="absolute -top-2 right-4">
                <span className="inline-flex items-center rounded-full bg-yellow-100 dark:bg-amber-900/20 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:text-yellow-400">
                Coming Soon
                </span>
            </div>
            )}
            <div className="flex items-center gap-x-4 mb-4">
            <Link href={agent.link}>
                {agent.hasImage ? (
                <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-purple-200 dark:border-purple-800 flex items-center justify-center">
                    <Image
                    src={agent.image || "/placeholder.svg"}
                    alt={agent.name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                    />
                </div>
                ) : (
                <div className="h-20 w-20 flex items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                    {agent.name === "Market Nurturer" && (
                    <Megaphone className="h-10 w-10 text-white" aria-hidden="true" />
                    )}
                    {agent.name === "Team Recruiter" && (
                    <Users className="h-10 w-10 text-white" aria-hidden="true" />
                    )}
                    {agent.name === "System Admin" && (
                    <Settings className="h-10 w-10 text-white" aria-hidden="true" />
                    )}
                </div>
                )}
            </Link>
            <div>
                <h2 className="text-xl font-semibold leading-7 text-foreground">{agent.name}</h2>
                <p className="text-sm text-purple-600 dark:text-purple-400">{agent.role}</p>
            </div>
            </div>
            <div className="mt-2 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
            <p className="flex-auto">{agent.description}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
                {agent.skills.slice(0, 3).map((skill, index) => (
                <Badge key={index} variant="outline" className="bg-accent/50 dark:bg-accent">
                    <Tag className="h-3 w-3 mr-1" />
                    {skill}
                </Badge>
                ))}
                {agent.skills.length > 3 && (
                <Badge variant="outline" className="bg-accent/50 dark:bg-accent">
                    +{agent.skills.length - 3} more
                </Badge>
                )}
            </div>
            <div className="mt-6 flex items-center">
                {/* <Link href={agent.link} className="text-sm font-semibold leading-6 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300">
                Details <span aria-hidden="true">→</span>
                </Link> */}
                {agent.button}
            </div>
            </div>
        </div>
    </>
  );
}

export default AgentCard;