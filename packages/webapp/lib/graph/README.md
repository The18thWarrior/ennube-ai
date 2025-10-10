# Graph Database for Database Schema Management

A memory-efficient graph database implementation specifically designed for storing and querying database schema information, table relationships, and generating intelligent SQL JOIN suggestions.

## Overview

This graph database provides a powerful foundation for AI-powered query generation tools by modeling database schemas as interconnected graphs. It supports efficient relationship queries, pathfinding between tables, and schema analysis for intelligent JOIN suggestions.

## Features

- **Memory-Efficient Storage**: Optimized data structures with indexing for fast lookups
- **Schema-Aware Design**: Purpose-built for database table, column, and constraint modeling
- **Intelligent Pathfinding**: Dijkstra-based algorithms for optimal JOIN path discovery
- **Query Generation Support**: High-level utilities for AI-assisted SQL generation
- **Serialization**: JSON import/export for persistence and data exchange
- **Performance Optimized**: Caching, indexing, and memory footprint tracking
- **Type-Safe**: Full TypeScript implementation with comprehensive type definitions

## Quick Start

### Installation

```typescript
import {
  createGraphDatabase,
  createSchemaAnalyzer,
  loadSchemaFromJSON,
  NodeType,
  EdgeType,
} from '@/lib/graph';
```

### Basic Usage

```typescript
// Create a new graph database
const graph = createGraphDatabase({
  maxNodes: 10000,
  maxEdges: 50000,
  enableIndexing: true,
  enablePathCaching: true,
});

// Create a schema analyzer
const analyzer = createSchemaAnalyzer(graph);

// Load schema from JSON
const graph = loadSchemaFromJSON({
  tables: [
    {
      name: 'customers',
      schema: 'public',
      columns: [
        { name: 'id', dataType: 'INTEGER', isPrimaryKey: true },
        { name: 'name', dataType: 'VARCHAR', maxLength: 100 },
        { name: 'email', dataType: 'VARCHAR', maxLength: 255 },
      ],
    },
    {
      name: 'orders',
      schema: 'public',
      columns: [
        { name: 'id', dataType: 'INTEGER', isPrimaryKey: true },
        { name: 'customer_id', dataType: 'INTEGER' },
        { name: 'order_date', dataType: 'DATE' },
        { name: 'total', dataType: 'DECIMAL' },
      ],
      foreignKeys: [
        {
          columnName: 'customer_id',
          referencedTable: 'customers',
          referencedColumn: 'id',
          constraintName: 'fk_orders_customer',
        },
      ],
    },
  ],
});
```

## Core Concepts

### Nodes

Nodes represent database schema elements:

- **Tables**: Database tables and views
- **Columns**: Table columns with data type information
- **Indexes**: Database indexes and their column associations
- **Constraints**: Primary keys, foreign keys, check constraints
- **Views**: Database views and their dependencies

### Edges

Edges represent relationships between schema elements:

- **Foreign Keys**: Relationships between tables via foreign key constraints
- **Table-Column**: Ownership relationships between tables and their columns
- **Primary Keys**: Primary key designations for columns
- **Index-Column**: Index composition and column ordering
- **References**: General reference relationships

## API Reference

### GraphDatabase

Main graph database class for storing and querying schema elements.

```typescript
// Create database
const graph = new GraphDatabase({
  maxNodes: 10000,
  maxEdges: 50000,
  enableIndexing: true,
  enablePathCaching: true,
});

// Add nodes and edges
const tableNode = new GraphNode({
  id: 'table_users',
  type: NodeType.TABLE,
  name: 'users',
  schema: 'public',
  metadata: {
    tableName: 'users',
    tableType: 'BASE TABLE',
    rowCount: 1000,
  },
});

graph.addNode(tableNode);

// Query operations
const tables = graph.getNodesByType(NodeType.TABLE);
const publicTables = graph.getNodesBySchema('public');
const userTables = graph.getNodesByName('user*');

// Relationship queries
const relationshipResult = graph.queryRelationships({
  sourceNodeId: 'table_users',
  relationDirection: RelationType.BIDIRECTIONAL,
  maxDepth: 3,
  edgeTypes: [EdgeType.FOREIGN_KEY],
});

// Pathfinding
const pathResult = graph.findPath('table_users', 'table_orders', {
  maxDepth: 4,
  edgeTypes: [EdgeType.FOREIGN_KEY, EdgeType.TABLE_COLUMN],
});
```

### DatabaseSchemaAnalyzer

High-level utilities for schema analysis and query generation assistance.

