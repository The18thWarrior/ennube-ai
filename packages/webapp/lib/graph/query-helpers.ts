// === query-helpers.ts ===
// Created: 2025-09-17 12:00
// Purpose: Query generation utilities for database schema graph operations
// Exports:
//   - export class DatabaseSchemaAnalyzer
//   - export interface JoinSuggestion, TableInfo, ColumnInfo
// Interactions:
//   - Used by: query generation tools, AI assistants
//   - Uses: graph-database.ts, types.ts
// Notes:
//   - Optimized for SQL query generation and schema discovery

import { GraphDatabase } from './graph-database';
import { GraphNode } from './graph-node';
import { GraphEdge } from './graph-edge';
import {
  NodeType,
  EdgeType,
  RelationType,
  PathfindingOptions,
  QueryPath,
  GraphQueryResult,
} from './types';

/**
 * Information about a database table
 */
export interface TableInfo {
  id: string;
  name: string;
  schema?: string;
  fullyQualifiedName: string;
  columns: ColumnInfo[];
  primaryKeys: ColumnInfo[];
  foreignKeys: ForeignKeyInfo[];
  indexes: IndexInfo[];
  rowCount?: number;
  tableType?: string;
  comment?: string;
}

/**
 * Information about a database column
 */
export interface ColumnInfo {
  id: string;
  name: string;
  tableName: string;
  dataType: string;
  maxLength?: number;
  precision?: number;
  scale?: number;
  isNullable: boolean;
  defaultValue?: string;
  isAutoIncrement?: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  comment?: string;
}

/**
 * Information about foreign key relationships
 */
export interface ForeignKeyInfo {
  id: string;
  columnName: string;
  referencedTable: string;
  referencedColumn: string;
  updateRule?: string;
  deleteRule?: string;
  constraintName?: string;
}

/**
 * Information about database indexes
 */
export interface IndexInfo {
  id: string;
  name: string;
  tableName: string;
  columns: { name: string; position: number; sortOrder?: 'ASC' | 'DESC' }[];
  isUnique: boolean;
  isPrimary: boolean;
  indexType?: string;
}

/**
 * Suggestion for joining tables in a query
 */
export interface JoinSuggestion {
  fromTable: string;
  toTable: string;
  joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
  condition: string;
  path: QueryPath;
  confidence: number;
  reason: string;
}

/**
 * Result of table relationship analysis
 */
export interface RelationshipAnalysis {
  directRelationships: {
    table: string;
    relationshipType: 'parent' | 'child' | 'sibling';
    foreignKeys: ForeignKeyInfo[];
  }[];
  suggestedJoins: JoinSuggestion[];
  relatedTables: string[];
  joinPaths: QueryPath[];
}

/**
 * Options for schema analysis
 */
export interface SchemaAnalysisOptions {
  includeViews?: boolean;
  maxJoinDepth?: number;
  preferredJoinTypes?: ('INNER' | 'LEFT' | 'RIGHT' | 'FULL')[];
  excludeTables?: string[];
  schemaFilter?: string[];
}

/**
 * Database schema analyzer for query generation
 * Provides high-level operations for schema discovery and query optimization
 */
export class DatabaseSchemaAnalyzer {
  constructor(private graph: GraphDatabase) {}

  /* ----------------------------- Table Operations ----------------------------- */

  /**
   * Get comprehensive information about a table
   * @param tableName - Name of the table (can include schema)
   * @param schema - Optional schema name if not in tableName
   * @returns Table information or null if not found
   */
  getTableInfo(tableName: string, schema?: string): TableInfo | null {
    const tableNodes = this.findTableNode(tableName, schema);
    if (tableNodes.length === 0) return null;

    const tableNode = tableNodes[0]; // Take first match
    const columns = this.getTableColumns(tableNode.id);
    const primaryKeys = columns.filter(col => col.isPrimaryKey);
    const foreignKeys = this.getTableForeignKeys(tableNode.id);
    const indexes = this.getTableIndexes(tableNode.id);
    const tableMetadata = tableNode.getTableMetadata();

    return {
      id: tableNode.id,
      name: tableNode.name,
      schema: tableNode.schema,
      fullyQualifiedName: tableNode.getFullyQualifiedName(),
      columns,
      primaryKeys,
      foreignKeys,
      indexes,
      rowCount: tableMetadata?.rowCount,
      tableType: tableMetadata?.tableType,
      comment: tableNode.metadata.comment as string,
    };
  }

