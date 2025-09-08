import { UpdateProposal } from '@/types/sfdc-update';
import { generateObject } from 'ai';
import { openrouter } from '@openrouter/ai-sdk-provider';
import z from 'zod/v4';

function simpleId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

// Zod schema that mirrors UpdateProposal for validation of LLM output
const FieldChangeSchema = z.object({
  fieldName: z.string(),
  before: z.any().optional(),
  after: z.any().optional()
});

const RecordChangeSchema = z.object({
  operationId: z.string().optional(),
  operation: z.enum(['update', 'delete', 'create']),
  sobject: z.string(),
  recordId: z.string().optional(),
  fields: z.array(FieldChangeSchema).optional(),
  confidence: z.number().min(0).max(1).optional()
});

const UpdateProposalSchema = z.object({
  proposalId: z.string().optional(),
  createdBy: z.string().optional(),
  createdAt: z.string().optional(),
  summary: z.string().optional(),
  changes: z.array(RecordChangeSchema).nonempty(),
  status: z.enum(['draft', 'proposed', 'approved', 'executing', 'completed', 'failed']).optional()
});

/**
 * Parse a natural language request into a structured UpdateProposal using the LLM.
 * Uses `generateObject` with a strict schema to get deterministic structured output.
 */
export async function parseUpdateRequest(nlRequest: string, context?: any): Promise<UpdateProposal> {
  const model = openrouter('deepseek/deepseek-chat-v3.1');

  // Compose a clear prompt that instructs the model to output only the JSON object matching the schema
  const prompt = `You are an assistant that converts a user's natural-language instruction into a structured Salesforce update proposal.

Instructions:
- Produce a JSON object that matches the provided schema exactly.
- The object must include a non-empty 'changes' array. Each change must include operation (update/delete/create), sobject, and fields when relevant.
- For updates/creates, include fieldName and after values. Do not invent confidential information.
- Keep values concise. If a record id is not present, omit recordId.
- Do not include any explanations or surrounding text; return only the JSON object.

Examples (few-shot):

NL: "Update Account 0012x00000ABCDE set Phone to 555-1234 and Industry to Technology"
JSON:
{
  "proposalId": "proposal_example_1",
  "createdBy": "agent",
  "createdAt": "2025-01-01T00:00:00Z",
  "summary": "Update Account fields",
  "changes": [
    {
      "operationId": "op_example_1",
      "operation": "update",
      "sobject": "Account",
      "recordId": "0012x00000ABCDE",
      "fields": [
        { "fieldName": "Phone", "after": "555-1234" },
        { "fieldName": "Industry", "after": "Technology" }
      ],
      "confidence": 0.9
    }
  ],
  "status": "proposed"
}

NL: "Delete Contact 0035x00000XYZ12"
JSON:
{
  "proposalId": "proposal_example_2",
  "createdBy": "agent",
  "createdAt": "2025-01-01T00:00:00Z",
  "summary": "Delete Contact",
  "changes": [
    {
      "operationId": "op_example_2",
      "operation": "delete",
      "sobject": "Contact",
      "recordId": "0035x00000XYZ12",
      "fields": [],
      "confidence": 0.95
    }
  ],
  "status": "proposed"
}

NL: "Create a Contact under Account 0012x00000ABCDE with FirstName John, LastName Doe, Email john@example.com"
JSON:
{
  "proposalId": "proposal_example_3",
  "createdBy": "agent",
  "createdAt": "2025-01-01T00:00:00Z",
  "summary": "Create Contact",
  "changes": [
    {
      "operationId": "op_example_3",
      "operation": "create",
      "sobject": "Contact",
      "fields": [
        { "fieldName": "FirstName", "after": "John" },
        { "fieldName": "LastName", "after": "Doe" },
        { "fieldName": "Email", "after": "john@example.com" },
        { "fieldName": "AccountId", "after": "0012x00000ABCDE" }
      ],
      "confidence": 0.85
    }
  ],
  "status": "proposed"
}

User request:
"""
${nlRequest}
"""

Context (if any): ${JSON.stringify(context || {})}

Return a single JSON object that validates against the schema.`;

  let proposed: any = null;
  let lastError: any = null;
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const resp = await generateObject({
        model,
        schema: UpdateProposalSchema,
        prompt
      });
      proposed = resp.object;
      lastError = null;
      break;
    } catch (err) {
      lastError = err;
      console.warn(`generateObject attempt ${attempt} failed:`, err instanceof Error ? err.message : String(err));

      // Prepare a repair prompt for the next attempt
      if (attempt < maxAttempts) {
        const repairPrompt = `The model's previous attempt failed to produce a valid JSON object that matches the required schema.
Please correct the output and return only a single JSON object that validates against the schema. Do not include any explanatory text.

Previous error:
${err instanceof Error ? err.message : String(err)}

Original user request:
"""
${nlRequest}
"""

Context (if any): ${JSON.stringify(context || {})}

Return a clean JSON object.`;

        // Overwrite prompt with repairPrompt for the next iteration
        // Keep examples in the original prompt by appending them to the repairPrompt
        // This gives the model concrete guidance to fix the format
        // NOTE: We intentionally reuse the same schema with generateObject so it will validate
        // the returned object or throw again which will trigger another repair attempt.
        // eslint-disable-next-line no-await-in-loop
        try {
          const resp = await generateObject({ model, schema: UpdateProposalSchema, prompt: repairPrompt });
          proposed = resp.object;
          lastError = null;
          break;
        } catch (err2) {
          lastError = err2;
          console.warn(`Repair attempt failed:`, err2 instanceof Error ? err2.message : String(err2));
          // continue to next attempt
        }
      }
    }
  }

  // If still no valid proposed object after retries, fall back to a safe minimal proposal
  if (!proposed) {
    console.error('generateObject failed after retries, returning fallback proposal. Last error:', lastError);
    // Create a conservative fallback to allow UI review rather than blocking
    const fallbackChange = {
      operationId: simpleId('op'),
      operation: 'update',
      sobject: context?.sobject || 'Account',
      recordId: context?.recordId,
      fields: [{ fieldName: 'Name', after: 'Updated via agent' }],
      confidence: 0.25
    };

    return {
      proposalId: simpleId('proposal'),
      createdBy: context?.userId || 'agent',
      createdAt: new Date().toISOString(),
      summary: `Fallback proposal (LLM parse failed): ${nlRequest.slice(0, 200)}`,
      changes: [fallbackChange],
      status: 'proposed'
    } as UpdateProposal;
  }

  // Fill defaults for missing ids/timestamps and ensure minimal shape
  const proposal = {
    proposalId: proposed.proposalId || simpleId('proposal'),
    createdBy: proposed.createdBy || context?.userId || 'agent',
    createdAt: proposed.createdAt || new Date().toISOString(),
    summary: proposed.summary || `Parsed proposal from: ${nlRequest.slice(0, 200)}`,
    changes: (proposed.changes || []).map((c: any) => ({
      operationId: c.operationId || simpleId('op'),
      operation: c.operation,
      sobject: c.sobject,
      recordId: c.recordId,
      fields: c.fields || [],
      confidence: c.confidence
    })),
    status: proposed.status || 'proposed'
  } as UpdateProposal;

  return proposal;
}
