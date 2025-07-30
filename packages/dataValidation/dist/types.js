// === types.ts ===
// Created: 2025-07-19
// Purpose: Shared types and interfaces for data-validation package.
/**
 * Anomaly status for a given property across sources.
 */
export var AnomalyStatus;
(function (AnomalyStatus) {
    AnomalyStatus["Same"] = "same";
    AnomalyStatus["Similar"] = "similar";
    AnomalyStatus["Different"] = "different";
})(AnomalyStatus || (AnomalyStatus = {}));
export var AnomalyColor;
(function (AnomalyColor) {
    AnomalyColor["same"] = "green";
    AnomalyColor["similar"] = "yellow";
    AnomalyColor["different"] = "red";
})(AnomalyColor || (AnomalyColor = {}));
/*
 * === types.ts ===
 * Updated: 2025-07-19
 * Summary: Types and interfaces for package
 * Key Components:
 *   - MatchedGroup: identifier grouping
 *   - AnomalyStatus: status enum
 *   - AnomalyResults: detection output
 * Version History:
 *   v1.0 – initial
 */
