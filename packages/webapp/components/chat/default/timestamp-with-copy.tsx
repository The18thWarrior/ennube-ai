import { UIDataTypes, UIMessage, UIMessagePart, UITools } from "ai";
import { Copy, ThumbsUp, ThumbsDown } from "lucide-react";
import { useSnackbar } from "notistack";
import { Action } from "@/components/ai-elements/actions";
import { useState, useEffect } from "react";

// Timestamp display with copy-to-clipboard and reward buttons
const TimestampWithCopy = ({
    msg,
    userSub,
    agent
}: {
    msg: UIMessage;
    userSub?: string;
    agent?: string;
}) => {
    const { enqueueSnackbar } = useSnackbar();
    const [caseId, setCaseId] = useState<string | null>(null);
    const [currentReward, setCurrentReward] = useState<number | null>(null);

    // Fetch the most recent memory case for this user/agent (only for assistant messages)
    useEffect(() => {
        if (msg.role === 'assistant' && userSub && agent && false) {
            fetchRecentCase();
        }
    }, []);

    const fetchRecentCase = async () => {
        try {
            const response = await fetch(`/api/memory?userSub=${encodeURIComponent(userSub!)}&agent=${encodeURIComponent(agent!)}`);
            if (response.ok) {
                const data = await response.json();
                if (data.caseId) {
                    setCaseId(data.caseId);
                    setCurrentReward(data.rewardScore);
                }
            }
        } catch (error) {
            console.warn('Failed to fetch recent memory case:', error);
        }
    };

    const handleCopy = async () => {
        try {
            if (!msg.parts) {
                enqueueSnackbar('Nothing to copy', { variant: 'warning', preventDuplicate: true, autoHideDuration: 3000 });
                return;
            }
            const _msg = msg.parts.at(-1) as UIMessagePart<UIDataTypes, UITools>;
            const value = _msg.type === 'text' ? _msg.text : '';
            await navigator.clipboard.writeText(value);
            enqueueSnackbar('Message copied to clipboard', { variant: 'success', preventDuplicate: true, autoHideDuration: 3000 });
        } catch (err) {
            console.error('Copy failed', err);
            enqueueSnackbar('Failed to copy message', { variant: 'error', preventDuplicate: true, autoHideDuration: 3000 });
        }
    };

    const handleReward = async (rewardScore: number) => {
        if (!caseId) {
            enqueueSnackbar('No memory case found for this message', { variant: 'warning', preventDuplicate: true, autoHideDuration: 3000 });
            return;
        }

        try {
            const response = await fetch('/api/memory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ caseId, rewardScore }),
            });

            if (response.ok) {
                setCurrentReward(rewardScore);
                enqueueSnackbar(`Feedback recorded (${rewardScore === 1 ? 'positive' : 'negative'})`, {
                    variant: 'success',
                    preventDuplicate: true,
                    autoHideDuration: 3000
                });
            } else {
                throw new Error('Failed to update reward');
            }
        } catch (error) {
            console.error('Reward update failed:', error);
            enqueueSnackbar('Failed to record feedback', { variant: 'error', preventDuplicate: true, autoHideDuration: 3000 });
        }
    };

    const isAssistant = msg.role === 'assistant';

    return (
        <div className={`align-middle flex flex-row items-center ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2 mt-1 mx-2`}>
            {/* <span className="text-xs text-muted-foreground px-2">
                {msg.createdAt && formatDistanceToNow(msg.createdAt, { addSuffix: true })}
                TODO : Fill date
            </span> */}
            <Action
                tooltip="Copy message"
                label="Copy message"
                onClick={handleCopy}
            >
                <Copy className="h-4 w-4" />
            </Action>

            {isAssistant && caseId && (
                <>
                    <Action
                        tooltip="Good response"
                        label="Thumbs up"
                        onClick={() => handleReward(1)}
                        className={currentReward === 1 ? "text-green-600" : ""}
                    >
                        <ThumbsUp className="h-4 w-4" />
                    </Action>

                    <Action
                        tooltip="Poor response"
                        label="Thumbs down"
                        onClick={() => handleReward(0)}
                        className={currentReward === 0 ? "text-red-600" : ""}
                    >
                        <ThumbsDown className="h-4 w-4" />
                    </Action>
                </>
            )}
        </div>
    );
}
export default TimestampWithCopy;