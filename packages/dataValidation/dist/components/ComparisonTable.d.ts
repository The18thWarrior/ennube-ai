import { MatchedGroup } from '../types';
interface ComparisonTableProps<T> {
    group: MatchedGroup<T>;
    loading?: boolean;
    threshold?: number;
    onSubmit?: (resolvedRecord: T) => void;
    showSubmit?: boolean;
}
export declare function ComparisonTable<T extends Record<string, any>>({ group, loading, threshold, onSubmit, showSubmit }: ComparisonTableProps<T>): import("react/jsx-runtime").JSX.Element;
export {};
