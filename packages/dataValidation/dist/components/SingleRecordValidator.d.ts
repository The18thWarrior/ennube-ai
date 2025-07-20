interface SingleRecordValidatorProps<T> {
    /** Array of datasets; each dataset contains records of type T */
    sources: T[][];
    /** Key used to identify and match records */
    idKey: keyof T;
    /** Similarity threshold for flagging similar values */
    threshold?: number;
    /** Loading state indicator */
    loading?: boolean;
    /** Callback function for when user submits a resolved record */
    onSubmit?: (resolvedRecord: T) => void;
}
/**
 * SINGLE RECORD VALIDATOR
 * Renders the comparison for the first matched record group.
 */
export declare function SingleRecordValidator<T extends Record<string, any>>({ sources, idKey, threshold, loading, onSubmit }: SingleRecordValidatorProps<T>): import("react/jsx-runtime").JSX.Element;
export {};
