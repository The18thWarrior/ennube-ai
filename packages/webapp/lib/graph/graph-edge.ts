// === graph-edge.ts ===
// Created: 2025-09-17 12:00
// Purpose: Graph edge implementation for database schema relationships
// Exports:
//   - export class GraphEdge
// Interactions:
//   - Used by: graph-database.ts, query-helpers.ts
//   - Uses: types.ts
// Notes:
//   - Lightweight edge representation optimized for relationship queries

import { GraphEdgeData, EdgeType } from './types';

/**
 * Represents an edge (relationship) in the database schema graph
 * Optimized for memory efficiency and fast traversal
 */
export class GraphEdge {
  private _data: GraphEdgeData;

  constructor(data: Omit<GraphEdgeData, 'createdAt' | 'updatedAt'>) {
    const now = Date.now();
    this._data = {
      ...data,
      weight: data.weight || 1.0,
      createdAt: now,
      updatedAt: now,
    };
  }

  /* ----------------------------- Getters ----------------------------- */

  get id(): string {
    return this._data.id;
  }

  get type(): EdgeType {
    return this._data.type;
  }

  get sourceId(): string {
    return this._data.sourceId;
  }

  get targetId(): string {
    return this._data.targetId;
  }

  get metadata(): Record<string, unknown> {
    return { ...this._data.metadata };
  }

  get weight(): number {
    return this._data.weight || 1.0;
  }

  get createdAt(): number {
    return this._data.createdAt;
  }

  get updatedAt(): number {
    return this._data.updatedAt;
  }

  get data(): GraphEdgeData {
    return { ...this._data };
  }

  /* ----------------------------- Edge Properties ----------------------------- */

  /**
   * Check if this edge connects the specified nodes
   * @param sourceId - Source node ID
   * @param targetId - Target node ID
   */
  connects(sourceId: string, targetId: string): boolean {
    return this._data.sourceId === sourceId && this._data.targetId === targetId;
  }

  /**
   * Check if this edge is connected to a specific node
   * @param nodeId - Node ID to check
   */
  isConnectedTo(nodeId: string): boolean {
    return this._data.sourceId === nodeId || this._data.targetId === nodeId;
  }

  /**
   * Get the other node ID connected by this edge
   * @param nodeId - Known node ID
   * @returns The other node ID, or null if the provided ID is not connected
   */
  getOtherNodeId(nodeId: string): string | null {
    if (this._data.sourceId === nodeId) {
      return this._data.targetId;
    }
    if (this._data.targetId === nodeId) {
      return this._data.sourceId;
    }
    return null;
  }

  /**
   * Check if this edge is directional
   */
  isDirectional(): boolean {
    return [
      EdgeType.FOREIGN_KEY,
      EdgeType.VIEW_DEPENDENCY,
      EdgeType.INHERITANCE,
      EdgeType.REFERENCE
    ].includes(this._data.type);
  }

  /**
   * Check if this edge represents a primary key relationship
   */
  isPrimaryKey(): boolean {
    return this._data.type === EdgeType.PRIMARY_KEY;
  }

  /**
   * Check if this edge represents a foreign key relationship
   */
  isForeignKey(): boolean {
    return this._data.type === EdgeType.FOREIGN_KEY;
  }

  /**
   * Check if this edge represents a table-column relationship
   */
  isTableColumn(): boolean {
    return this._data.type === EdgeType.TABLE_COLUMN;
  }

  /* ----------------------------- Data Management ----------------------------- */

  /**
   * Update edge metadata
   * @param metadata - New metadata to merge with existing
   */
  updateMetadata(metadata: Record<string, unknown>): void {
    this._data.metadata = {
      ...this._data.metadata,
      ...metadata,
    };
    this._data.updatedAt = Date.now();
  }

  /**
   * Update edge weight
   * @param weight - New weight value
   */
  updateWeight(weight: number): void {
    this._data.weight = weight;
    this._data.updatedAt = Date.now();
  }

  /* ----------------------------- Utility Methods ----------------------------- */

  /**
   * Get a human-readable description of this edge
   */
  getDescription(): string {
    return `${this._data.type}: ${this._data.sourceId} -> ${this._data.targetId}`;
  }

  /**
   * Convert edge to JSON for serialization
   */
  toJSON(): GraphEdgeData {
    return {
      ...this._data,
      metadata: { ...this._data.metadata },
    };
  }

  /**
   * Create an edge from JSON data
   */
  static fromJSON(data: GraphEdgeData): GraphEdge {
    const edge = new GraphEdge({
      id: data.id,
      type: data.type,
      sourceId: data.sourceId,
      targetId: data.targetId,
      metadata: data.metadata,
      weight: data.weight,
    });
    
    // Restore timestamps
    edge._data.createdAt = data.createdAt;
    edge._data.updatedAt = data.updatedAt;
    
    return edge;
  }

  /**
   * Clone this edge with new node IDs
   */
  clone(newId: string, newSourceId?: string, newTargetId?: string): GraphEdge {
    return new GraphEdge({
      id: newId,
      type: this._data.type,
      sourceId: newSourceId || this._data.sourceId,
      targetId: newTargetId || this._data.targetId,
      metadata: { ...this._data.metadata },
      weight: this._data.weight,
    });
  }

