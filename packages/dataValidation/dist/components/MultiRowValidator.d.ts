interface MultiRowValidatorProps<T> {
    sources: T[][];
    idKey: keyof T;
    threshold?: number;
    loading?: boolean;
    /** Callback function for when user submits a resolved record */
    onSubmit?: (resolvedRecord: T) => void;
    /** Number of records to show per page */
    pageSize?: number;
}
/**
 * MULTI ROW VALIDATOR
 * Renders comparison tables for all matched record groups with pagination.
 */
export declare function MultiRowValidator<T extends Record<string, any>>({ sources, idKey, threshold, loading, onSubmit, pageSize }: MultiRowValidatorProps<T>): import("react/jsx-runtime").JSX.Element;
export {};
