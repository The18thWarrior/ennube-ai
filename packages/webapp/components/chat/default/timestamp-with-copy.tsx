import { UIDataTypes, UIMessage, UIMessagePart, UITools } from "ai";
import { Copy } from "lucide-react";
import { useSnackbar } from "notistack";

// Timestamp display with copy-to-clipboard button
const TimestampWithCopy = ({ msg } : { msg: UIMessage }) => {
    const { enqueueSnackbar } = useSnackbar();
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

    return (
        <div className={`align-middle flex flex-row items-center ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2 mt-1 mx-2`}>
            {/* <span className="text-xs text-muted-foreground px-2">
                {msg.createdAt && formatDistanceToNow(msg.createdAt, { addSuffix: true })}
                TODO : Fill date
            </span> */}
            <button
                type="button"
                aria-label="Copy message"
                title="Copy message"
                onClick={handleCopy}
                className=" inline-flex items-center justify-center p-1 text-muted-foreground hover:bg-muted rounded"
            >
                <Copy className="h-4 w-4" />
            </button>
        </div>
    );
}
export default TimestampWithCopy;