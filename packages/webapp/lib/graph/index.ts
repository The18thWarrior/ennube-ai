// === index.ts ===
// Created: 2025-09-17 12:00
// Purpose: Main exports for the graph database implementation
// Exports:
//   - GraphDatabase, GraphNode, GraphEdge classes
//   - DatabaseSchemaAnalyzer utility
//   - All type definitions and interfaces
// Interactions:
//   - Used by: application code, query generation tools
// Notes:
//   - Clean API surface for external consumers

// Core classes
export { GraphDatabase } from './graph-database';
export { GraphNode } from './graph-node';
export { GraphEdge } from './graph-edge';

// Query and analysis utilities
export { DatabaseSchemaAnalyzer } from './query-helpers';

// Type definitions
export type {
  // Core types
  GraphNodeData,
  GraphEdgeData,
  DatabaseSchemaMetadata,
  SerializableGraphData,
  GraphDatabaseConfig,
  
  // Query types
  QueryPath,
  RelationshipQuery,
  PathfindingOptions,
  GraphQueryResult,
} from './types';

export type {
  // Schema analysis types from query-helpers
  TableInfo,
  ColumnInfo,
  ForeignKeyInfo,
  IndexInfo,
  JoinSuggestion,
  RelationshipAnalysis,
  SchemaAnalysisOptions,
} from './query-helpers';

// Enums
export {
  NodeType,
  EdgeType,
  RelationType,
} from './types';

// Import for internal use
import { GraphDatabase } from './graph-database';
import { GraphNode } from './graph-node';
import { GraphEdge } from './graph-edge';
import { DatabaseSchemaAnalyzer } from './query-helpers';
import { NodeType, EdgeType, GraphDatabaseConfig } from './types';

/**
 * Factory function to create a new graph database instance
 * @param config - Optional configuration
 * @returns New GraphDatabase instance
 */
export function createGraphDatabase(config?: GraphDatabaseConfig): GraphDatabase {
  return new GraphDatabase(config);
}

/**
 * Factory function to create a schema analyzer
 * @param graph - Graph database instance
 * @returns New DatabaseSchemaAnalyzer instance
 */
export function createSchemaAnalyzer(graph: GraphDatabase): DatabaseSchemaAnalyzer {
  return new DatabaseSchemaAnalyzer(graph);
}

/**
 * Utility function to create table and column nodes from schema information
 * @param tableSchema - Table schema information
 * @returns Object with created nodes and edges
 */
export function createTableSchema(tableSchema: {
  tableName: string;
  schema?: string;
  columns: Array<{
    name: string;
    dataType: string;
    isNullable?: boolean;
    isPrimaryKey?: boolean;
    defaultValue?: string;
    maxLength?: number;
  }>;
  foreignKeys?: Array<{
    columnName: string;
    referencedTable: string;
    referencedColumn: string;
    constraintName?: string;
  }>;
}): {
  tableNode: GraphNode;
  columnNodes: GraphNode[];
  tableColumnEdges: GraphEdge[];
  primaryKeyEdges: GraphEdge[];
} {
  const tableId = `table_${tableSchema.schema ? `${tableSchema.schema}_` : ''}${tableSchema.tableName}`;
  
  // Create table node
  const tableNode = new GraphNode({
    id: tableId,
    type: NodeType.TABLE,
    name: tableSchema.tableName,
    schema: tableSchema.schema,
    metadata: {
      tableName: tableSchema.tableName,
      tableType: 'BASE TABLE',
    },
  });

  const columnNodes: GraphNode[] = [];
  const tableColumnEdges: GraphEdge[] = [];
  const primaryKeyEdges: GraphEdge[] = [];

  // Create column nodes and edges
  tableSchema.columns.forEach((columnInfo, index) => {
    const columnId = `${tableId}_col_${columnInfo.name}`;
    
    const columnNode = new GraphNode({
      id: columnId,
      type: NodeType.COLUMN,
      name: columnInfo.name,
      schema: tableSchema.schema,
      metadata: {
        columnName: columnInfo.name,
        dataType: columnInfo.dataType,
        isNullable: columnInfo.isNullable ?? true,
        defaultValue: columnInfo.defaultValue,
        maxLength: columnInfo.maxLength,
      },
    });

    columnNodes.push(columnNode);

    // Create table-column edge
    const tableColumnEdge = GraphEdge.createTableColumn(
      `${tableId}_tc_${columnInfo.name}`,
      tableId,
      columnId,
      { position: index }
    );
    tableColumnEdges.push(tableColumnEdge);

    // Create primary key edge if applicable
    if (columnInfo.isPrimaryKey) {
      const primaryKeyEdge = GraphEdge.createPrimaryKey(
        `${tableId}_pk_${columnInfo.name}`,
        tableId,
        columnId,
        { position: index }
      );
      primaryKeyEdges.push(primaryKeyEdge);
    }
  });

  return {
    tableNode,
    columnNodes,
    tableColumnEdges,
    primaryKeyEdges,
  };
}

