import { SourceValue, CustomValue, ResolutionStatus } from '../types/resolution';
interface AttributeRowProps {
    attribute: string;
    candidates: SourceValue[];
    selected?: SourceValue | CustomValue;
    status: ResolutionStatus;
    onSelect: (value: SourceValue | CustomValue) => void;
    suggestion?: SourceValue | CustomValue;
    onApplySuggestion?: () => void;
}
export declare function AttributeRow({ attribute, candidates, selected, status, onSelect, suggestion, onApplySuggestion }: AttributeRowProps): import("react/jsx-runtime").JSX.Element;
export {};