```typescript
const analyzer = new DatabaseSchemaAnalyzer(graph);

// Table operations
const tableInfo = analyzer.getTableInfo('users', 'public');
console.log(tableInfo.columns); // Array of column information
console.log(tableInfo.primaryKeys); // Primary key columns
console.log(tableInfo.foreignKeys); // Foreign key relationships

// Find related tables and JOIN suggestions
const analysis = analyzer.analyzeTableRelationships('orders', 'public');
console.log(analysis.suggestedJoins); // Intelligent JOIN suggestions
console.log(analysis.relatedTables); // Related table names

// Find optimal JOIN path
const joinSuggestion = analyzer.findJoinPath('customers', 'order_items', 'public');
console.log(joinSuggestion.condition); // Generated JOIN condition
console.log(joinSuggestion.confidence); // Confidence score (0-1)

// Multi-table JOINs
const multiJoins = analyzer.findMultiTableJoinPaths(
  ['customers', 'orders', 'order_items', 'products'],
  'public'
);
```

## Advanced Usage

### Custom Node Creation

```typescript
import { GraphNode, NodeType } from '@/lib/graph';

// Create a table node
const tableNode = new GraphNode({
  id: 'table_products',
  type: NodeType.TABLE,
  name: 'products',
  schema: 'inventory',
  metadata: {
    tableName: 'products',
    tableType: 'BASE TABLE',
    engine: 'InnoDB',
    rowCount: 50000,
    comment: 'Product catalog table',
  },
});

// Create column nodes
const idColumn = new GraphNode({
  id: 'products_col_id',
  type: NodeType.COLUMN,
  name: 'id',
  metadata: {
    columnName: 'id',
    dataType: 'INTEGER',
    isNullable: false,
    isAutoIncrement: true,
    isPrimaryKey: true,
  },
});

const nameColumn = new GraphNode({
  id: 'products_col_name',
  type: NodeType.COLUMN,
  name: 'name',
  metadata: {
    columnName: 'name',
    dataType: 'VARCHAR',
    maxLength: 255,
    isNullable: false,
    defaultValue: null,
  },
});
```

### Custom Edge Creation

```typescript
import { GraphEdge, EdgeType } from '@/lib/graph';

// Create foreign key relationship
const foreignKeyEdge = GraphEdge.createForeignKey(
  'fk_order_customer',
  'orders_col_customer_id',
  'customers_col_id',
  {
    referencedTable: 'customers',
    referencedColumn: 'id',
    updateRule: 'CASCADE',
    deleteRule: 'RESTRICT',
    constraintName: 'fk_orders_customer_id',
  }
);

// Create table-column relationship
const tableColumnEdge = GraphEdge.createTableColumn(
  'products_tc_name',
  'table_products',
  'products_col_name',
  { position: 1 }
);

// Create primary key designation
const primaryKeyEdge = GraphEdge.createPrimaryKey(
  'products_pk_id',
  'table_products',
  'products_col_id',
  { position: 0 }
);
```

### Performance Monitoring

```typescript
// Get detailed statistics
const stats = graph.getStatistics();
console.log('Nodes:', stats.nodeCount);
console.log('Edges:', stats.edgeCount);
console.log('Memory footprint:', stats.memoryFootprint, 'bytes');
console.log('Cache hit rate:', stats.cacheStats.hitRate);

// Node distribution by type
console.log('Tables:', stats.nodesByType[NodeType.TABLE]);
console.log('Columns:', stats.nodesByType[NodeType.COLUMN]);

// Edge distribution by type
console.log('Foreign keys:', stats.edgesByType[EdgeType.FOREIGN_KEY]);
console.log('Table-column edges:', stats.edgesByType[EdgeType.TABLE_COLUMN]);
```

### Serialization and Persistence

```typescript
// Export graph to JSON
const jsonData = graph.toJSON();
console.log('Exported', jsonData.metadata.nodeCount, 'nodes');

// Save to file or database
const serializedGraph = JSON.stringify(jsonData);

// Import from JSON
const importResult = GraphDatabase.fromJSON(jsonData, {
  enableIndexing: true,
  enablePathCaching: true,
});

if (importResult.success) {
  const restoredGraph = importResult.data;
  console.log('Imported graph with', restoredGraph.getStatistics().nodeCount, 'nodes');
}

// Clone graph
const clonedGraph = graph.clone();

// Merge graphs
const mergeResult = graph.merge(otherGraph, 'rename'); // Handle conflicts by renaming
console.log('Merged', mergeResult.data.nodesAdded, 'new nodes');
```

## Integration with Query Generation

### AI-Powered JOIN Suggestions

