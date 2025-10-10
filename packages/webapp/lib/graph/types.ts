// === types.ts ===
// Created: 2025-09-17 12:00
// Purpose: Core type definitions for memory-efficient graph database implementation
// Exports:
//   - NodeType, EdgeType, RelationType enums
//   - GraphNodeData, GraphEdgeData, DatabaseSchemaMetadata interfaces
//   - QueryPath, RelationshipQuery types
// Interactions:
//   - Used by: graph-node.ts, graph-edge.ts, graph-database.ts
// Notes:
//   - Designed for database schema representation and query generation

/**
 * Types of nodes in the database schema graph
 */
export enum NodeType {
  TABLE = 'table',
  COLUMN = 'column',
  INDEX = 'index',
  CONSTRAINT = 'constraint',
  VIEW = 'view',
  TRIGGER = 'trigger',
  PROCEDURE = 'procedure',
  FUNCTION = 'function'
}

/**
 * Types of edges representing relationships between schema elements
 */
export enum EdgeType {
  FOREIGN_KEY = 'foreign_key',
  PRIMARY_KEY = 'primary_key',
  INDEX_COLUMN = 'index_column',
  TABLE_COLUMN = 'table_column',
  VIEW_DEPENDENCY = 'view_dependency',
  CONSTRAINT_COLUMN = 'constraint_column',
  INHERITANCE = 'inheritance',
  REFERENCE = 'reference'
}

/**
 * Relationship direction and type for queries
 */
export enum RelationType {
  INCOMING = 'incoming',
  OUTGOING = 'outgoing',
  BIDIRECTIONAL = 'bidirectional'
}

/**
 * Core data structure for graph nodes
 */
export interface GraphNodeData {
  id: string;
  type: NodeType;
  name: string;
  schema?: string;
  metadata: DatabaseSchemaMetadata;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

/**
 * Core data structure for graph edges
 */
export interface GraphEdgeData {
  id: string;
  type: EdgeType;
  sourceId: string;
  targetId: string;
  metadata: Record<string, unknown>;
  weight?: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * Database-specific metadata for different node types
 */
export interface DatabaseSchemaMetadata {
  // Table metadata
  tableName?: string;
  tableType?: 'BASE TABLE' | 'VIEW' | 'TEMPORARY' | 'SYSTEM';
  engine?: string;
  collation?: string;
  comment?: string;
  rowCount?: number;
  
  // Column metadata
  columnName?: string;
  dataType?: string;
  maxLength?: number;
  precision?: number;
  scale?: number;
  isNullable?: boolean;
  defaultValue?: string;
  isAutoIncrement?: boolean;
  collationName?: string;
  
  // Index metadata
  indexName?: string;
  indexType?: 'BTREE' | 'HASH' | 'FULLTEXT' | 'SPATIAL';
  isUnique?: boolean;
  isPrimary?: boolean;
  columns?: string[];
  
  // Constraint metadata
  constraintName?: string;
  constraintType?: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK' | 'NOT NULL';
  referencedTable?: string;
  referencedColumns?: string[];
  updateRule?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  deleteRule?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  checkExpression?: string;
  
  // View metadata
  viewDefinition?: string;
  isUpdatable?: boolean;
  checkOption?: 'NONE' | 'LOCAL' | 'CASCADED';
  
  // Custom metadata
  [key: string]: unknown;
}

/**
 * Path between nodes in the graph with relationship information
 */
export interface QueryPath {
  nodes: string[];
  edges: string[];
  totalWeight: number;
  relationshipTypes: EdgeType[];
  metadata: Record<string, unknown>;
}

/**
 * Query options for finding relationships and paths
 */
export interface RelationshipQuery {
  sourceNodeId?: string;
  targetNodeId?: string;
  nodeTypes?: NodeType[];
  edgeTypes?: EdgeType[];
  relationDirection?: RelationType;
  maxDepth?: number;
  includeMetadata?: boolean;
  filters?: Record<string, unknown>;
}

/**
 * Options for pathfinding between nodes
 */
export interface PathfindingOptions {
  maxDepth?: number;
  edgeTypes?: EdgeType[];
  allowedNodeTypes?: NodeType[];
  weightFunction?: (edge: GraphEdgeData) => number;
  includeMetadata?: boolean;
}

/**
 * Result of a graph query operation
 */
export interface GraphQueryResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    executionTime: number;
    nodesVisited: number;
    edgesTraversed: number;
  };
}

/**
 * Serializable graph data for persistence
 */
export interface SerializableGraphData {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  metadata: {
    version: string;
    createdAt: number;
    updatedAt: number;
    nodeCount: number;
    edgeCount: number;
  };
}

/**
 * Configuration options for the graph database
 */
export interface GraphDatabaseConfig {
  maxNodes?: number;
  maxEdges?: number;
  enableIndexing?: boolean;
  enablePathCaching?: boolean;
  defaultWeightFunction?: (edge: GraphEdgeData) => number;
  memoryOptimized?: boolean;
}

/**
 * OVERVIEW
 *
 * - Purpose: Comprehensive type system for database schema graph representation
 * - Assumptions: Graph will primarily store relational database schema information
 * - Edge Cases: Handles various database engines, complex relationships, large schemas
 * - How it fits into the system: Foundation for all graph operations and query generation
 * - Future Improvements: Support for NoSQL schemas, graph analytics metrics, distributed graphs
 */

/*
 * === types.ts ===
 * Updated: 2025-09-17 12:00
 * Summary: Type definitions for graph database schema representation
 * Key Components:
 *   - NodeType/EdgeType: Enums for schema element classification
 *   - GraphNodeData/GraphEdgeData: Core data structures
 *   - DatabaseSchemaMetadata: Comprehensive metadata interface
 *   - QueryPath/RelationshipQuery: Query and pathfinding types
 * Dependencies:
 *   - Requires: None (pure type definitions)
 * Version History:
 *   v1.0 – initial type system design
 * Notes:
 *   - Designed for memory efficiency and extensibility
 *   - Supports multiple database engines and schema types
 */