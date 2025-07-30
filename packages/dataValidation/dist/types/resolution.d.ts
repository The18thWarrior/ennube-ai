export interface SourceValue {
    sourceId: string;
    value: unknown;
    display: string;
    confidence?: number;
    updatedAt?: string;
    meta?: Record<string, any>;
    validation?: {
        valid: boolean;
        message?: string;
    };
}
export interface CustomValue {
    value: unknown;
    display: string;
    origin: 'custom';
    valid: boolean;
}
export type ResolutionStatus = 'pending' | 'resolved' | 'conflict' | 'invalid' | 'outlier';
export interface AttributeResolution {
    attribute: string;
    type: 'string' | 'number' | 'email' | 'date' | 'enum';
    candidates: SourceValue[];
    selected?: SourceValue | CustomValue;
    status: ResolutionStatus;
    suggestion?: SourceValue | CustomValue;
    stats?: {
        mean?: number;
        stddev?: number;
        distributionHint?: string;
    };
}
