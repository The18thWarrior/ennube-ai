import { MatchedGroup } from '../types';
interface ModernComparisonTableProps<T> {
    group: MatchedGroup<T>;
    loading?: boolean;
    threshold?: number;
    onSubmit?: (resolvedRecord: T) => void;
    showSubmit?: boolean;
}
export declare function ModernComparisonTable<T extends Record<string, any>>({ group, loading, threshold, onSubmit, showSubmit }: ModernComparisonTableProps<T>): import("react/jsx-runtime").JSX.Element;
export {};
