import { useState, useEffect, useRef } from "react";

/**
 * A component that displays text with a streaming, character-by-character effect.
 * It renders the text inline, allowing it to inherit styles from its parent container.
 *
 * Props:
 * - text: full text to stream
 * - speed: delay in ms between each character (default 50)
 */
const StreamingText = ({ text, speed = 50 }: { text: string; speed?: number; }) => {
    const [displayedText, setDisplayedText] = useState('');
    // Show the cursor while streaming; hide when complete.
    const [showCursor, setShowCursor] = useState(false);
    // Keep track of the running timeout so we can clean it up.
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        // Reset displayed text whenever source text changes.
        setDisplayedText('');

        // If no text, make sure cursor is hidden and nothing else runs.
        if (!text) {
            setShowCursor(false);
            return;
        }

        let index = 0;
        let cancelled = false;

        // Show cursor while streaming
        setShowCursor(true);

        const tick = () => {
            // Defensive: ensure we don't append undefined.
            if (index >= text.length || cancelled) {
                // Completed streaming: hide cursor
                setShowCursor(false);
                return;
            }

            const char = text.charAt(index);
            // Append only when char is defined (charAt returns '' for OOB).
            if (char !== '') {
                setDisplayedText((prev) => (prev ?? '') + char);
            }

            index += 1;

            if (index < text.length && !cancelled) {
                // Schedule next char
                timeoutRef.current = window.setTimeout(tick, speed);
            } else if (!cancelled) {
                // Reached the end: ensure cursor hidden
                setShowCursor(false);
            }
        };

        // Start streaming after a single tick delay so cursor can show immediately.
        timeoutRef.current = window.setTimeout(tick, speed);

        return () => {
            // Cleanup: cancel pending timeout and mark cancelled so no further state updates.
            cancelled = true;
            setShowCursor(false);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [text, speed]);

    return (
        <>
            {displayedText ?? ''}
            {/* Blinking cursor effect - visible only while streaming */}
            {showCursor ? <span className="animate-pulse">|</span> : null}
        </>
    );
};

export default StreamingText;
