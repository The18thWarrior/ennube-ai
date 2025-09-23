
import styles from '../chat-container.module.css';

const MessageComponentWrapper = (Component: React.ReactElement, role:string, theme: 'dark' | 'light' | 'lavender') => (
    <span
        className={[
            styles.messageBubble,
            role === 'user' ? null : styles.botBubble
        ].join(' ')}
    >
        {Component}
    </span>
);

export default MessageComponentWrapper;