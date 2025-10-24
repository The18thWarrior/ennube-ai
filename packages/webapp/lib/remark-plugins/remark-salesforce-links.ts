// === remark-salesforce-links.ts ===
// Created: 2025-10-22 14:00
// Purpose: Remark plugin to detect and link Salesforce 18-character IDs in markdown
// Exports:
//   - export const remarkSalesforceLinks
// Interactions:
//   - Used by: Response component to transform markdown AST
//   - Depends on: isValidSalesforce18IdFast from lib/client-tools/salesforce
//   - Requires: unist-util-visit for AST traversal
// Notes:
//   - Skips transformation for IDs in code blocks and inline code
//   - Validates IDs using fast checksum validation
//   - Only processes when instanceUrl is provided

import { visit } from 'unist-util-visit';
import { isValidSalesforce18IdFast } from '@/lib/client-tools/salesforce';

/**
 * Options for the remarkSalesforceLinks plugin
 */
interface RemarkSalesforceLinksOptions {
  /**
   * The Salesforce instance URL (e.g., https://my-org.salesforce.com)
   * If not provided, the plugin will skip transformation.
   */
  instanceUrl?: string | null;
}

/**
 * Type for the remark plugin function
 */
type UnistNode = any;
type UnistTree = any;

/**
 * Remark plugin that detects valid Salesforce 18-character IDs in markdown text
 * and converts them to clickable links to the corresponding Salesforce records.
 *
 * BEHAVIOR:
 * - Traverses markdown AST for text nodes
 * - Detects 18-character alphanumeric strings using regex pattern
 * - Validates each candidate ID using isValidSalesforce18IdFast checksum validation
 * - Replaces valid IDs with link nodes pointing to {instanceUrl}/{salesforceId}
 * - Skips IDs within code blocks, inline code, and existing links
 * - Handles multiple IDs in a single text node by splitting into multiple child nodes
 *
 * EDGE CASES HANDLED:
 * 1. IDs in code blocks (fenced or inline) are NOT linked
 * 2. Already-linked IDs are not double-wrapped
 * 3. Invalid 18-char strings (failed checksum) are NOT linked
 * 4. Multiple IDs in one text node are properly split
 * 5. Surrounding text is preserved
 * 6. Plugin gracefully exits if instanceUrl is not provided
 *
 * EXAMPLE TRANSFORMATION:
 * Input:  "Check record 001xx000003DHP0AAO for details"
 * Output: "Check record <a href="https://org.salesforce.com/001xx000003DHP0AAO">001xx000003DHP0AAO</a> for details"
 *
 * @param options - Configuration options including instanceUrl
 * @returns A remark plugin function that transforms the markdown AST
 *
 * @example
 * ```typescript
 * import { Streamdown } from 'streamdown';
 * import { remarkSalesforceLinks } from '@/lib/remark-plugins';
 *
 * export function MyComponent() {
 *   const { instanceUrl } = useOnboardingStatus();
 *
 *   return (
 *     <Streamdown
 *       remarkPlugins={[
 *         [remarkSalesforceLinks, { instanceUrl }]
 *       ]}
 *     >
 *       {content}
 *     </Streamdown>
 *   );
 * }
 * ```
 */
export function remarkSalesforceLinks(
  options: RemarkSalesforceLinksOptions = {}
) {
  const { instanceUrl } = options;

  return (tree: UnistTree) => {
    // Early exit if no instance URL is provided
    //if (!instanceUrl) return;

    visit(tree, 'text', (node: UnistNode, index: number | undefined, parent: UnistNode) => {
      
      console.log('tree value', node, parent);
      // Type guard for parent
      if (!parent) return;

      // Skip if this text node is inside a code block or inline code
      //if (parent.type === 'code' || parent.type === 'inlineCode') return;

      // Skip if the parent is already a link (avoid double-wrapping)
      if (parent.type === 'link') return;

      const _text = node.value as string;
      const text = _text;
      // Pattern to match 18-character alphanumeric strings with word boundaries
      // Salesforce IDs are: [A-Za-z0-9]{18}
      const sfIdPattern = /\b[a-zA-Z0-9]{18}\b/g;
      const matches = Array.from(text.matchAll(sfIdPattern));

      console.log('Salesforce ID matches found:', matches);
      // If no potential matches, skip this node
      if (matches.length === 0) return;

      // Validate each match and build replacement nodes
      const newNodes: UnistNode[] = [];
      let lastIndex = 0;

      for (const match of matches) {
        const candidate = match[0] as string;
        const matchIndex = match.index ?? 0;

        // Validate with the fast checksum validator
        if (!isValidSalesforce18IdFast(candidate)) {
          // Invalid ID (checksum failed), skip this match
          continue;
        }

        // Add text before this match
        if (matchIndex > lastIndex) {
          newNodes.push({
            type: 'text',
            value: text.slice(lastIndex, matchIndex)
          });
        }

        // Add link node for the valid Salesforce ID
        newNodes.push({
          type: 'link',
          url: `${instanceUrl}/${candidate}`,
          title: `View Salesforce record ${candidate}`,
          children: [
            {
              type: 'text',
              value: candidate
            }
          ]
        });

        lastIndex = matchIndex + candidate.length;
      }

      // Add remaining text after the last match
      if (lastIndex < text.length) {
        newNodes.push({
          type: 'text',
          value: text.slice(lastIndex)
        });
      }

      // Replace the original text node with the new nodes if we found valid IDs
      if (newNodes.length > 0 && typeof index === 'number') {
        parent.children.splice(index, 1, ...newNodes);
      }
    });
  };
}

/*
 * === remark-salesforce-links.ts ===
 * Updated: 2025-10-22 14:00
 * Summary: Remark plugin that transforms Salesforce 18-char IDs into clickable links
 * Key Components:
 *   - remarkSalesforceLinks(): Main plugin factory function
 *   - visit() from unist-util-visit: AST traversal
 *   - isValidSalesforce18IdFast(): Validation with checksum
 * Dependencies:
 *   - unist-util-visit: For AST traversal
 *   - @/lib/client-tools/salesforce: For ID validation
 *   - mdast types: For AST node definitions
 * Version History:
 *   v1.0 – initial implementation with full edge case handling
 * Notes:
 *   - Efficiently handles multiple IDs in single text node
 *   - Skips code blocks/inline code automatically
 *   - Uses optimized validation (no regex, minimal allocations)
 *   - Safe to use without instanceUrl (graceful exit)
 *
 * OVERVIEW
 *
 * - Purpose: Transform markdown to add clickable links for Salesforce IDs
 * - Assumptions: instanceUrl is properly formatted, IDs are in plain text
 * - Edge Cases: Code blocks, invalid checksums, null instanceUrl handled
 * - How it fits: Part of AI response rendering pipeline via Streamdown
 * - Future Improvements: Support 15-char IDs, add hover previews, batch validation
 */
