// === graph-database.ts ===
// Created: 2025-09-17 12:00
// Purpose: Main graph database implementation for database schema storage and querying
// Exports:
//   - export class GraphDatabase
// Interactions:
//   - Used by: query-helpers.ts, application code
//   - Uses: graph-node.ts, graph-edge.ts, types.ts
// Notes:
//   - Memory-optimized with indexed lookups and path caching

import { GraphNode } from './graph-node';
import { GraphEdge } from './graph-edge';
import {
  GraphDatabaseConfig,
  GraphQueryResult,
  RelationshipQuery,
  PathfindingOptions,
  QueryPath,
  NodeType,
  EdgeType,
  RelationType,
  SerializableGraphData,
} from './types';

/**
 * Memory-efficient graph database for database schema representation
 * Optimized for relationship queries and pathfinding operations
 */
export class GraphDatabase {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Map<string, GraphEdge> = new Map();
  private config: GraphDatabaseConfig;
  
  // Indexes for fast lookups
  private nodesByType: Map<NodeType, Set<string>> = new Map();
  private nodesBySchema: Map<string, Set<string>> = new Map();
  private nodesByName: Map<string, Set<string>> = new Map();
  private edgesByType: Map<EdgeType, Set<string>> = new Map();
  private edgesBySource: Map<string, Set<string>> = new Map();
  private edgesByTarget: Map<string, Set<string>> = new Map();
  
  // Path caching for performance
  private pathCache: Map<string, QueryPath[]> = new Map();
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor(config: GraphDatabaseConfig = {}) {
    this.config = {
      maxNodes: 10000,
      maxEdges: 50000,
      enableIndexing: true,
      enablePathCaching: true,
      memoryOptimized: true,
      ...config,
    };

    // Initialize type indexes
    Object.values(NodeType).forEach(type => {
      this.nodesByType.set(type, new Set());
    });
    Object.values(EdgeType).forEach(type => {
      this.edgesByType.set(type, new Set());
    });
  }

  /* ----------------------------- Node Operations ----------------------------- */

