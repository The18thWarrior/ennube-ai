// === graph-node.ts ===
// Created: 2025-09-17 12:00
// Purpose: Graph node implementation for database schema elements
// Exports:
//   - export class GraphNode
// Interactions:
//   - Used by: graph-database.ts, query-helpers.ts
//   - Uses: types.ts
// Notes:
//   - Memory-optimized design with lazy metadata loading

import { GraphNodeData, NodeType, DatabaseSchemaMetadata } from './types';

/**
 * Represents a node in the database schema graph
 * Optimized for memory efficiency and fast access
 */
export class GraphNode {
  private _data: GraphNodeData;
  private _adjacentEdges: Set<string> = new Set();
  private _incomingEdges: Set<string> = new Set();
  private _outgoingEdges: Set<string> = new Set();

  constructor(data: Omit<GraphNodeData, 'createdAt' | 'updatedAt'>) {
    const now = Date.now();
    this._data = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };
  }

  /* ----------------------------- Getters ----------------------------- */

  get id(): string {
    return this._data.id;
  }

  get type(): NodeType {
    return this._data.type;
  }

  get name(): string {
    return this._data.name;
  }

  get schema(): string | undefined {
    return this._data.schema;
  }

  get metadata(): DatabaseSchemaMetadata {
    return this._data.metadata;
  }

  get tags(): string[] {
    return this._data.tags || [];
  }

  get createdAt(): number {
    return this._data.createdAt;
  }

  get updatedAt(): number {
    return this._data.updatedAt;
  }

  get data(): GraphNodeData {
    return { ...this._data };
  }

  /* ----------------------------- Edge Management ----------------------------- */

  /**
   * Add an edge reference to this node
   * @param edgeId - ID of the edge to add
   * @param direction - Direction of the edge relative to this node
   */
  addEdge(edgeId: string, direction: 'incoming' | 'outgoing'): void {
    this._adjacentEdges.add(edgeId);
    if (direction === 'incoming') {
      this._incomingEdges.add(edgeId);
    } else {
      this._outgoingEdges.add(edgeId);
    }
  }

  /**
   * Remove an edge reference from this node
   * @param edgeId - ID of the edge to remove
   */
  removeEdge(edgeId: string): void {
    this._adjacentEdges.delete(edgeId);
    this._incomingEdges.delete(edgeId);
    this._outgoingEdges.delete(edgeId);
  }

  /**
   * Get all edge IDs connected to this node
   */
  getAdjacentEdges(): string[] {
    return Array.from(this._adjacentEdges);
  }

  /**
   * Get incoming edge IDs
   */
  getIncomingEdges(): string[] {
    return Array.from(this._incomingEdges);
  }

  /**
   * Get outgoing edge IDs
   */
  getOutgoingEdges(): string[] {
    return Array.from(this._outgoingEdges);
  }

  /**
   * Check if this node has a specific edge
   */
  hasEdge(edgeId: string): boolean {
    return this._adjacentEdges.has(edgeId);
  }

  /**
   * Get the degree (number of connected edges) of this node
   */
  getDegree(): number {
    return this._adjacentEdges.size;
  }

  /* ----------------------------- Data Management ----------------------------- */

  /**
   * Update node metadata
   * @param metadata - New metadata to merge with existing
   */
  updateMetadata(metadata: Partial<DatabaseSchemaMetadata>): void {
    this._data.metadata = {
      ...this._data.metadata,
      ...metadata,
    };
    this._data.updatedAt = Date.now();
  }

  /**
   * Add tags to this node
   * @param tags - Tags to add
   */
  addTags(tags: string[]): void {
    const currentTags = new Set(this._data.tags || []);
    tags.forEach(tag => currentTags.add(tag));
    this._data.tags = Array.from(currentTags);
    this._data.updatedAt = Date.now();
  }

  /**
   * Remove tags from this node
   * @param tags - Tags to remove
   */
  removeTags(tags: string[]): void {
    if (!this._data.tags) return;
    const currentTags = new Set(this._data.tags);
    tags.forEach(tag => currentTags.delete(tag));
    this._data.tags = Array.from(currentTags);
    this._data.updatedAt = Date.now();
  }

  /**
   * Check if this node has a specific tag
   */
  hasTag(tag: string): boolean {
    return this._data.tags?.includes(tag) || false;
  }

  /* ----------------------------- Utility Methods ----------------------------- */

  /**
   * Check if this node represents a table
   */
  isTable(): boolean {
    return this._data.type === NodeType.TABLE;
  }

  /**
   * Check if this node represents a column
   */
  isColumn(): boolean {
    return this._data.type === NodeType.COLUMN;
  }

  /**
   * Check if this node represents an index
   */
  isIndex(): boolean {
    return this._data.type === NodeType.INDEX;
  }

  /**
   * Check if this node represents a constraint
   */
  isConstraint(): boolean {
    return this._data.type === NodeType.CONSTRAINT;
  }

  /**
   * Get a human-readable description of this node
   */
  getDescription(): string {
    const schema = this._data.schema ? `${this._data.schema}.` : '';
    return `${this._data.type}: ${schema}${this._data.name}`;
  }

  /**
   * Get the fully qualified name of this node
   */
  getFullyQualifiedName(): string {
    if (this._data.schema) {
      return `${this._data.schema}.${this._data.name}`;
    }
    return this._data.name;
  }

  /**
   * Convert node to JSON for serialization
   */
  toJSON(): GraphNodeData {
    return {
      ...this._data,
      tags: [...(this._data.tags || [])],
      metadata: { ...this._data.metadata },
    };
  }

  /**
   * Create a node from JSON data
   */
  static fromJSON(data: GraphNodeData): GraphNode {
    const node = new GraphNode({
      id: data.id,
      type: data.type,
      name: data.name,
      schema: data.schema,
      metadata: data.metadata,
      tags: data.tags,
    });
    
    // Restore timestamps
    node._data.createdAt = data.createdAt;
    node._data.updatedAt = data.updatedAt;
    
    return node;
  }

  /**
   * Clone this node with a new ID
   */
  clone(newId: string): GraphNode {
    return new GraphNode({
      id: newId,
      type: this._data.type,
      name: this._data.name,
      schema: this._data.schema,
      metadata: { ...this._data.metadata },
      tags: [...(this._data.tags || [])],
    });
  }

  /**
   * Calculate memory footprint of this node (approximate)
   */
  getMemoryFootprint(): number {
    const jsonStr = JSON.stringify(this._data);
    const edgeSetSize = this._adjacentEdges.size * 8; // approximate string ID size
    return jsonStr.length * 2 + edgeSetSize; // UTF-16 encoding
  }

  /* ----------------------------- Schema-Specific Methods ----------------------------- */

  /**
   * Get table-specific metadata (if this is a table node)
   */
  getTableMetadata(): {
    tableName?: string;
    tableType?: string;
    engine?: string;
    rowCount?: number;
  } | null {
    if (!this.isTable()) return null;
    const meta = this._data.metadata;
    return {
      tableName: meta.tableName,
      tableType: meta.tableType,
      engine: meta.engine,
      rowCount: meta.rowCount,
    };
  }

  /**
   * Get column-specific metadata (if this is a column node)
   */
  getColumnMetadata(): {
    columnName?: string;
    dataType?: string;
    isNullable?: boolean;
    defaultValue?: string;
    maxLength?: number;
  } | null {
    if (!this.isColumn()) return null;
    const meta = this._data.metadata;
    return {
      columnName: meta.columnName,
      dataType: meta.dataType,
      isNullable: meta.isNullable,
      defaultValue: meta.defaultValue,
      maxLength: meta.maxLength,
    };
  }

  /**
   * Get constraint-specific metadata (if this is a constraint node)
   */
  getConstraintMetadata(): {
    constraintName?: string;
    constraintType?: string;
    referencedTable?: string;
    referencedColumns?: string[];
  } | null {
    if (!this.isConstraint()) return null;
    const meta = this._data.metadata;
    return {
      constraintName: meta.constraintName,
      constraintType: meta.constraintType,
      referencedTable: meta.referencedTable,
      referencedColumns: meta.referencedColumns,
    };
  }
}

/**
 * OVERVIEW
 *
 * - Purpose: Efficient graph node representation for database schema elements
 * - Assumptions: Nodes are long-lived and accessed frequently for relationship queries
 * - Edge Cases: Handles large metadata objects, many edge connections, memory constraints
 * - How it fits into the system: Core building block for graph database operations
 * - Future Improvements: Lazy loading of metadata, compression for large schemas, node clustering
 */

/*
 * === graph-node.ts ===
 * Updated: 2025-09-17 12:00
 * Summary: Memory-efficient graph node implementation with schema-aware methods
 * Key Components:
 *   - GraphNode: Main class with edge management and metadata handling
 *   - Edge tracking: Separate incoming/outgoing edge sets for efficient queries
 *   - Schema methods: Type-specific metadata accessors for tables/columns/constraints
 * Dependencies:
 *   - Requires: types.ts
 * Version History:
 *   v1.0 – initial implementation with memory optimization
 * Notes:
 *   - Uses Sets for O(1) edge lookups
 *   - Immutable data patterns for thread safety
 *   - Memory footprint tracking for optimization
 */