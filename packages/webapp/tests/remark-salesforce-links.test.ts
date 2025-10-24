// === remark-salesforce-links.test.ts ===
// Created: 2025-10-22 14:00
// Purpose: Unit tests for the remarkSalesforceLinks remark plugin
// Exports: None (test file)
// Notes:
//   - Uses Jest testing framework
//   - Tests both happy path and edge cases
//   - Mocks the isValidSalesforce18IdFast validator
//   - Includes manual visit implementation for testing without ESM dependency

// First, set up all mocks before importing the module
jest.mock('@/lib/client-tools/salesforce', () => ({
  isValidSalesforce18IdFast: jest.fn((id: string) => {
    // Default mock: return true for valid-looking IDs
    return typeof id === 'string' && id.length === 18 && /^[a-zA-Z0-9]{18}$/.test(id);
  })
}));

// Manual mock for unist-util-visit to avoid ESM issues
jest.mock('unist-util-visit', () => ({
  visit: (tree: any, type: string, callback: any) => {
    const visit = (node: any, index?: number, parent?: any): void => {
      if (node.type === type) {
        callback(node, index, parent);
      }
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child: any, i: number) => {
          visit(child, i, node);
        });
      }
    };
    visit(tree);
  }
}));

import { remarkSalesforceLinks } from '@/lib/remark-plugins/remark-salesforce-links';
import { isValidSalesforce18IdFast } from '@/lib/client-tools/salesforce';

const mockIsValidSalesforce18IdFast = isValidSalesforce18IdFast as jest.MockedFunction<
  typeof isValidSalesforce18IdFast
>;