  /**
   * Calculate memory footprint of this edge (approximate)
   */
  getMemoryFootprint(): number {
    const jsonStr = JSON.stringify(this._data);
    return jsonStr.length * 2; // UTF-16 encoding
  }

  /* ----------------------------- Schema-Specific Methods ----------------------------- */

  /**
   * Get foreign key metadata (if this is a foreign key edge)
   */
  getForeignKeyMetadata(): {
    referencedTable?: string;
    referencedColumn?: string;
    updateRule?: string;
    deleteRule?: string;
  } | null {
    if (!this.isForeignKey()) return null;
    const meta = this._data.metadata;
    return {
      referencedTable: meta.referencedTable as string,
      referencedColumn: meta.referencedColumn as string,
      updateRule: meta.updateRule as string,
      deleteRule: meta.deleteRule as string,
    };
  }

  /**
   * Get index column metadata (if this is an index-column edge)
   */
  getIndexColumnMetadata(): {
    position?: number;
    sortOrder?: 'ASC' | 'DESC';
    keyLength?: number;
  } | null {
    if (this._data.type !== EdgeType.INDEX_COLUMN) return null;
    const meta = this._data.metadata;
    return {
      position: meta.position as number,
      sortOrder: meta.sortOrder as 'ASC' | 'DESC',
      keyLength: meta.keyLength as number,
    };
  }

  /**
   * Get constraint metadata (if this is a constraint edge)
   */
  getConstraintMetadata(): {
    constraintName?: string;
    constraintType?: string;
    expression?: string;
  } | null {
    if (this._data.type !== EdgeType.CONSTRAINT_COLUMN) return null;
    const meta = this._data.metadata;
    return {
      constraintName: meta.constraintName as string,
      constraintType: meta.constraintType as string,
      expression: meta.expression as string,
    };
  }

  /* ----------------------------- Static Factory Methods ----------------------------- */

  /**
   * Create a foreign key edge
   */
  static createForeignKey(
    id: string,
    sourceColumnId: string,
    targetColumnId: string,
    metadata: {
      referencedTable: string;
      referencedColumn: string;
      updateRule?: string;
      deleteRule?: string;
    }
  ): GraphEdge {
    return new GraphEdge({
      id,
      type: EdgeType.FOREIGN_KEY,
      sourceId: sourceColumnId,
      targetId: targetColumnId,
      metadata,
      weight: 1.0,
    });
  }

  /**
   * Create a table-column edge
   */
  static createTableColumn(
    id: string,
    tableId: string,
    columnId: string,
    metadata: Record<string, unknown> = {}
  ): GraphEdge {
    return new GraphEdge({
      id,
      type: EdgeType.TABLE_COLUMN,
      sourceId: tableId,
      targetId: columnId,
      metadata,
      weight: 1.0,
    });
  }

  /**
   * Create a primary key edge
   */
  static createPrimaryKey(
    id: string,
    tableId: string,
    columnId: string,
    metadata: { position?: number } = {}
  ): GraphEdge {
    return new GraphEdge({
      id,
      type: EdgeType.PRIMARY_KEY,
      sourceId: tableId,
      targetId: columnId,
      metadata,
      weight: 0.5, // Lower weight for primary keys (stronger relationship)
    });
  }

  /**
   * Create an index-column edge
   */
  static createIndexColumn(
    id: string,
    indexId: string,
    columnId: string,
    metadata: {
      position: number;
      sortOrder?: 'ASC' | 'DESC';
      keyLength?: number;
    }
  ): GraphEdge {
    return new GraphEdge({
      id,
      type: EdgeType.INDEX_COLUMN,
      sourceId: indexId,
      targetId: columnId,
      metadata,
      weight: 1.0,
    });
  }
}

/**
 * OVERVIEW
 *
 * - Purpose: Efficient graph edge representation for database schema relationships
 * - Assumptions: Edges are frequently traversed for pathfinding and relationship queries
 * - Edge Cases: Handles directional/bidirectional relationships, complex metadata, weight calculations
 * - How it fits into the system: Connects nodes to form the relationship graph for query generation
 * - Future Improvements: Edge grouping for multi-column constraints, temporal relationships, edge compression
 */

/*
 * === graph-edge.ts ===
 * Updated: 2025-09-17 12:00
 * Summary: Memory-efficient graph edge implementation with schema-aware factory methods
 * Key Components:
 *   - GraphEdge: Main class with relationship management and metadata handling
 *   - Factory methods: Static constructors for common database relationship types
 *   - Schema methods: Type-specific metadata accessors for FK, PK, and index relationships
 * Dependencies:
 *   - Requires: types.ts
 * Version History:
 *   v1.0 – initial implementation with relationship-specific methods
 * Notes:
 *   - Lightweight design for fast traversal
 *   - Supports both directional and bidirectional relationships
 *   - Weight-based pathfinding support
 */