  /**
   * Get all tables in the database
   * @param schema - Optional schema filter
   * @returns Array of table information
   */
  getAllTables(schema?: string): TableInfo[] {
    const tableNodes = this.graph.getNodesByType(NodeType.TABLE);
    
    return tableNodes
      .filter(node => !schema || node.schema === schema)
      .map(node => this.getTableInfo(node.name, node.schema))
      .filter(Boolean) as TableInfo[];
  }

  getAllTableNames(schema?: string): string[] {
    const tables = this.getAllTables(schema);
    return tables.map(table => table.name);
  }

  /**
   * Find tables by name pattern
   * @param namePattern - Pattern to match (supports wildcards)
   * @param schema - Optional schema filter
   * @returns Array of matching table information
   */
  findTables(namePattern: string, schema?: string): TableInfo[] {
    const matchingNodes = this.graph.getNodesByName(namePattern)
      .filter(node => 
        node.type === NodeType.TABLE && 
        (!schema || node.schema === schema)
      );

    return matchingNodes
      .map(node => this.getTableInfo(node.name, node.schema))
      .filter(Boolean) as TableInfo[];
  }

  /* ----------------------------- Column Operations ----------------------------- */

  /**
   * Get columns for a specific table
   * @param tableId - Table node ID
   * @returns Array of column information
   */
  getTableColumns(tableId: string): ColumnInfo[] {
    const tableNode = this.graph.getNode(tableId);
    if (!tableNode || !tableNode.isTable()) return [];

    const columns: ColumnInfo[] = [];
    const outgoingEdges = tableNode.getOutgoingEdges();

    for (const edgeId of outgoingEdges) {
      const edge = this.graph.getEdge(edgeId);
      if (!edge || edge.type !== EdgeType.TABLE_COLUMN) continue;

      const columnNode = this.graph.getNode(edge.targetId);
      if (!columnNode || !columnNode.isColumn()) continue;

      const columnMetadata = columnNode.getColumnMetadata();
      const isPrimaryKey = this.isColumnPrimaryKey(columnNode.id);
      const isForeignKey = this.isColumnForeignKey(columnNode.id);

      columns.push({
        id: columnNode.id,
        name: columnNode.name,
        tableName: tableNode.name,
        dataType: columnMetadata?.dataType || 'unknown',
        maxLength: columnMetadata?.maxLength,
        precision: columnNode.metadata.precision as number,
        scale: columnNode.metadata.scale as number,
        isNullable: columnMetadata?.isNullable ?? true,
        defaultValue: columnMetadata?.defaultValue,
        isAutoIncrement: columnNode.metadata.isAutoIncrement as boolean,
        isPrimaryKey,
        isForeignKey,
        comment: columnNode.metadata.comment as string,
      });
    }

    return columns.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Find columns by name pattern across all tables
   * @param namePattern - Pattern to match
   * @param tableFilter - Optional table name filter
   * @returns Array of matching column information
   */
  findColumns(namePattern: string, tableFilter?: string): ColumnInfo[] {
    const columnNodes = this.graph.getNodesByName(namePattern)
      .filter(node => node.type === NodeType.COLUMN);

    const results: ColumnInfo[] = [];

    for (const columnNode of columnNodes) {
      // Find the table this column belongs to
      const incomingEdges = columnNode.getIncomingEdges();
      for (const edgeId of incomingEdges) {
        const edge = this.graph.getEdge(edgeId);
        if (!edge || edge.type !== EdgeType.TABLE_COLUMN) continue;

        const tableNode = this.graph.getNode(edge.sourceId);
        if (!tableNode || !tableNode.isTable()) continue;

        if (tableFilter && tableNode.name !== tableFilter) continue;

        const columnMetadata = columnNode.getColumnMetadata();
        results.push({
          id: columnNode.id,
          name: columnNode.name,
          tableName: tableNode.name,
          dataType: columnMetadata?.dataType || 'unknown',
          maxLength: columnMetadata?.maxLength,
          precision: columnNode.metadata.precision as number,
          scale: columnNode.metadata.scale as number,
          isNullable: columnMetadata?.isNullable ?? true,
          defaultValue: columnMetadata?.defaultValue,
          isAutoIncrement: columnNode.metadata.isAutoIncrement as boolean,
          isPrimaryKey: this.isColumnPrimaryKey(columnNode.id),
          isForeignKey: this.isColumnForeignKey(columnNode.id),
          comment: columnNode.metadata.comment as string,
        });
      }
    }

    return results;
  }

  /* ----------------------------- Relationship Analysis ----------------------------- */

  /**
   * Analyze relationships for a specific table
   * @param tableName - Name of the table
   * @param schema - Optional schema name
   * @param options - Analysis options
   * @returns Relationship analysis results
   */
  analyzeTableRelationships(
    tableName: string,
    schema?: string,
    options: SchemaAnalysisOptions = {}
  ): RelationshipAnalysis {
    const tableNodes = this.findTableNode(tableName, schema);
    if (tableNodes.length === 0) {
      return {
        directRelationships: [],
        suggestedJoins: [],
        relatedTables: [],
        joinPaths: [],
      };
    }

    const tableNode = tableNodes[0];
    const maxDepth = options.maxJoinDepth || 3;

    // Get related tables through foreign key relationships
    const relatedResult = this.graph.queryRelationships({
      sourceNodeId: tableNode.id,
      relationDirection: RelationType.BIDIRECTIONAL,
      maxDepth,
      edgeTypes: [EdgeType.FOREIGN_KEY, EdgeType.TABLE_COLUMN], // Include table-column edges for traversal
    });

    if (!relatedResult.success) {
      return {
        directRelationships: [],
        suggestedJoins: [],
        relatedTables: [],
        joinPaths: [],
      };
    }

    const relatedTables = relatedResult.data!.nodes
      .filter(node => node.type === NodeType.TABLE && node.id !== tableNode.id)
      .map(node => node.getFullyQualifiedName());

    // Analyze direct relationships
    const directRelationships = this.analyzeDirectRelationships(tableNode.id);

    // Generate join suggestions
    const suggestedJoins = this.generateJoinSuggestions(
      tableNode,
      relatedResult.data!.nodes.filter(n => n.type === NodeType.TABLE),
      options
    );

    return {
      directRelationships,
      suggestedJoins,
      relatedTables,
      joinPaths: relatedResult.data!.paths,
    };
  }

  /**
   * Find the best join path between two tables
   * @param fromTable - Source table name
   * @param toTable - Target table name
   * @param schema - Optional schema name
   * @returns Join suggestion or null if no path found
   */
  findJoinPath(
    fromTable: string,
    toTable: string,
    schema?: string
  ): JoinSuggestion | null {
    const fromNodes = this.findTableNode(fromTable, schema);
    const toNodes = this.findTableNode(toTable, schema);

    if (fromNodes.length === 0 || toNodes.length === 0) return null;

    const pathResult = this.graph.findPath(
      fromNodes[0].id,
      toNodes[0].id,
      {
        maxDepth: 4,
        edgeTypes: [EdgeType.FOREIGN_KEY, EdgeType.TABLE_COLUMN], // Include table-column edges
        allowedNodeTypes: [NodeType.TABLE, NodeType.COLUMN],
      }
    );

    if (!pathResult.success || !pathResult.data) return null;

    return this.createJoinSuggestionFromPath(pathResult.data, fromNodes[0], toNodes[0]);
  }

  /**
   * Get all possible join paths between multiple tables
   * @param tableNames - Array of table names to connect
   * @param schema - Optional schema name
   * @returns Array of join suggestions to connect all tables
   */
  findMultiTableJoinPaths(
    tableNames: string[],
    schema?: string
  ): JoinSuggestion[] {
    if (tableNames.length < 2) return [];

    const suggestions: JoinSuggestion[] = [];
    const connectedTables = new Set<string>();
    connectedTables.add(tableNames[0]);

    // Use a greedy approach to connect tables
    for (let i = 1; i < tableNames.length; i++) {
      const targetTable = tableNames[i];
      let bestSuggestion: JoinSuggestion | null = null;
      let shortestPath = Infinity;

      // Find shortest path from any connected table to the target
      Array.from(connectedTables).forEach(connectedTable => {
        const suggestion = this.findJoinPath(connectedTable, targetTable, schema);
        if (suggestion && suggestion.path.totalWeight < shortestPath) {
          bestSuggestion = suggestion;
          shortestPath = suggestion.path.totalWeight;
        }
      });

      if (bestSuggestion) {
        suggestions.push(bestSuggestion);
        connectedTables.add(targetTable);
      }
    }

    return suggestions;
  }

  /* ----------------------------- Schema Discovery ----------------------------- */

  /**
   * Get all schemas in the database
   * @returns Array of schema names
   */
  getAllSchemas(): string[] {
    const schemas = new Set<string>();
    const allNodes = this.graph.getNodesByType(NodeType.TABLE);
    
    for (const node of allNodes) {
      if (node.schema) {
        schemas.add(node.schema);
      }
    }

    return Array.from(schemas).sort();
  }

  /**
   * Get schema statistics
   * @param schema - Schema name
   * @returns Statistics about the schema
   */
  getSchemaStatistics(schema: string): {
    tableCount: number;
    columnCount: number;
    indexCount: number;
    constraintCount: number;
    totalRows?: number;
  } {
    const schemaNodes = this.graph.getNodesBySchema(schema);
    
    const stats = {
      tableCount: 0,
      columnCount: 0,
      indexCount: 0,
      constraintCount: 0,
      totalRows: undefined as number | undefined,
    };

    let hasRowCounts = false;

    for (const node of schemaNodes) {
      switch (node.type) {
        case NodeType.TABLE:
          stats.tableCount++;
          const tableMetadata = node.getTableMetadata();
          if (tableMetadata?.rowCount) {
            stats.totalRows = (stats.totalRows || 0) + tableMetadata.rowCount;
            hasRowCounts = true;
          }
          break;
        case NodeType.COLUMN:
          stats.columnCount++;
          break;
        case NodeType.INDEX:
          stats.indexCount++;
          break;
        case NodeType.CONSTRAINT:
          stats.constraintCount++;
          break;
      }
    }

    return {
      tableCount: stats.tableCount,
      columnCount: stats.columnCount,
      indexCount: stats.indexCount,
      constraintCount: stats.constraintCount,
      ...(hasRowCounts && stats.totalRows !== undefined ? { totalRows: stats.totalRows } : {}),
    };
  }

  /* ----------------------------- Private Helper Methods ----------------------------- */

  private findTableNode(tableName: string, schema?: string): GraphNode[] {
    // First try exact match
    const exactMatches = this.graph.getNodesByName(tableName)
      .filter(node => 
        node.type === NodeType.TABLE && 
        (!schema || node.schema === schema)
      );

    if (exactMatches.length > 0) return exactMatches;

    // Try case-insensitive match
    return this.graph.getNodesByName(`*${tableName.toLowerCase()}*`)
      .filter(node => 
        node.type === NodeType.TABLE && 
        node.name.toLowerCase() === tableName.toLowerCase() &&
        (!schema || node.schema === schema)
      );
  }

  private isColumnPrimaryKey(columnId: string): boolean {
    const columnNode = this.graph.getNode(columnId);
    if (!columnNode) return false;

    const incomingEdges = columnNode.getIncomingEdges();
    return incomingEdges.some(edgeId => {
      const edge = this.graph.getEdge(edgeId);
      return edge?.type === EdgeType.PRIMARY_KEY;
    });
  }

  private isColumnForeignKey(columnId: string): boolean {
    const columnNode = this.graph.getNode(columnId);
    if (!columnNode) return false;

    const outgoingEdges = columnNode.getOutgoingEdges();
    return outgoingEdges.some(edgeId => {
      const edge = this.graph.getEdge(edgeId);
      return edge?.type === EdgeType.FOREIGN_KEY;
    });
  }

  private getTableForeignKeys(tableId: string): ForeignKeyInfo[] {
    const foreignKeys: ForeignKeyInfo[] = [];
    const tableNode = this.graph.getNode(tableId);
    if (!tableNode) return foreignKeys;

    // Get all columns of the table
    const columns = this.getTableColumns(tableId);
    
    for (const column of columns) {
      const columnNode = this.graph.getNode(column.id);
      if (!columnNode) continue;

      // Check outgoing edges for foreign key relationships
      const outgoingEdges = columnNode.getOutgoingEdges();
      for (const edgeId of outgoingEdges) {
        const edge = this.graph.getEdge(edgeId);
        if (!edge || edge.type !== EdgeType.FOREIGN_KEY) continue;

        const fkMetadata = edge.getForeignKeyMetadata();
        if (fkMetadata) {
          foreignKeys.push({
            id: edge.id,
            columnName: column.name,
            referencedTable: fkMetadata.referencedTable || '',
            referencedColumn: fkMetadata.referencedColumn || '',
            updateRule: fkMetadata.updateRule,
            deleteRule: fkMetadata.deleteRule,
            constraintName: edge.metadata.constraintName as string,
          });
        }
      }
    }

    return foreignKeys;
  }

  private getTableIndexes(tableId: string): IndexInfo[] {
    const indexes: IndexInfo[] = [];
    const tableNode = this.graph.getNode(tableId);
    if (!tableNode) return indexes;

    // This is a simplified implementation
    // In a real scenario, you'd traverse index nodes connected to the table
    return indexes;
  }

  private analyzeDirectRelationships(tableId: string): RelationshipAnalysis['directRelationships'] {
    const relationships: RelationshipAnalysis['directRelationships'] = [];
    const foreignKeys = this.getTableForeignKeys(tableId);

    // Group foreign keys by referenced table
    const relationshipMap = new Map<string, ForeignKeyInfo[]>();
    for (const fk of foreignKeys) {
      const existing = relationshipMap.get(fk.referencedTable) || [];
      existing.push(fk);
      relationshipMap.set(fk.referencedTable, existing);
    }

    relationshipMap.forEach((fks, table) => {
      relationships.push({
        table,
        relationshipType: 'parent', // This table references the other (parent-child relationship)
        foreignKeys: fks,
      });
    });

    return relationships;
  }

  private generateJoinSuggestions(
    sourceTable: GraphNode,
    relatedTables: GraphNode[],
    options: SchemaAnalysisOptions
  ): JoinSuggestion[] {
    const suggestions: JoinSuggestion[] = [];
    const maxDepth = options.maxJoinDepth || 2;

    for (const targetTable of relatedTables) {
      if (targetTable.id === sourceTable.id) continue;

      const pathResult = this.graph.findPath(sourceTable.id, targetTable.id, {
        maxDepth,
        edgeTypes: [EdgeType.FOREIGN_KEY],
        allowedNodeTypes: [NodeType.TABLE, NodeType.COLUMN],
      });

      if (pathResult.success && pathResult.data) {
        const suggestion = this.createJoinSuggestionFromPath(
          pathResult.data,
          sourceTable,
          targetTable
        );
        if (suggestion) {
          suggestions.push(suggestion);
        }
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  private createJoinSuggestionFromPath(
    path: QueryPath,
    fromTable: GraphNode,
    toTable: GraphNode
  ): JoinSuggestion | null {
    if (path.edges.length === 0) return null;

    // Simplified join condition generation
    const firstEdge = this.graph.getEdge(path.edges[0]);
    if (!firstEdge || firstEdge.type !== EdgeType.FOREIGN_KEY) return null;

    const fkMetadata = firstEdge.getForeignKeyMetadata();
    if (!fkMetadata) return null;

    const condition = `${fromTable.getFullyQualifiedName()}.${fkMetadata.referencedColumn} = ${toTable.getFullyQualifiedName()}.${fkMetadata.referencedColumn}`;
    
    // Determine join type based on relationship
    const joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL' = 'INNER'; // Simplified

    // Calculate confidence based on path length and relationship strength
    const confidence = Math.max(0.1, 1.0 - (path.totalWeight - 1) * 0.2);

    return {
      fromTable: fromTable.getFullyQualifiedName(),
      toTable: toTable.getFullyQualifiedName(),
      joinType,
      condition,
      path,
      confidence,
      reason: `Foreign key relationship via ${fkMetadata.referencedColumn}`,
    };
  }
}

/**
 * OVERVIEW
 *
 * - Purpose: High-level query generation utilities for database schema analysis and JOIN discovery
 * - Assumptions: Graph contains well-structured database schema with proper relationship modeling
 * - Edge Cases: Handles missing relationships, complex multi-table joins, schema variations
 * - How it fits into the system: Provides semantic layer for AI-powered query generation tools
 * - Future Improvements: Advanced join optimization, cost-based suggestions, query pattern learning
 */

/*
 * === query-helpers.ts ===
 * Updated: 2025-09-17 12:00
 * Summary: Database schema analyzer with query generation utilities and JOIN path discovery
 * Key Components:
 *   - DatabaseSchemaAnalyzer: Main class for schema analysis and query assistance
 *   - Table/Column operations: Information retrieval for schema elements
 *   - Relationship analysis: Foreign key discovery and JOIN path suggestions
 *   - Multi-table joins: Optimal path finding for complex queries
 * Dependencies:
 *   - Requires: graph-database.ts, graph-node.ts, graph-edge.ts, types.ts
 * Version History:
 *   v1.0 – initial implementation with comprehensive schema analysis
 * Notes:
 *   - Optimized for SQL query generation use cases
 *   - Supports multiple database engines through flexible metadata
 *   - Confidence scoring for AI-assisted query building
 */