'use client'
import { PlusCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

interface IntegrationCardProps {
  title: string;
  description: string;
  url: string;
  icon?: string;
  connected?: boolean;
  isAddCard?: boolean;
}

export default function IntegrationCard({ title, description, url, icon, connected, isAddCard }: IntegrationCardProps) {
  const router = useRouter();
    const handleClick = () => {
        if (isAddCard) {
            router.push("/integrations/add");
        } else {
            router.push(url);
        }
    }
    return (
        <Card className={isAddCard ? "border-dashed border-2 bg-gray-50 dark:bg-gray-800" : ""}>
        <CardHeader className="flex flex-row items-center gap-4">
            {isAddCard ? (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <PlusCircle className="h-6 w-6 text-gray-400" />
            </div>
            ) : (
            <div className="flex h-12 w-12 items-center justify-center">
                <img src={icon || "/placeholder.svg"} alt={title} className="h-10 w-10 object-contain" />
            </div>
            )}
            <div>
            <CardTitle>{title}</CardTitle>
            </div>
        </CardHeader>
        <CardContent>
            <CardDescription>{description}</CardDescription>
        </CardContent>
        <CardFooter>
            {isAddCard ? (
            <Button className="w-full" disabled>Coming Soon</Button>
            ) : (
            <Button onClick={handleClick} variant={connected ? "outline" : "default"} className="w-full">
                {connected ? "Manage Connection" : "Connect"}
            </Button>
            )}
        </CardFooter>
        </Card>
    )
}