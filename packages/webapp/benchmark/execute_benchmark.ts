// === execute_benchmark.ts ===
// Created: 2025-09-15 15:30
// Purpose: Comprehensive benchmark script for testing AI agent responses across multiple query prompts
// Exports:
//   - main: Primary execution function for running benchmark tests
// Interactions:
//   - Used by: ts-node for standalone execution and performance testing
// Notes:
//   - Processes CSV input files, executes parallel AI agent requests, and evaluates responses
z
import { generateObject, LanguageModel, Tool, ModelMessage, streamText, readUIMessageStream } from 'ai';
import getModel from '../lib/chat/getModel';
import { getPrompt, getTools } from '../lib/chat/helper';
import { chatAgent } from '../lib/chat/chatAgent';
import z from 'zod/v4';
import {prompts as inputFile} from './files/query_prompts';
import { auth } from '@/auth';

/**
 * OVERVIEW
 *
 * - Purpose: Execute parallel benchmark tests against AI agents using CSV-defined prompts
 * - Assumptions: Valid CSV input, configured AI models, and proper authentication
 * - Edge Cases: Handles missing data, API failures, and malformed responses gracefully
 * - How it fits into the system: Provides performance testing and evaluation metrics for AI agents
 * - Future Improvements: Add more sophisticated scoring algorithms, batch processing, and result analytics
 */

// Define types for CSV parsing and results
interface QueryPrompt {
  Category: string;
  Question: string;
  Result: string;
  AnswerScore: string;
  ToolUseScore: string;
}

interface BenchmarkResult {
  Question: string;
  Model: string;
  Response: string;
  TimeTakenMs: number;
  Summary: string;
  AnswerAccuracyScore: number;
  ToolUseScore: number;
}

// Zod schema for response evaluation
const EvaluationSchema = z.object({
  summary: z.string().describe('Brief summary of the agent response quality and relevance'),
  answer_accuracy_score: z.number().min(1).max(5).describe('Score from 1-5 rating answer accuracy and completeness'),
  tool_use_score: z.number().min(1).max(5).describe('Score from 1-5 rating appropriate use of available tools')
});

type EvaluationResult = z.infer<typeof EvaluationSchema>;

/**
 * Parse CSV file content into structured data
 * @param csvContent Raw CSV file content
 * @returns Array of parsed query prompts
 */
function parseCSV(csvContent: string): QueryPrompt[] {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    // Simple CSV parsing - handles basic cases
    const values = line.split(',').map(v => v.trim());
    const record: any = {};
    
    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });
    
    return record as QueryPrompt;
  }).filter(record => record.Question && record.Question.length > 0);
}

/**
 * Execute chat agent request with timing
 * @param question User question
 * @param agent Agent type
 * @param model AI model instance
 * @param systemPrompt System prompt for the agent
 * @param tools Available tools for the agent
 * @returns Promise with response and timing data
 */
async function executeAgentRequest(
  question: string,
  agent: 'data-steward' | 'prospect-finder' | 'contract-reader',
  model: LanguageModel,
  systemPrompt: string,
  tools: Record<string, Tool>
): Promise<{ response: string; timeTakenMs: number }> {
  const startTime = Date.now();
  
  try {
    // Simulate user message format
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: question
      }
    ];

    console.log(`🚀 Starting request for: "${question.substring(0, 50)}..."`);
    
    // For benchmark purposes, we'll use a simplified approach
    // Instead of the full chatAgent which returns streaming responses,
    // we'll use the core streamText functionality directly for easier response handling
    
    const result = await chatAgent({ model, systemPrompt, tools, _messages: messages });
    const reader = result.body?.getReader();
    if (!reader) {
      console.error('Failed to get reader from response body');
      return { response: 'Error: Failed to read response', timeTakenMs: Date.now() - startTime };
    }
    let rawResult = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log('Stream finished.');
        break;
      }
      // Process each chunk of data (e.g., decode, log, store)
      const chunk = (new TextDecoder().decode(value));
      //console.log('Received chunk:', chunk);
      rawResult += chunk;
    }
    // Collect the full response text
    let responseContent = JSON.stringify(rawResult);

    const timeTakenMs = Date.now() - startTime;
    console.log(`✅ Completed request in ${timeTakenMs}ms: "${question.substring(0, 50)}..."`);
    
    return {
      response: responseContent || 'No response generated',
      timeTakenMs
    };
    
  } catch (error) {
    const timeTakenMs = Date.now() - startTime;
    console.error(`❌ Request failed after ${timeTakenMs}ms: "${question.substring(0, 50)}..."`, error);
    
    return {
      response: `Error: ${error instanceof Error ? error.message : String(error)}`,
      timeTakenMs
    };
  }
}

