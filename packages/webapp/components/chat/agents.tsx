import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui";

export const avatarOptions = [
        {
            key: 'data-steward',
            label: 'Data Steward',
            avatar: (
                <Avatar>
                    <AvatarImage src="/data-steward.png" alt="Data Steward Avatar" />
                    <AvatarFallback>DS</AvatarFallback>
                </Avatar>
            ),
        },
        {
            key: 'prospect-finder',
            label: 'Prospect Finder',
            avatar: (
                <Avatar>
                    <AvatarImage src="/prospect-finder.png" alt="Prospect Finder Avatar" />
                    <AvatarFallback>PF</AvatarFallback>
                </Avatar>
            ),
        },
        // {
        //     key: 'market-nurturer',
        //     label: 'Market Nurturer',
        //     avatar: (
        //         <Avatar>
        //             <AvatarImage src="/market-nurturer.png" alt="Market Nurturer Avatar" />
        //             <AvatarFallback>MN</AvatarFallback>
        //         </Avatar>
        //     ),
        // },
];

export const AgentSelector = ({ selectedAvatar, setSelectedAvatar }: { selectedAvatar: string; setSelectedAvatar: (avatar: string) => void }) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <button type="button" className="flex items-center gap-2 px-2 py-1 border rounded hover:bg-accent">
                {avatarOptions.find(a => a.key === selectedAvatar)?.avatar}
                <span className="text-xs text-muted-foreground">{avatarOptions.find(a => a.key === selectedAvatar)?.label}</span>
            </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
            {avatarOptions.map(option => (
                <DropdownMenuItem
                    key={option.key}
                    onSelect={() => setSelectedAvatar(option.key)}
                    className="flex items-center gap-2"
                >
                    {option.avatar}
                    <span>{option.label}</span>
                </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
    </DropdownMenu>
);