describe('remarkSalesforceLinks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic functionality', () => {
    it('should detect and link a single valid Salesforce ID', () => {
      const mockInstanceUrl = 'https://test.salesforce.com';
      mockIsValidSalesforce18IdFast.mockReturnValue(true);

      const tree = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                value: 'Check record 001xx000003DHP0AAO for details'
              }
            ]
          }
        ]
      };

      const plugin = remarkSalesforceLinks({ instanceUrl: mockInstanceUrl });
      plugin(tree);

      // The text node should have been replaced with [text, link, text]
      const paragraph = tree.children[0];
      expect(paragraph.children).toHaveLength(3);
      expect(paragraph.children[0]).toEqual({
        type: 'text',
        value: 'Check record '
      });
      expect(paragraph.children[1]).toEqual({
        type: 'link',
        url: `${mockInstanceUrl}/001xx000003DHP0AAO`,
        title: 'View Salesforce record 001xx000003DHP0AAO',
        children: [
          {
            type: 'text',
            value: '001xx000003DHP0AAO'
          }
        ]
      });
      expect(paragraph.children[2]).toEqual({
        type: 'text',
        value: ' for details'
      });
    });

    it('should handle multiple IDs in a single text node', () => {
      const mockInstanceUrl = 'https://test.salesforce.com';
      mockIsValidSalesforce18IdFast.mockReturnValue(true);

      const tree = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                value: 'Contact 001xx000003DHP0AAO and Account 006xx000004RZQ5AAO are related'
              }
            ]
          }
        ]
      };

      const plugin = remarkSalesforceLinks({ instanceUrl: mockInstanceUrl });
      plugin(tree);

      const paragraph = tree.children[0];
      // Should have: [text, link, text, link, text]
      expect(paragraph.children).toHaveLength(5);
      expect((paragraph.children[0] as any).value).toBe('Contact ');
      expect((paragraph.children[1] as any).url).toContain('001xx000003DHP0AAO');
      expect((paragraph.children[2] as any).value).toBe(' and Account ');
      expect((paragraph.children[3] as any).url).toContain('006xx000004RZQ5AAO');
      expect((paragraph.children[4] as any).value).toBe(' are related');
    });

    it('should skip IDs that fail validation', () => {
      const mockInstanceUrl = 'https://test.salesforce.com';
      mockIsValidSalesforce18IdFast.mockReturnValue(false);

      const tree = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                value: 'Invalid ID: ABCDEFGHIJKLMNOPQR is not valid'
              }
            ]
          }
        ]
      };

      const plugin = remarkSalesforceLinks({ instanceUrl: mockInstanceUrl });
      plugin(tree);

      // The text node should remain unchanged
      const paragraph = tree.children[0];
      expect(paragraph.children).toHaveLength(1);
      expect(paragraph.children[0]).toEqual({
        type: 'text',
        value: 'Invalid ID: ABCDEFGHIJKLMNOPQR is not valid'
      });
    });
  });

  describe('edge cases', () => {
    it('should not process if instanceUrl is not provided', () => {
      const tree = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                value: 'Check record 001xx000003DHP0AAO for details'
              }
            ]
          }
        ]
      };

      const originalValue = tree.children[0].children[0].value;

      const plugin = remarkSalesforceLinks({ instanceUrl: null });
      plugin(tree);

      // The tree should remain unchanged
      expect(tree.children[0].children[0].value).toBe(originalValue);
      expect(mockIsValidSalesforce18IdFast).not.toHaveBeenCalled();
    });

    it('should not process if instanceUrl is undefined', () => {
      const tree = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                value: 'Check record 001xx000003DHP0AAO for details'
              }
            ]
          }
        ]
      };

      const originalValue = tree.children[0].children[0].value;

      const plugin = remarkSalesforceLinks();
      plugin(tree);

      // The tree should remain unchanged
      expect(tree.children[0].children[0].value).toBe(originalValue);
      expect(mockIsValidSalesforce18IdFast).not.toHaveBeenCalled();
    });

    it('should skip IDs inside code blocks', () => {
      const mockInstanceUrl = 'https://test.salesforce.com';
      mockIsValidSalesforce18IdFast.mockReturnValue(true);

      const tree = {
        type: 'root',
        children: [
          {
            type: 'code',
            value: 'const id = "001xx000003DHP0AAO";'
          }
        ]
      };

      const plugin = remarkSalesforceLinks({ instanceUrl: mockInstanceUrl });
      plugin(tree);

      // Code nodes should not be visited, so no changes
      expect(tree.children[0].value).toBe('const id = "001xx000003DHP0AAO";');
    });

    it('should skip IDs inside inline code', () => {
      const mockInstanceUrl = 'https://test.salesforce.com';
      mockIsValidSalesforce18IdFast.mockReturnValue(true);

      const tree = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'inlineCode',
                value: '001xx000003DHP0AAO'
              }
            ]
          }
        ]
      };

      const plugin = remarkSalesforceLinks({ instanceUrl: mockInstanceUrl });
      plugin(tree);

      // inlineCode nodes should not be transformed
      expect(tree.children[0].children[0].value).toBe('001xx000003DHP0AAO');
    });

    it('should skip IDs that are already inside links', () => {
      const mockInstanceUrl = 'https://test.salesforce.com';
      mockIsValidSalesforce18IdFast.mockReturnValue(true);

      const tree = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'link',
                url: 'https://example.com',
                children: [
                  {
                    type: 'text',
                    value: '001xx000003DHP0AAO'
                  }
                ]
              }
            ]
          }
        ]
      };

      const plugin = remarkSalesforceLinks({ instanceUrl: mockInstanceUrl });
      plugin(tree);

      // The ID inside the link should not be double-wrapped
      expect(tree.children[0].children[0].children[0].value).toBe('001xx000003DHP0AAO');
      expect(tree.children[0].children[0].children).toHaveLength(1);
    });

    it('should preserve text with no valid IDs', () => {
      const mockInstanceUrl = 'https://test.salesforce.com';

      const tree = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                value: 'This is just regular text with no IDs'
              }
            ]
          }
        ]
      };

      const plugin = remarkSalesforceLinks({ instanceUrl: mockInstanceUrl });
      plugin(tree);

      // The text node should remain unchanged
      expect(tree.children[0].children[0]).toEqual({
        type: 'text',
        value: 'This is just regular text with no IDs'
      });
    });

    it('should handle ID at the start of text', () => {
      const mockInstanceUrl = 'https://test.salesforce.com';
      mockIsValidSalesforce18IdFast.mockReturnValue(true);

      const tree = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                value: '001xx000003DHP0AAO is the record ID'
              }
            ]
          }
        ]
      };

      const plugin = remarkSalesforceLinks({ instanceUrl: mockInstanceUrl });
      plugin(tree);

      const paragraph = tree.children[0];
      expect(paragraph.children).toHaveLength(2);
      expect((paragraph.children[0] as any).type).toBe('link');
      expect((paragraph.children[0] as any).url).toContain('001xx000003DHP0AAO');
      expect((paragraph.children[1] as any).value).toBe(' is the record ID');
    });

    it('should handle ID at the end of text', () => {
      const mockInstanceUrl = 'https://test.salesforce.com';
      mockIsValidSalesforce18IdFast.mockReturnValue(true);

      const tree = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                value: 'The record ID is 001xx000003DHP0AAO'
              }
            ]
          }
        ]
      };

      const plugin = remarkSalesforceLinks({ instanceUrl: mockInstanceUrl });
      plugin(tree);

      const paragraph = tree.children[0];
      expect(paragraph.children).toHaveLength(2);
      expect((paragraph.children[0] as any).value).toBe('The record ID is ');
      expect((paragraph.children[1] as any).type).toBe('link');
      expect((paragraph.children[1] as any).url).toContain('001xx000003DHP0AAO');
    });

    it('should handle ID as the only content', () => {
      const mockInstanceUrl = 'https://test.salesforce.com';
      mockIsValidSalesforce18IdFast.mockReturnValue(true);

      const tree = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                value: '001xx000003DHP0AAO'
              }
            ]
          }
        ]
      };

      const plugin = remarkSalesforceLinks({ instanceUrl: mockInstanceUrl });
      plugin(tree);

      const paragraph = tree.children[0];
      expect(paragraph.children).toHaveLength(1);
      expect((paragraph.children[0] as any).type).toBe('link');
      expect((paragraph.children[0] as any).url).toContain('001xx000003DHP0AAO');
    });
  });

  describe('URL construction', () => {
    it('should construct correct Salesforce URLs', () => {
      const mockInstanceUrl = 'https://my-org.salesforce.com';
      const recordId = '001xx000003DHP0AAO';
      mockIsValidSalesforce18IdFast.mockReturnValue(true);

      const tree = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                value: `Record: ${recordId}`
              }
            ]
          }
        ]
      };

      const plugin = remarkSalesforceLinks({ instanceUrl: mockInstanceUrl });
      plugin(tree);

      const link = tree.children[0].children[1];
      expect((link as any).url).toBe(`${mockInstanceUrl}/${recordId}`);
    });

    it('should include title attribute in links', () => {
      const mockInstanceUrl = 'https://test.salesforce.com';
      const recordId = '001xx000003DHP0AAO';
      mockIsValidSalesforce18IdFast.mockReturnValue(true);

      const tree = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                value: `Record: ${recordId}`
              }
            ]
          }
        ]
      };

      const plugin = remarkSalesforceLinks({ instanceUrl: mockInstanceUrl });
      plugin(tree);

      const link = tree.children[0].children[1];
      expect((link as any).title).toBe(`View Salesforce record ${recordId}`);
    });
  });

  describe('validator integration', () => {
    it('should call the validator for each 18-char candidate', () => {
      const mockInstanceUrl = 'https://test.salesforce.com';
      mockIsValidSalesforce18IdFast.mockReturnValue(true);

      const tree = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                value: 'IDs: 001xx000003DHP0AAO and 006xx000004RZQ5AAO'
              }
            ]
          }
        ]
      };

      const plugin = remarkSalesforceLinks({ instanceUrl: mockInstanceUrl });
      plugin(tree);

      // Validator should be called at least twice
      expect(mockIsValidSalesforce18IdFast).toHaveBeenCalledTimes(2);
      expect(mockIsValidSalesforce18IdFast).toHaveBeenCalledWith('001xx000003DHP0AAO');
      expect(mockIsValidSalesforce18IdFast).toHaveBeenCalledWith('006xx000004RZQ5AAO');
    });

    it('should not call validator for non-18-char strings', () => {
      const mockInstanceUrl = 'https://test.salesforce.com';

      const tree = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                value: 'This is a short text'
              }
            ]
          }
        ]
      };

      const plugin = remarkSalesforceLinks({ instanceUrl: mockInstanceUrl });
      plugin(tree);

      expect(mockIsValidSalesforce18IdFast).not.toHaveBeenCalled();
    });
  });
});

/*
 * === remark-salesforce-links.test.ts ===
 * Updated: 2025-10-22 14:00
 * Summary: Comprehensive unit tests for the remarkSalesforceLinks plugin
 * Key Components:
 *   - Basic functionality tests: single/multiple IDs, validation failures
 *   - Edge case tests: code blocks, inline code, existing links, null URL
 *   - URL construction tests: correct format and title attributes
 *   - Validator integration tests: proper invocation and call counts
 * Dependencies:
 *   - Jest for testing framework
 *   - Mock of isValidSalesforce18IdFast validator
 * Version History:
 *   v1.0 – initial test suite with comprehensive coverage
 * Notes:
 *   - All edge cases from the plan are tested
 *   - Validator is mocked to test isolation
 *   - AST structure matches remark/mdast conventions
 */