  /**
   * Add a node to the graph
   * @param node - GraphNode instance to add
   * @returns Success/error result
   */
  addNode(node: GraphNode): GraphQueryResult<string> {
    const startTime = Date.now();

    try {
      // Check limits
      if (this.config.maxNodes && this.nodes.size >= this.config.maxNodes) {
        return {
          success: false,
          error: `Maximum node limit (${this.config.maxNodes}) exceeded`,
        };
      }

      // Check for duplicates
      if (this.nodes.has(node.id)) {
        return {
          success: false,
          error: `Node with id '${node.id}' already exists`,
        };
      }

      // Add node
      this.nodes.set(node.id, node);

      // Update indexes
      if (this.config.enableIndexing) {
        this.updateNodeIndexes(node, 'add');
      }

      // Clear path cache
      if (this.config.enablePathCaching) {
        this.clearPathCache();
      }

      return {
        success: true,
        data: node.id,
        metadata: {
          executionTime: Date.now() - startTime,
          nodesVisited: 1,
          edgesTraversed: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get a node by ID
   * @param nodeId - Node ID to retrieve
   */
  getNode(nodeId: string): GraphNode | null {
    return this.nodes.get(nodeId) || null;
  }

  /**
   * Remove a node from the graph
   * @param nodeId - ID of node to remove
   * @returns Success/error result
   */
  removeNode(nodeId: string): GraphQueryResult<boolean> {
    const startTime = Date.now();

    try {
      const node = this.nodes.get(nodeId);
      if (!node) {
        return {
          success: false,
          error: `Node with id '${nodeId}' not found`,
        };
      }

      // Remove all connected edges first
      const connectedEdges = node.getAdjacentEdges();
      for (const edgeId of connectedEdges) {
        this.removeEdge(edgeId);
      }

      // Remove node
      this.nodes.delete(nodeId);

      // Update indexes
      if (this.config.enableIndexing) {
        this.updateNodeIndexes(node, 'remove');
      }

      // Clear path cache
      if (this.config.enablePathCaching) {
        this.clearPathCache();
      }

      return {
        success: true,
        data: true,
        metadata: {
          executionTime: Date.now() - startTime,
          nodesVisited: 1,
          edgesTraversed: connectedEdges.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /* ----------------------------- Edge Operations ----------------------------- */

  /**
   * Add an edge to the graph
   * @param edge - GraphEdge instance to add
   * @returns Success/error result
   */
  addEdge(edge: GraphEdge): GraphQueryResult<string> {
    const startTime = Date.now();

    try {
      // Check limits
      if (this.config.maxEdges && this.edges.size >= this.config.maxEdges) {
        return {
          success: false,
          error: `Maximum edge limit (${this.config.maxEdges}) exceeded`,
        };
      }

      // Check for duplicates
      if (this.edges.has(edge.id)) {
        return {
          success: false,
          error: `Edge with id '${edge.id}' already exists`,
        };
      }

      // Verify nodes exist
      const sourceNode = this.nodes.get(edge.sourceId);
      const targetNode = this.nodes.get(edge.targetId);

      if (!sourceNode) {
        return {
          success: false,
          error: `Source node '${edge.sourceId}' not found`,
        };
      }

      if (!targetNode) {
        return {
          success: false,
          error: `Target node '${edge.targetId}' not found`,
        };
      }

      // Add edge
      this.edges.set(edge.id, edge);

      // Update node edge references
      sourceNode.addEdge(edge.id, 'outgoing');
      targetNode.addEdge(edge.id, 'incoming');

      // Update indexes
      if (this.config.enableIndexing) {
        this.updateEdgeIndexes(edge, 'add');
      }

      // Clear path cache
      if (this.config.enablePathCaching) {
        this.clearPathCache();
      }

      return {
        success: true,
        data: edge.id,
        metadata: {
          executionTime: Date.now() - startTime,
          nodesVisited: 2,
          edgesTraversed: 1,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get an edge by ID
   * @param edgeId - Edge ID to retrieve
   */
  getEdge(edgeId: string): GraphEdge | null {
    return this.edges.get(edgeId) || null;
  }

  /**
   * Remove an edge from the graph
   * @param edgeId - ID of edge to remove
   * @returns Success/error result
   */
  removeEdge(edgeId: string): GraphQueryResult<boolean> {
    const startTime = Date.now();

    try {
      const edge = this.edges.get(edgeId);
      if (!edge) {
        return {
          success: false,
          error: `Edge with id '${edgeId}' not found`,
        };
      }

      // Remove edge references from nodes
      const sourceNode = this.nodes.get(edge.sourceId);
      const targetNode = this.nodes.get(edge.targetId);

      sourceNode?.removeEdge(edgeId);
      targetNode?.removeEdge(edgeId);

      // Remove edge
      this.edges.delete(edgeId);

      // Update indexes
      if (this.config.enableIndexing) {
        this.updateEdgeIndexes(edge, 'remove');
      }

      // Clear path cache
      if (this.config.enablePathCaching) {
        this.clearPathCache();
      }

      return {
        success: true,
        data: true,
        metadata: {
          executionTime: Date.now() - startTime,
          nodesVisited: 2,
          edgesTraversed: 1,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /* ----------------------------- Query Operations ----------------------------- */

  /**
   * Find nodes by type
   * @param nodeType - Type of nodes to find
   * @returns Array of matching nodes
   */
  getNodesByType(nodeType: NodeType): GraphNode[] {
    if (!this.config.enableIndexing) {
      return Array.from(this.nodes.values()).filter(node => node.type === nodeType);
    }

    const nodeIds = this.nodesByType.get(nodeType) || new Set();
    return Array.from(nodeIds).map(id => this.nodes.get(id)!).filter(Boolean);
  }

  /**
   * Find nodes by schema
   * @param schema - Schema name to search for
   * @returns Array of matching nodes
   */
  getNodesBySchema(schema: string): GraphNode[] {
    if (!this.config.enableIndexing) {
      return Array.from(this.nodes.values()).filter(node => node.schema === schema);
    }

    const nodeIds = this.nodesBySchema.get(schema) || new Set();
    return Array.from(nodeIds).map(id => this.nodes.get(id)!).filter(Boolean);
  }

  /**
   * Find nodes by name pattern
   * @param namePattern - Name pattern to search for (supports wildcards)
   * @returns Array of matching nodes
   */
  getNodesByName(namePattern: string): GraphNode[] {
    const isExactMatch = !namePattern.includes('*') && !namePattern.includes('%');
    
    if (isExactMatch && this.config.enableIndexing) {
      const nodeIds = this.nodesByName.get(namePattern) || new Set();
      return Array.from(nodeIds).map(id => this.nodes.get(id)!).filter(Boolean);
    }

    // Pattern matching
    const regex = new RegExp(
      namePattern.replace(/\*/g, '.*').replace(/%/g, '.*'),
      'i'
    );

    return Array.from(this.nodes.values()).filter(node => 
      regex.test(node.name)
    );
  }

  /**
   * Query relationships based on criteria
   * @param query - Relationship query parameters
   * @returns Query result with matching relationships
   */
  queryRelationships(query: RelationshipQuery): GraphQueryResult<{
    nodes: GraphNode[];
    edges: GraphEdge[];
    paths: QueryPath[];
  }> {
    const startTime = Date.now();
    let nodesVisited = 0;
    let edgesTraversed = 0;

    try {
      const resultNodes: GraphNode[] = [];
      const resultEdges: GraphEdge[] = [];
      const resultPaths: QueryPath[] = [];

      // Start with all nodes if no source specified
      let candidateNodes = query.sourceNodeId 
        ? [this.getNode(query.sourceNodeId)].filter(Boolean) as GraphNode[]
        : Array.from(this.nodes.values());

      // Filter by node types
      if (query.nodeTypes && query.nodeTypes.length > 0) {
        candidateNodes = candidateNodes.filter(node => 
          query.nodeTypes!.includes(node.type)
        );
      }

      nodesVisited += candidateNodes.length;

      // Process each candidate node
      for (const node of candidateNodes) {
        const relatedData = this.getRelatedNodes(
          node.id,
          query.relationDirection || RelationType.BIDIRECTIONAL,
          query.maxDepth || 2,
          query.edgeTypes
        );

        resultNodes.push(node, ...relatedData.nodes);
        resultEdges.push(...relatedData.edges);
        resultPaths.push(...relatedData.paths);

        edgesTraversed += relatedData.edges.length;
      }

      // Remove duplicates
      const uniqueNodes = Array.from(
        new Map(resultNodes.map(n => [n.id, n])).values()
      );
      const uniqueEdges = Array.from(
        new Map(resultEdges.map(e => [e.id, e])).values()
      );

      return {
        success: true,
        data: {
          nodes: uniqueNodes,
          edges: uniqueEdges,
          paths: resultPaths,
        },
        metadata: {
          executionTime: Date.now() - startTime,
          nodesVisited,
          edgesTraversed,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Find the shortest path between two nodes
   * @param sourceId - Source node ID
   * @param targetId - Target node ID
   * @param options - Pathfinding options
   * @returns Query result with path information
   */
  findPath(
    sourceId: string,
    targetId: string,
    options: PathfindingOptions = {}
  ): GraphQueryResult<QueryPath | null> {
    const startTime = Date.now();

    try {
      // Check cache first
      const cacheKey = `${sourceId}->${targetId}:${JSON.stringify(options)}`;
      if (this.config.enablePathCaching && this.pathCache.has(cacheKey)) {
        this.cacheHits++;
        const cachedPaths = this.pathCache.get(cacheKey)!;
        return {
          success: true,
          data: cachedPaths[0] || null,
          metadata: {
            executionTime: Date.now() - startTime,
            nodesVisited: 0,
            edgesTraversed: 0,
          },
        };
      }

      this.cacheMisses++;

      const path = this.dijkstraPath(sourceId, targetId, options);

      // Cache result
      if (this.config.enablePathCaching) {
        this.pathCache.set(cacheKey, path ? [path] : []);
      }

      return {
        success: true,
        data: path,
        metadata: {
          executionTime: Date.now() - startTime,
          nodesVisited: path ? path.nodes.length : 0,
          edgesTraversed: path ? path.edges.length : 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /* ----------------------------- Utility Methods ----------------------------- */

  /**
   * Export graph to JSON for serialization
   * @returns Serializable graph data
   */
  toJSON(): SerializableGraphData {
    const nodeData = Array.from(this.nodes.values()).map(node => node.toJSON());
    const edgeData = Array.from(this.edges.values()).map(edge => edge.toJSON());

    return {
      nodes: nodeData,
      edges: edgeData,
      metadata: {
        version: '1.0',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        nodeCount: this.nodes.size,
        edgeCount: this.edges.size,
      },
    };
  }

  /**
   * Import graph from JSON data
   * @param data - Serialized graph data
   * @returns Success/error result
   */
  static fromJSON(data: SerializableGraphData, config?: GraphDatabaseConfig): GraphQueryResult<GraphDatabase> {
    const startTime = Date.now();

    try {
      const graph = new GraphDatabase(config);
      
      // Import nodes first
      for (const nodeData of data.nodes) {
        const node = GraphNode.fromJSON(nodeData);
        const result = graph.addNode(node);
        if (!result.success) {
          return {
            success: false,
            error: `Failed to import node ${nodeData.id}: ${result.error}`,
          };
        }
      }

      // Import edges second
      for (const edgeData of data.edges) {
        const edge = GraphEdge.fromJSON(edgeData);
        const result = graph.addEdge(edge);
        if (!result.success) {
          return {
            success: false,
            error: `Failed to import edge ${edgeData.id}: ${result.error}`,
          };
        }
      }

      return {
        success: true,
        data: graph,
        metadata: {
          executionTime: Date.now() - startTime,
          nodesVisited: data.nodes.length,
          edgesTraversed: data.edges.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Create a copy of this graph
   * @returns New graph instance with copied data
   */
  clone(): GraphDatabase {
    const jsonData = this.toJSON();
    const cloneResult = GraphDatabase.fromJSON(jsonData, this.config);
    
    if (!cloneResult.success) {
      throw new Error(`Failed to clone graph: ${cloneResult.error}`);
    }
    
    return cloneResult.data!;
  }

  /**
   * Merge another graph into this one
   * @param otherGraph - Graph to merge
   * @param resolveConflicts - How to handle ID conflicts ('skip', 'overwrite', 'rename')
   * @returns Success/error result with merge statistics
   */
  merge(
    otherGraph: GraphDatabase,
    resolveConflicts: 'skip' | 'overwrite' | 'rename' = 'skip'
  ): GraphQueryResult<{ nodesAdded: number; edgesAdded: number; conflicts: string[] }> {
    const startTime = Date.now();
    const conflicts: string[] = [];
    let nodesAdded = 0;
    let edgesAdded = 0;

    try {
      // Merge nodes
      Array.from(otherGraph.nodes.values()).forEach(node => {
        if (this.nodes.has(node.id)) {
          conflicts.push(`Node ID conflict: ${node.id}`);
          
          if (resolveConflicts === 'skip') {
            return;
          } else if (resolveConflicts === 'overwrite') {
            this.removeNode(node.id);
          } else if (resolveConflicts === 'rename') {
            const newId = `${node.id}_${Date.now()}`;
            const clonedNode = node.clone(newId);
            this.addNode(clonedNode);
            nodesAdded++;
            return;
          }
        }
        
        this.addNode(node);
        nodesAdded++;
      });

      // Merge edges
      Array.from(otherGraph.edges.values()).forEach(edge => {
        if (this.edges.has(edge.id)) {
          conflicts.push(`Edge ID conflict: ${edge.id}`);
          
          if (resolveConflicts === 'skip') {
            return;
          } else if (resolveConflicts === 'overwrite') {
            this.removeEdge(edge.id);
          } else if (resolveConflicts === 'rename') {
            const newId = `${edge.id}_${Date.now()}`;
            const clonedEdge = edge.clone(newId);
            this.addEdge(clonedEdge);
            edgesAdded++;
            return;
          }
        }
        
        this.addEdge(edge);
        edgesAdded++;
      });

      return {
        success: true,
        data: { nodesAdded, edgesAdded, conflicts },
        metadata: {
          executionTime: Date.now() - startTime,
          nodesVisited: nodesAdded,
          edgesTraversed: edgesAdded,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get statistics about the graph
   */
  getStatistics(): {
    nodeCount: number;
    edgeCount: number;
    nodesByType: Record<string, number>;
    edgesByType: Record<string, number>;
    cacheStats: { hits: number; misses: number; hitRate: number };
    memoryFootprint: number;
  } {
    const nodesByType: Record<string, number> = {};
    const edgesByType: Record<string, number> = {};

    // Count nodes by type
    this.nodesByType.forEach((nodeSet, type) => {
      nodesByType[type] = nodeSet.size;
    });

    // Count edges by type
    this.edgesByType.forEach((edgeSet, type) => {
      edgesByType[type] = edgeSet.size;
    });

    // Calculate hit rate
    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRate = totalRequests > 0 ? this.cacheHits / totalRequests : 0;

    // Estimate memory footprint
    let memoryFootprint = 0;
    Array.from(this.nodes.values()).forEach(node => {
      memoryFootprint += node.getMemoryFootprint();
    });
    Array.from(this.edges.values()).forEach(edge => {
      memoryFootprint += edge.getMemoryFootprint();
    });

    return {
      nodeCount: this.nodes.size,
      edgeCount: this.edges.size,
      nodesByType,
      edgesByType,
      cacheStats: {
        hits: this.cacheHits,
        misses: this.cacheMisses,
        hitRate,
      },
      memoryFootprint,
    };
  }

  /**
   * Clear all data from the graph
   */
  clear(): void {
    this.nodes.clear();
    this.edges.clear();
    this.clearIndexes();
    this.clearPathCache();
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  /* ----------------------------- Private Helper Methods ----------------------------- */

  private updateNodeIndexes(node: GraphNode, operation: 'add' | 'remove'): void {
    const { type, name, schema } = node;

    if (operation === 'add') {
      this.nodesByType.get(type)?.add(node.id);
      this.nodesByName.get(name)?.add(node.id) || this.nodesByName.set(name, new Set([node.id]));
      if (schema) {
        this.nodesBySchema.get(schema)?.add(node.id) || this.nodesBySchema.set(schema, new Set([node.id]));
      }
    } else {
      this.nodesByType.get(type)?.delete(node.id);
      this.nodesByName.get(name)?.delete(node.id);
      if (schema) {
        this.nodesBySchema.get(schema)?.delete(node.id);
      }
    }
  }

  private updateEdgeIndexes(edge: GraphEdge, operation: 'add' | 'remove'): void {
    const { type, sourceId, targetId } = edge;

    if (operation === 'add') {
      this.edgesByType.get(type)?.add(edge.id);
      this.edgesBySource.get(sourceId)?.add(edge.id) || this.edgesBySource.set(sourceId, new Set([edge.id]));
      this.edgesByTarget.get(targetId)?.add(edge.id) || this.edgesByTarget.set(targetId, new Set([edge.id]));
    } else {
      this.edgesByType.get(type)?.delete(edge.id);
      this.edgesBySource.get(sourceId)?.delete(edge.id);
      this.edgesByTarget.get(targetId)?.delete(edge.id);
    }
  }

  private clearIndexes(): void {
    Array.from(this.nodesByType.values()).forEach(nodeSet => {
      nodeSet.clear();
    });
    Array.from(this.edgesByType.values()).forEach(edgeSet => {
      edgeSet.clear();
    });
    this.nodesBySchema.clear();
    this.nodesByName.clear();
    this.edgesBySource.clear();
    this.edgesByTarget.clear();
  }

  private clearPathCache(): void {
    this.pathCache.clear();
  }

  private getRelatedNodes(
    nodeId: string,
    direction: RelationType,
    maxDepth: number,
    edgeTypes?: EdgeType[]
  ): { nodes: GraphNode[]; edges: GraphEdge[]; paths: QueryPath[] } {
    const visited = new Set<string>();
    const resultNodes: GraphNode[] = [];
    const resultEdges: GraphEdge[] = [];
    const resultPaths: QueryPath[] = [];

    const queue: { nodeId: string; depth: number; path: string[] }[] = [
      { nodeId, depth: 0, path: [nodeId] }
    ];

    while (queue.length > 0) {
      const { nodeId: currentNodeId, depth, path } = queue.shift()!;

      if (depth >= maxDepth || visited.has(currentNodeId)) {
        continue;
      }

      visited.add(currentNodeId);
      const currentNode = this.getNode(currentNodeId);
      if (!currentNode) continue;

      if (depth > 0) { // Don't include the starting node
        resultNodes.push(currentNode);
      }

      // Get edges based on direction
      let edgeIds: string[] = [];
      if (direction === RelationType.OUTGOING || direction === RelationType.BIDIRECTIONAL) {
        edgeIds.push(...currentNode.getOutgoingEdges());
      }
      if (direction === RelationType.INCOMING || direction === RelationType.BIDIRECTIONAL) {
        edgeIds.push(...currentNode.getIncomingEdges());
      }

      for (const edgeId of edgeIds) {
        const edge = this.getEdge(edgeId);
        if (!edge) continue;

        // Filter by edge types if specified
        if (edgeTypes && !edgeTypes.includes(edge.type)) {
          continue;
        }

        resultEdges.push(edge);

        // Get the other node
        const otherNodeId = edge.getOtherNodeId(currentNodeId);
        if (otherNodeId && !visited.has(otherNodeId)) {
          const newPath = [...path, otherNodeId];
          queue.push({ nodeId: otherNodeId, depth: depth + 1, path: newPath });

          // Create path object
          if (newPath.length > 1) {
            resultPaths.push({
              nodes: newPath,
              edges: [edgeId], // Simplified for this implementation
              totalWeight: edge.weight,
              relationshipTypes: [edge.type],
              metadata: {},
            });
          }
        }
      }
    }

    return { nodes: resultNodes, edges: resultEdges, paths: resultPaths };
  }

  private dijkstraPath(
    sourceId: string,
    targetId: string,
    options: PathfindingOptions
  ): QueryPath | null {
    const distances = new Map<string, number>();
    const previous = new Map<string, { nodeId: string; edgeId: string } | null>();
    const unvisited = new Set<string>();

    // Initialize distances
    Array.from(this.nodes.keys()).forEach(nodeId => {
      distances.set(nodeId, nodeId === sourceId ? 0 : Infinity);
      previous.set(nodeId, null);
      unvisited.add(nodeId);
    });

    const weightFunction = options.weightFunction || ((edge: GraphEdge) => edge.weight);

    while (unvisited.size > 0) {
      // Find unvisited node with minimum distance
      let currentNodeId = '';
      let minDistance = Infinity;
      Array.from(unvisited).forEach(nodeId => {
        const distance = distances.get(nodeId) || Infinity;
        if (distance < minDistance) {
          minDistance = distance;
          currentNodeId = nodeId;
        }
      });

      if (minDistance === Infinity) break; // No path exists

      unvisited.delete(currentNodeId);

      if (currentNodeId === targetId) {
        // Reconstruct path
        const path: string[] = [];
        const edges: string[] = [];
        const relationshipTypes: EdgeType[] = [];
        let totalWeight = 0;

        let current = targetId;
        while (current !== sourceId) {
          path.unshift(current);
          const prev = previous.get(current);
          if (!prev) break;

          edges.unshift(prev.edgeId);
          const edge = this.getEdge(prev.edgeId);
          if (edge) {
            relationshipTypes.unshift(edge.type);
            totalWeight += edge.weight;
          }

          current = prev.nodeId;
        }
        path.unshift(sourceId);

        return {
          nodes: path,
          edges,
          totalWeight,
          relationshipTypes,
          metadata: {},
        };
      }

      // Check neighbors
      const currentNode = this.getNode(currentNodeId);
      if (!currentNode) continue;

      const adjacentEdges = currentNode.getAdjacentEdges();
      for (const edgeId of adjacentEdges) {
        const edge = this.getEdge(edgeId);
        if (!edge) continue;

        // Filter by edge types if specified
        if (options.edgeTypes && !options.edgeTypes.includes(edge.type)) {
          continue;
        }

        const neighborId = edge.getOtherNodeId(currentNodeId);
        if (!neighborId || !unvisited.has(neighborId)) continue;

        // Filter by node types if specified
        if (options.allowedNodeTypes) {
          const neighborNode = this.getNode(neighborId);
          if (!neighborNode || !options.allowedNodeTypes.includes(neighborNode.type)) {
            continue;
          }
        }

        const weight = weightFunction(edge);
        const altDistance = (distances.get(currentNodeId) || 0) + weight;

        if (altDistance < (distances.get(neighborId) || Infinity)) {
          distances.set(neighborId, altDistance);
          previous.set(neighborId, { nodeId: currentNodeId, edgeId });
        }
      }
    }

    return null; // No path found
  }
}

/**
 * OVERVIEW
 *
 * - Purpose: High-performance graph database for database schema representation and query generation
 * - Assumptions: Schema graphs are relatively stable with frequent relationship queries
 * - Edge Cases: Handles large schemas, complex relationships, memory constraints, concurrent access patterns
 * - How it fits into the system: Core engine for schema-aware query generation and database relationship discovery
 * - Future Improvements: Persistent storage, distributed graph support, advanced analytics, real-time updates
 */

/*
 * === graph-database.ts ===
 * Updated: 2025-09-17 12:00
 * Summary: Memory-efficient graph database with indexing, caching, and pathfinding capabilities
 * Key Components:
 *   - GraphDatabase: Main class with CRUD operations and relationship queries
 *   - Indexing system: Type, schema, and name-based indexes for fast lookups
 *   - Path finding: Dijkstra algorithm with customizable weight functions
 *   - Caching: Path result caching for performance optimization
 * Dependencies:
 *   - Requires: graph-node.ts, graph-edge.ts, types.ts
 * Version History:
 *   v1.0 – initial implementation with full feature set
 * Notes:
 *   - Optimized for read-heavy workloads typical in schema analysis
 *   - Memory footprint tracking and limits for production use
 *   - Extensible design for different database engines
 */