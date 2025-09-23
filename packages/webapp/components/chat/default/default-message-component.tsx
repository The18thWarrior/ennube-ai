import { UIMessage, UIMessagePart, UIDataTypes, UITools } from "ai";
import MessageComponentWrapper from "./message-component-wrapper";

const DefaultMessageComponent = (msg: UIMessage, theme: 'dark' | 'light' | 'lavender') => {
    const _msg = msg.parts ? msg.parts.at(msg.parts.length - 1) as UIMessagePart<UIDataTypes, UITools> : null;
    const value = _msg && _msg.type === 'text' ? _msg.text : '';
    const state = _msg && _msg.type === 'text' ? _msg.state : 'done';

    if (!value || value.trim() === '') {
        return MessageComponentWrapper( <span className="text-xs text-muted-foreground italic">No response</span>, msg.role, theme);
    }

    return MessageComponentWrapper( <span className={`${state === 'streaming' ? 'text-muted-foreground' : ''} ${msg.role === 'user' ? '' : 'p-2'}`}>{value}</span>, msg.role, theme);
};

export default DefaultMessageComponent;