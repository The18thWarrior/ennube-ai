
import styles from '../chat-container.module.css';

const MessageComponentWrapper = (Component: React.ReactElement, role:string, theme: 'dark' | 'light' | 'system') => (
    <span
        className={[
            styles.messageBubble,
            role === 'user' ? null : styles.botBubble,
            theme === 'dark' ? styles.darkBubble : styles.lightBubble,
        ].join(' ')}
    >
        {Component}
    </span>
);

export default MessageComponentWrapper;