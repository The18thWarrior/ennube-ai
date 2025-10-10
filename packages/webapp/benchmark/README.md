# AI Agent Benchmark Suite

This benchmark suite is designed to test AI agent performance across a comprehensive set of query prompts, measuring both response accuracy and tool usage effectiveness.

## Overview

The benchmark script reads query prompts from a CSV file, executes them in parallel against AI agents, and evaluates the responses using AI-powered scoring. Results are written to a CSV file with detailed metrics.

## Files

- `execute_benchmark.ts` - Main benchmark execution script
- `files/query_prompts.csv` - Input CSV with test queries
- `output/query_responses.csv` - Generated results with scores and metrics
- `README.md` - This documentation

## Input Format

The input CSV file should have the following columns:
- `Category` - Classification of the query type
- `Question` - The actual question to test
- `Result` - (Optional) Expected result placeholder
- `Answer Score (1 - 5)` - (Optional) Manual scoring placeholder
- `Use of Tools Score (1 - 5)` - (Optional) Manual tool usage scoring placeholder

## Output Format

The output CSV contains:
- `Question` - Original question tested
- `Model` - AI model used for the response
- `Response` - Full agent response
- `TimeTakenMs` - Response time in milliseconds
- `Summary` - AI-generated summary of response quality
- `AnswerAccuracyScore` - AI-generated accuracy score (1-5)
- `ToolUseScore` - AI-generated tool usage score (1-5)

## Usage

### Prerequisites

1. Ensure environment variables are configured:
   ```bash
   OPENROUTER_API_KEY=your_api_key
   OPENROUTER_MODEL=deepseek/deepseek-chat-v3.1  # or your preferred model
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

### Running the Benchmark

Execute the benchmark using ts-node:

```bash
cd packages/webapp
npx ts-node benchmark/execute_benchmark.ts
```

Or from the root of the repository:

```bash
pnpm --filter @ennube/webapp benchmark
```

### Custom Configuration

You can modify the benchmark by editing `execute_benchmark.ts`:

- **Agent Selection**: Change the `agent` variable to test different agents ('data-steward', 'prospect-finder', 'contract-reader')
- **Model Selection**: Modify the model configuration in `getModel()` calls
- **Concurrency**: Adjust `concurrencyLimit` to control parallel request volume
- **Steps Limit**: Modify `maxSteps` in the streamText call to control interaction depth

## Performance Metrics

The benchmark measures:

1. **Response Time**: Time taken for each request in milliseconds
2. **Answer Accuracy**: AI-evaluated score (1-5) for response relevance and completeness
3. **Tool Usage**: AI-evaluated score (1-5) for appropriate use of available tools
4. **Error Rate**: Percentage of requests that resulted in errors

## Sample Output

```
🎯 Starting AI Agent Benchmark Execution
==========================================
📂 Reading prompts from: /path/to/query_prompts.csv
📊 Found 95 query prompts to process
🤖 Using agent: data-steward
🧠 Using model: deepseek/deepseek-chat-v3.1
🔧 Available tools: getSFDCDataTool, proposeUpdateSFDCDataTool, getSFDCFileTool

📦 Processing batch 1/32
🚀 Starting request for: "What are my tasks for today?..."
✅ Completed request in 1247ms: "What are my tasks for today?..."
...

📈 Benchmark Summary
===================
Total Queries Processed: 95
Total Execution Time: 89543ms (89.54s)
Average Response Time: 942.56ms
Average Accuracy Score: 3.42/5
Average Tool Use Score: 2.89/5

💾 Results saved to: /path/to/query_responses.csv
🎉 Benchmark execution completed successfully!
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**: The benchmark uses mock authentication. For full tool functionality, you may need to configure proper Salesforce credentials or modify the tool loading logic.

2. **API Rate Limits**: Reduce `concurrencyLimit` if you encounter rate limiting issues.

3. **Memory Usage**: For large prompt sets, consider processing in smaller batches.

4. **Model Availability**: Ensure your selected model is available in OpenRouter or update the model configuration.

### Error Handling

The script includes comprehensive error handling:
- Individual request failures are logged but don't stop the benchmark
- Network errors are captured with timing information
- Evaluation failures fall back to default scores
- File system errors are clearly reported

## Extending the Benchmark

### Adding New Agents

1. Add the agent type to the type union in the script
2. Ensure the agent is supported in `getPrompt()` and `getTools()`
3. Update the agent selection logic in the main function

### Custom Evaluation Criteria

Modify the `EvaluationSchema` and `evaluateResponse()` function to include additional scoring dimensions such as:
- Response relevance
- Security compliance
- Performance efficiency
- User experience quality

### Batch Processing

For very large datasets, consider implementing:
- File chunking for memory efficiency
- Incremental result saving
- Resume capability for interrupted runs
- Distributed processing across multiple instances

## License

This benchmark suite is part of the ennube-ai project and follows the same licensing terms.