/**
 * Evaluate agent response using AI
 * @param question Original question
 * @param response Agent response
 * @param model AI model for evaluation
 * @returns Promise with evaluation scores
 */
async function evaluateResponse(
  question: string,
  response: string,
  model: LanguageModel
): Promise<EvaluationResult> {
  try {
    const evaluationPrompt = `Please evaluate this AI agent response for accuracy and tool usage.

      Original Question: "${question}"

      Agent Response: "${response}"

      Rate the response on:
      1. Answer Accuracy Score (1-5): How well does the response answer the question accurately and completely?
      2. Tool Use Score (1-5): How appropriately does the response demonstrate use of available tools or indicate when tools would be helpful?

      Provide scores from 1 (poor) to 5 (excellent) and a brief summary.`;

    const { object: evaluationResult } = await generateObject({
      model,
      
      schema: EvaluationSchema,
      prompt: evaluationPrompt,
      providerOptions: {
        openrouter: {
          parallelToolCalls: false
        }
      }
    }) as any;

    return evaluationResult;
    
  } catch (error) {
    console.error('❌ Evaluation failed:', error);
    return {
      summary: 'Evaluation failed due to error',
      answer_accuracy_score: 1,
      tool_use_score: 1
    };
  }
}

/**
 * Process single query prompt
 * @param prompt Query prompt data
 * @param agent Agent type to test
 * @param model AI model instance
 * @param systemPrompt System prompt
 * @param tools Available tools
 * @param evaluationModel Model for evaluation
 * @returns Promise with benchmark result
 */
async function processSingleQuery(
  prompt: QueryPrompt,
  agent: 'data-steward' | 'prospect-finder' | 'contract-reader',
  model: LanguageModel,
  systemPrompt: string,
  tools: Record<string, Tool>,
  evaluationModel: LanguageModel
): Promise<BenchmarkResult> {
  
  // Execute agent request
  const { response, timeTakenMs } = await executeAgentRequest(
    prompt.Question,
    agent,
    model,
    systemPrompt,
    tools
  );
  
  // Evaluate response
  const evaluation = await evaluateResponse(prompt.Question, response, evaluationModel);
  
  return {
    Question: prompt.Question,
    Model: process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat-v3.1',
    Response: response, // Truncate long responses
    TimeTakenMs: timeTakenMs,
    Summary: evaluation.summary,
    AnswerAccuracyScore: evaluation.answer_accuracy_score,
    ToolUseScore: evaluation.tool_use_score
  };
}

/**
 * Convert benchmark results to CSV format
 * @param results Array of benchmark results
 * @returns CSV string
 */
function resultsToCSV(results: BenchmarkResult[]): string {
  const headers = [
    'Question',
    'Model',
    'Response',
    'TimeTakenMs',
    'Summary',
    'AnswerAccuracyScore',
    'ToolUseScore'
  ];
  
  const csvRows = [
    headers.join(','),
    ...results.map(result => [
      `"${result.Question.replace(/"/g, '""')}"`,
      `"${result.Model}"`,
      `"${result.Response.replace(/"/g, '""')}"`,
      result.TimeTakenMs.toString(),
      `"${result.Summary.replace(/"/g, '""')}"`,
      result.AnswerAccuracyScore.toString(),
      result.ToolUseScore.toString()
    ].join(','))
  ];
  
  return csvRows.join('\n');
}

/**
 * Main benchmark execution function
 */
