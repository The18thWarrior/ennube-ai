interface ValueChipProps {
    label: string;
    meta: string;
    selected?: boolean;
    confidence?: number;
    status?: 'default' | 'conflict' | 'invalid' | 'outlier';
    onClick: () => void;
    className?: string;
}
export declare function ValueChip({ label, meta, selected, confidence, status, onClick, className }: ValueChipProps): import("react/jsx-runtime").JSX.Element;
export {};