```typescript
// Analyze a table for AI query generation
function analyzeForQueryGeneration(tableName: string, schema: string) {
  const analyzer = createSchemaAnalyzer(graph);
  
  // Get comprehensive table information
  const tableInfo = analyzer.getTableInfo(tableName, schema);
  if (!tableInfo) return null;

  // Analyze relationships for JOIN opportunities
  const relationships = analyzer.analyzeTableRelationships(tableName, schema, {
    maxJoinDepth: 3,
    includeViews: false,
  });

  // Prepare context for AI model
  return {
    table: {
      name: tableInfo.fullyQualifiedName,
      columns: tableInfo.columns.map(col => ({
        name: col.name,
        type: col.dataType,
        nullable: col.isNullable,
        primaryKey: col.isPrimaryKey,
        foreignKey: col.isForeignKey,
      })),
    },
    relationships: {
      directParents: relationships.directRelationships
        .filter(rel => rel.relationshipType === 'parent')
        .map(rel => rel.table),
      suggestedJoins: relationships.suggestedJoins
        .slice(0, 5) // Top 5 suggestions
        .map(join => ({
          table: join.toTable,
          condition: join.condition,
          type: join.joinType,
          confidence: join.confidence,
          reason: join.reason,
        })),
    },
    relatedTables: relationships.relatedTables.slice(0, 10), // Limit for context size
  };
}

// Usage in AI query generation
const queryContext = analyzeForQueryGeneration('orders', 'public');
// Pass queryContext to AI model for intelligent SQL generation
```

### Schema Discovery for New Databases

```typescript
// Load database schema from information_schema or DESCRIBE queries
async function loadDatabaseSchema(connectionInfo: any) {
  const graph = createGraphDatabase();
  
  // Fetch table information (example with PostgreSQL)
  const tables = await fetchTables(connectionInfo);
  const columns = await fetchColumns(connectionInfo);
  const foreignKeys = await fetchForeignKeys(connectionInfo);
  
  // Transform to graph format
  const schemaData = transformToGraphSchema(tables, columns, foreignKeys);
  
  // Load into graph
  return loadSchemaFromJSON(schemaData);
}

// Use for query generation
const graph = await loadDatabaseSchema(dbConnection);
const analyzer = createSchemaAnalyzer(graph);

// Now ready for intelligent query assistance
const joinSuggestions = analyzer.findMultiTableJoinPaths([
  'customers', 'orders', 'order_items', 'products'
]);
```

## Performance Characteristics

### Memory Usage

- **Nodes**: ~100-200 bytes per node (depending on metadata size)
- **Edges**: ~50-100 bytes per edge
- **Indexes**: Minimal overhead with hash-based lookups
- **Caching**: LRU cache for frequently accessed paths

### Query Performance

- **Node lookup by ID**: O(1)
- **Node lookup by type**: O(1) with indexing enabled
- **Node lookup by name**: O(1) for exact match, O(n) for pattern matching
- **Pathfinding**: O(V + E log V) using Dijkstra's algorithm
- **Relationship queries**: O(E) for breadth-first traversal

### Recommended Limits

- **Small schema**: < 100 tables, < 1,000 columns
- **Medium schema**: < 1,000 tables, < 10,000 columns  
- **Large schema**: < 10,000 tables, < 100,000 columns

## Testing

Run the comprehensive test suite:

```bash
npm test -- packages/webapp/tests/graph/
```

The test suite covers:

- Node and edge CRUD operations
- Relationship queries and pathfinding
- Performance with large datasets
- Memory efficiency tracking
- Serialization and data integrity
- Error handling and edge cases
- Schema analysis functionality

## Contributing

When contributing to the graph database implementation:

1. **Follow TypeScript best practices** with strict type checking
2. **Add comprehensive tests** for new functionality
3. **Update documentation** and examples
4. **Consider memory efficiency** in design decisions
5. **Maintain backward compatibility** in API changes

## License

This implementation is part of the ennube-ai project and follows the project's licensing terms.

---

## Architecture Notes

### Design Principles

1. **Memory Efficiency**: Uses adjacency lists instead of matrices, lazy loading of metadata
2. **Query Performance**: Comprehensive indexing by type, schema, and name
3. **Extensibility**: Plugin architecture for custom node/edge types
4. **Type Safety**: Full TypeScript coverage with strict null checks
5. **Testability**: Modular design with dependency injection

### Future Enhancements

- **Persistent Storage**: Integration with Redis, PostgreSQL, or specialized graph databases
- **Distributed Queries**: Support for federated schema across multiple databases
- **Real-time Updates**: Live schema synchronization and change detection
- **Advanced Analytics**: Graph metrics, centrality analysis, schema health scoring
- **Query Optimization**: Cost-based JOIN ordering and index suggestions

---

*For more detailed API documentation, see the TypeScript interface definitions in the source code.*