async function main(question: string) {
  console.log('🎯 Starting AI Agent Benchmark Execution');
  console.log('==========================================');
  
  try {
    // File paths
    //const inputPath = path.join(__dirname, 'files', 'query_prompts.csv');
    //const outputPath = path.join(__dirname, 'output', 'query_responses.csv');
    
    // Verify input file exists
    // if (!fs.existsSync(inputPath)) {
    //   throw new Error(`Input file not found: ${inputPath}`);
    // }
    
    console.log(`📂 Reading prompts from: inputFile`);
    
    // Read and parse CSV
    const csvContent = inputFile;
    //const _queryPrompts = parseCSV(csvContent);
    const _queryPrompts : QueryPrompt[] = [
      {
      Category: 'General',
      Question: question || 'List the top 5 largest companies in the world by market capitalization.',
      Result: '',
      } as QueryPrompt
    ];
    console.log(`📊 Found ${_queryPrompts.length} query prompts to process`);
    
    if (_queryPrompts.length === 0) {
      throw new Error('No valid query prompts found in CSV file');
    }
    const queryPrompts = _queryPrompts.slice(0,1); // Use all prompts
    // Get model and agent configuration
    const model = getModel();
    if (!model) {
      throw new Error('AI model not configured');
    }
    
    const evaluationModel = getModel(); // Use a different model for evaluation if needed
    if (!evaluationModel) {
      throw new Error('Evaluation AI model not configured');
    }
    // Default to data-steward agent for benchmark
    const agent: 'data-steward' | 'prospect-finder' | 'contract-reader' = 'data-steward';
    const systemPrompt = getPrompt(agent);
    
    // Mock user sub for tools (this would need to be adapted for your authentication)
    // For benchmark purposes, we'll use a test user ID or skip tools that require authentication
    const session = await auth();
    
    if (!session || !session.user || !session.user.auth0) {
      console.log('User is not authenticated');
      throw new Error('Authentication required to load user-specific tools');
    }
    
    // Get user's sub from the session
    const mockUserSub = session.user.auth0.sub;
    let tools: Record<string, Tool>; 
    try {
      tools = await getTools(agent, mockUserSub);
    } catch (error) {
      console.warn(`⚠️  Warning: Could not load tools due to authentication: ${error}`);
      console.log('📝 Continuing benchmark with minimal tools...');
      tools = {}; // Use empty tools for benchmark
    }
    
    console.log(`🤖 Using agent: ${agent}`);
    console.log(`🧠 Using model: ${process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat-v3.1'}`);
    console.log(`🔧 Available tools: ${Object.keys(tools).join(', ')}`);
    
    // Process queries in parallel (with concurrency limit)
    const concurrencyLimit = 3; // Adjust based on your API limits
    const results: BenchmarkResult[] = [];
    
    // for (let i = 0; i < queryPrompts.length; i += concurrencyLimit) {
    //   const batch = queryPrompts.slice(i, i + concurrencyLimit);
    //   console.log(`\n📦 Processing batch ${Math.floor(i / concurrencyLimit) + 1}/${Math.ceil(queryPrompts.length / concurrencyLimit)}`);
      
    //   const batchPromises = batch.map(prompt => 
    //     processSingleQuery(prompt, agent, model, systemPrompt, tools, evaluationModel)
    //   );
      
    //   const batchResults = await Promise.all(batchPromises);
    //   results.push(...batchResults);
      
    //   console.log(`✅ Batch completed. Progress: ${results.length}/${queryPrompts.length}`);
    // }
    
    const result = await processSingleQuery(queryPrompts[0], agent, model, systemPrompt, tools, evaluationModel)
    // Generate summary statistics
    const totalTime = results.reduce((sum, r) => sum + r.TimeTakenMs, 0);
    const avgTime = totalTime / results.length;
    const avgAccuracyScore = results.reduce((sum, r) => sum + r.AnswerAccuracyScore, 0) / results.length;
    const avgToolUseScore = results.reduce((sum, r) => sum + r.ToolUseScore, 0) / results.length;
    
    console.log('\n📈 Benchmark Summary');
    console.log('===================');
    console.log(`Total Queries Processed: ${results.length}`);
    console.log(`Total Execution Time: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);
    console.log(`Average Response Time: ${avgTime.toFixed(2)}ms`);
    console.log(`Average Accuracy Score: ${avgAccuracyScore.toFixed(2)}/5`);
    console.log(`Average Tool Use Score: ${avgToolUseScore.toFixed(2)}/5`);
    
    // Write results to CSV
    //const csvOutput = resultsToCSV(results);
    //fs.writeFileSync(outputPath, csvOutput, 'utf-8');
    
    //console.log(`\n💾 Results saved to: ${outputPath}`);
    console.log('🎉 Benchmark execution completed successfully!');
    return result;
    
  } catch (error) {
    console.error('💥 Benchmark execution failed:', error);
    //process.exit(1);
  }
}

// Execute if running directly
// if (require.main === module) {
//   main().catch(error => {
//     console.error('Fatal error:', error);
//     process.exit(1);
//   });
// }

export { main };

/*
 * === execute_benchmark.ts ===
 * Updated: 2025-09-15 15:30
 * Summary: Comprehensive benchmark script for testing AI agent responses with parallel execution and evaluation
 * Key Components:
 *   - parseCSV: Parses input CSV files with query prompts
 *   - executeAgentRequest: Executes individual agent requests with timing
 *   - evaluateResponse: Uses AI to evaluate response quality and tool usage
 *   - processSingleQuery: Orchestrates single query processing
 *   - main: Primary execution function with parallel processing and reporting
 * Dependencies:
 *   - Requires: AI SDK, chat agent system, configured models, file system access
 * Version History:
 *   v1.0 – initial implementation with full CSV processing and evaluation pipeline
 * Notes:
 *   - Uses controlled concurrency to respect API limits
 *   - Provides comprehensive error handling and progress logging
 *   - Generates detailed summary statistics and CSV output
 */