/**
 * Utility function to load schema from a JSON file or object
 * @param schemaData - Schema data in JSON format
 * @returns New GraphDatabase instance with loaded schema
 */
export function loadSchemaFromJSON(schemaData: {
  tables: Array<{
    name: string;
    schema?: string;
    columns: Array<{
      name: string;
      dataType: string;
      isNullable?: boolean;
      isPrimaryKey?: boolean;
      defaultValue?: string;
      maxLength?: number;
    }>;
    foreignKeys?: Array<{
      columnName: string;
      referencedTable: string;
      referencedColumn: string;
      constraintName?: string;
    }>;
  }>;
}): GraphDatabase {
  const graph = createGraphDatabase();
  
  // First pass: create all tables and columns
  const createdNodes = new Map<string, GraphNode>();
  
  for (const tableSchema of schemaData.tables) {
    const { tableNode, columnNodes, tableColumnEdges, primaryKeyEdges } = createTableSchema({
      tableName: tableSchema.name,
      schema: tableSchema.schema,
      columns: tableSchema.columns,
      foreignKeys: tableSchema.foreignKeys,
    });
    
    // Add nodes to graph
    graph.addNode(tableNode);
    createdNodes.set(tableNode.getFullyQualifiedName(), tableNode);
    
    for (const columnNode of columnNodes) {
      graph.addNode(columnNode);
      createdNodes.set(`${tableNode.getFullyQualifiedName()}.${columnNode.name}`, columnNode);
    }
    
    // Add edges to graph
    for (const edge of [...tableColumnEdges, ...primaryKeyEdges]) {
      graph.addEdge(edge);
    }
  }
  
  // Second pass: create foreign key relationships
  for (const tableSchema of schemaData.tables) {
    if (!tableSchema.foreignKeys) continue;
    
    const tableNode = createdNodes.get(
      tableSchema.schema ? `${tableSchema.schema}.${tableSchema.name}` : tableSchema.name
    );
    if (!tableNode) continue;
    
    for (const fk of tableSchema.foreignKeys) {
      const sourceColumnKey = `${tableNode.getFullyQualifiedName()}.${fk.columnName}`;
      
      // Find referenced table with schema
      const referencedTableKey = tableSchema.schema ? `${tableSchema.schema}.${fk.referencedTable}` : fk.referencedTable;
      const targetColumnKey = `${referencedTableKey}.${fk.referencedColumn}`;
      
      const sourceColumn = createdNodes.get(sourceColumnKey);
      const targetColumn = createdNodes.get(targetColumnKey);
      
      if (sourceColumn && targetColumn) {
        const fkEdge = GraphEdge.createForeignKey(
          `fk_${sourceColumn.id}_${targetColumn.id}`,
          sourceColumn.id,
          targetColumn.id,
          {
            referencedTable: fk.referencedTable,
            referencedColumn: fk.referencedColumn,
            ...(fk.constraintName ? { constraintName: fk.constraintName } : {}),
          }
        );
        graph.addEdge(fkEdge);
      }
    }
  }
  
  return graph;
}

/**
 * OVERVIEW
 *
 * - Purpose: Clean API surface for the graph database implementation
 * - Assumptions: Consumers need simple factory functions and utility helpers
 * - Edge Cases: Handles schema loading, node creation, and relationship setup
 * - How it fits into the system: Main entry point for graph database usage
 * - Future Improvements: Schema validation, migration utilities, performance profiling
 */

/*
 * === index.ts ===
 * Updated: 2025-09-17 12:00
 * Summary: Main exports and factory functions for graph database library
 * Key Components:
 *   - Core class exports: GraphDatabase, GraphNode, GraphEdge, DatabaseSchemaAnalyzer
 *   - Factory functions: createGraphDatabase, createSchemaAnalyzer
 *   - Utility functions: createTableSchema, loadSchemaFromJSON
 * Dependencies:
 *   - Requires: All graph implementation files
 * Version History:
 *   v1.0 – initial API surface with comprehensive utilities
 * Notes:
 *   - Provides both low-level and high-level APIs
 *   - Schema loading utilities for rapid prototyping
 *   - Type-safe exports for TypeScript consumers
 */