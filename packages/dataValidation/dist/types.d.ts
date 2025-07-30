/**
 * A matched group of records from multiple sources identified by a common ID.
 */
export interface MatchedGroup<T> {
    id: string;
    records: Record<string, T>;
}
/**
 * Anomaly status for a given property across sources.
 */
export declare enum AnomalyStatus {
    Same = "same",
    Similar = "similar",
    Different = "different"
}
export declare enum AnomalyColor {
    same = "green",
    similar = "yellow",
    different = "red"
}
/**
 * Results of anomaly detection for each property.
 */
export type AnomalyResults<T> = Record<keyof T, {
    status: AnomalyStatus;
    values: (T[keyof T] | undefined)[];
    color?: AnomalyColor;
}>;
