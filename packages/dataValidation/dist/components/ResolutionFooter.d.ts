interface ResolutionFooterProps {
    conflictsRemaining: number;
    canUndo?: boolean;
    canRedo?: boolean;
    onUndo?: () => void;
    onRedo?: () => void;
    onReset?: () => void;
    onSave?: () => void;
    isValidForSave?: boolean;
    className?: string;
}
export declare function ResolutionFooter({ conflictsRemaining, canUndo, canRedo, onUndo, onRedo, onReset, onSave, isValidForSave, className }: ResolutionFooterProps): import("react/jsx-runtime").JSX.Element;
export {};
