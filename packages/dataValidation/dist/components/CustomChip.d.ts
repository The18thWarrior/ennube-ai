interface CustomChipProps {
    selected?: boolean;
    value?: string;
    onCreate: (value: string) => void;
    onCancel?: () => void;
    placeholder?: string;
    className?: string;
}
export declare function CustomChip({ selected, value, onCreate, onCancel, placeholder, className }: CustomChipProps): import("react/jsx-runtime").JSX.Element;
export {};
