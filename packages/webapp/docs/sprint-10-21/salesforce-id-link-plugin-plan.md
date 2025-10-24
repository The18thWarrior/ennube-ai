# Salesforce ID Auto-Linking Remark Plugin Plan

**Created:** 2025-10-22  
**Sprint:** 10-21  
**Status:** Planning  
**Complexity:** Medium  

---

## 📋 Overview

This document outlines the implementation plan for a custom remark plugin that will detect Salesforce 18-character IDs in markdown content rendered by Streamdown and automatically convert them into clickable links to the corresponding records in the user's Salesforce org.

### Purpose
Enable users to click on Salesforce IDs in AI chat responses to directly navigate to those records in their connected Salesforce instance, improving UX and reducing manual copy-paste workflows.

---

## 🎯 Requirements

### Functional Requirements
1. **Detect Salesforce IDs** in markdown text using the optimized `isValidSalesforce18IdFast` validator
2. **Wrap detected IDs** in anchor (`<a>`) tags with proper Salesforce record URLs
3. **Use instanceUrl** from the `useOnboardingStatus` hook to construct proper org-specific URLs
4. **Integrate seamlessly** with the existing Streamdown component without breaking other markdown features
5. **Handle edge cases** such as IDs in code blocks, inline code, or already-linked content

### Non-Functional Requirements
1. **Performance:** Must not significantly impact markdown rendering speed
2. **Accuracy:** Should only link valid 18-character Salesforce IDs (no false positives)
3. **Accessibility:** Links must have proper ARIA labels and semantic HTML
4. **Security:** URLs must be properly escaped and validated

---

## 🏗️ Architecture

### Components to Create

#### 1. **Remark Plugin: `remark-salesforce-links.ts`**
**Location:** `/packages/webapp/lib/remark-plugins/remark-salesforce-links.ts`

**Purpose:** A remark plugin that traverses the markdown AST and replaces Salesforce ID text nodes with link nodes.

**Key Responsibilities:**
- Import and use `isValidSalesforce18IdFast` from `@/lib/client-tools/salesforce`
- Accept `instanceUrl` as a plugin option
- Traverse text nodes in the markdown AST
- Detect 18-char Salesforce IDs using regex pattern + validation
- Replace text nodes with link nodes pointing to `{instanceUrl}/{salesforceId}`
- Preserve IDs inside code blocks/inline code (skip transformation)
- Handle multiple IDs in a single text node

**Technical Approach:**
```typescript
import { visit } from 'unist-util-visit';
import { isValidSalesforce18IdFast } from '@/lib/client-tools/salesforce';
import type { Plugin } from 'unified';
import type { Root, Text, Link, Parent } from 'mdast';

interface RemarkSalesforceLinksOptions {
  instanceUrl?: string | null;
}

export const remarkSalesforceLinks: Plugin<[RemarkSalesforceLinksOptions?], Root> = (options = {}) => {
  const { instanceUrl } = options;

  return (tree: Root) => {
    if (!instanceUrl) return; // Skip if no instance URL

    visit(tree, 'text', (node: Text, index, parent: Parent) => {
      // Skip if inside code/inlineCode
      if (parent?.type === 'code' || parent?.type === 'inlineCode') return;

      const text = node.value;
      const sfIdPattern = /\b[a-zA-Z0-9]{18}\b/g;
      const matches = [...text.matchAll(sfIdPattern)];

      if (matches.length === 0) return;

      // Build replacement nodes
      const newNodes: (Text | Link)[] = [];
      let lastIndex = 0;

      for (const match of matches) {
        const candidate = match[0];
        
        // Validate with fast checker
        if (!isValidSalesforce18IdFast(candidate)) continue;

        const matchIndex = match.index!;

        // Add text before match
        if (matchIndex > lastIndex) {
          newNodes.push({
            type: 'text',
            value: text.slice(lastIndex, matchIndex)
          });
        }

        // Add link node
        newNodes.push({
          type: 'link',
          url: `${instanceUrl}/${candidate}`,
          title: `View Salesforce record ${candidate}`,
          children: [{ type: 'text', value: candidate }]
        });

        lastIndex = matchIndex + candidate.length;
      }

      // Add remaining text
      if (lastIndex < text.length) {
        newNodes.push({
          type: 'text',
          value: text.slice(lastIndex)
        });
      }

      // Replace the text node with new nodes
      if (newNodes.length > 0 && parent && typeof index === 'number') {
        parent.children.splice(index, 1, ...newNodes);
      }
    });
  };
};
```

---

#### 2. **Updated Response Component**
**Location:** `/packages/webapp/components/ai-elements/response.tsx`

**Changes Required:**
- Import the new `remarkSalesforceLinks` plugin
- Pass `instanceUrl` from `useOnboardingStatus` to the plugin
- Add plugin to `remarkPlugins` array in Streamdown configuration

**Implementation:**
```typescript
import { remarkSalesforceLinks } from '@/lib/remark-plugins/remark-salesforce-links';

export const Response = memo(
  ({ className, ...props }: ResponseProps) => {
    const { theme } = useTheme();
    const { instanceUrl } = useOnboardingStatus();
    
    return (
      <Streamdown
        className={cn(
          "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
          className
        )}
        shikiTheme={theme === "lavender" ? ["github-dark", "github-dark"] : ["github-light", "github-dark"]}
        remarkPlugins={[
          [remarkGfm, {}],
          [remarkSalesforceLinks, { instanceUrl }]
        ]}
        {...props}
      />
    )
  },
  (prevProps, nextProps) => prevProps.children === nextProps.children
);
```

---

#### 3. **Link Styling (Optional Enhancement)**
**Location:** `/packages/webapp/app/globals.css` or component-specific CSS

**Purpose:** Add visual distinction for Salesforce record links

**Suggested Styles:**
```css
/* Salesforce ID links - distinctive styling */
a[href*="salesforce.com/"],
a[href*="lightning.force.com/"] {
  color: #0176d3; /* Salesforce brand blue */
  text-decoration: none;
  border-bottom: 1px dotted currentColor;
  transition: all 0.2s ease;
}

a[href*="salesforce.com/"]:hover,
a[href*="lightning.force.com/"]:hover {
  border-bottom-style: solid;
  opacity: 0.8;
}

/* Icon indicator (optional) */
a[href*="salesforce.com/"]::after {
  content: "↗";
  font-size: 0.75em;
  margin-left: 2px;
  opacity: 0.6;
}
```

---

## 📦 Dependencies

### Required NPM Packages
All required dependencies are already installed:
- ✅ `streamdown: ^1.1.4` (already in package.json)
- ✅ `remark-gfm: ^4.0.1` (already in package.json)
- ⚠️ **NEW:** `unist-util-visit: ^5.0.0` (required for AST traversal)

### Installation Command
```bash
pnpm add unist-util-visit
```

---

## 🔍 Edge Cases & Considerations

### Edge Cases to Handle

1. **IDs in Code Blocks**
   - **Issue:** Salesforce IDs inside fenced code blocks or inline code should NOT be linked
   - **Solution:** Check parent node type and skip transformation for `code` and `inlineCode` nodes

2. **Already-Linked IDs**
   - **Issue:** An ID that's already wrapped in a link shouldn't be double-wrapped
   - **Solution:** Check if parent is already a `link` node before transformation

3. **Partial Matches**
   - **Issue:** A 15-char ID or other alphanumeric string might match the pattern but fail validation
   - **Solution:** Use `isValidSalesforce18IdFast` to validate checksum before linking

4. **Multiple IDs in One Text Node**
   - **Issue:** "Contact 001xx000003DHP0AAO and Account 006xx000004RZQ5AAO"
   - **Solution:** Use regex with global flag and split text node into multiple child nodes

5. **No Instance URL**
   - **Issue:** User hasn't connected Salesforce yet (`instanceUrl` is null)
   - **Solution:** Plugin returns early without transformation when `instanceUrl` is falsy

6. **External Salesforce Orgs**
   - **Issue:** Link might point to wrong org if user has multiple Salesforce connections
   - **Solution:** Document limitation; future enhancement could support org-specific prefixes

7. **Performance with Large Responses**
   - **Issue:** Large markdown responses with many IDs could slow down rendering
   - **Solution:** Use efficient regex patterns and minimize AST modifications

---

## 🧪 Testing Strategy

### Unit Tests
**Location:** `/packages/webapp/tests/remark-salesforce-links.test.ts`

**Test Cases:**
```typescript
describe('remarkSalesforceLinks', () => {
  it('should detect and link valid 18-char Salesforce IDs', () => {
    // Test with valid ID
  });

  it('should NOT link invalid 18-char strings', () => {
    // Test with checksum-invalid ID
  });

  it('should handle multiple IDs in one text node', () => {
    // Test "ID1 and ID2"
  });

  it('should skip IDs in code blocks', () => {
    // Test ```code with ID``` 
  });

  it('should skip IDs in inline code', () => {
    // Test `ID here`
  });

  it('should handle no instanceUrl gracefully', () => {
    // Test with instanceUrl: null
  });

  it('should construct correct Salesforce URLs', () => {
    // Verify URL format
  });

  it('should preserve surrounding text', () => {
    // Test "before ID after"
  });
});
```

### Integration Tests
**Location:** `/packages/webapp/tests/components/response.test.tsx`

**Test Cases:**
- Render Response component with Salesforce IDs
- Verify links are created with correct href
- Verify onClick behavior (if applicable)
- Test with different themes (light/dark)

### Manual Testing Checklist
- [ ] ID in plain text → linked ✓
- [ ] ID in code block → NOT linked ✓
- [ ] ID in inline code → NOT linked ✓
- [ ] Multiple IDs in one paragraph → all linked ✓
- [ ] Invalid 18-char string → NOT linked ✓
- [ ] No instanceUrl → no transformation ✓
- [ ] Click link → opens Salesforce in new tab ✓
- [ ] Link styling matches design ✓

---

## 📁 File Structure

```
packages/webapp/
├── lib/
│   ├── client-tools/
│   │   └── salesforce.ts (existing - contains isValidSalesforce18IdFast)
│   └── remark-plugins/
│       ├── index.ts (new - barrel export)
│       └── remark-salesforce-links.ts (new - main plugin)
├── components/
│   └── ai-elements/
│       └── response.tsx (modified - add plugin)
├── tests/
│   ├── remark-salesforce-links.test.ts (new - unit tests)
│   └── components/
│       └── response.test.tsx (modified - integration tests)
└── docs/
    └── sprint-10-21/
        └── salesforce-id-link-plugin-plan.md (this file)
```

---

## ⏱️ Implementation Phases

### Phase 1: Core Plugin Development (Est. 3-4 hours)
**Tasks:**
1. Install `unist-util-visit` dependency
2. Create `/lib/remark-plugins/` directory structure
3. Implement `remark-salesforce-links.ts` plugin
4. Create barrel export in `index.ts`
5. Write unit tests for the plugin
6. Verify all edge cases are handled

**Deliverables:**
- ✅ Working remark plugin with full test coverage
- ✅ Documentation in code (JSDoc comments)

---

### Phase 2: Component Integration (Est. 1-2 hours)
**Tasks:**
1. Update `response.tsx` to import and use the plugin
2. Pass `instanceUrl` from `useOnboardingStatus` hook
3. Add plugin to `remarkPlugins` array
4. Write integration tests
5. Manual testing with live data

**Deliverables:**
- ✅ Updated Response component
- ✅ Integration tests passing
- ✅ Manual test results documented

---

### Phase 3: Styling & UX Polish (Est. 1-2 hours)
**Tasks:**
1. Add CSS styling for Salesforce links
2. Add external link icon indicator
3. Ensure accessibility (ARIA labels, keyboard nav)
4. Test across different themes (light/dark/lavender)
5. Test on different screen sizes

**Deliverables:**
- ✅ Polished link styling
- ✅ Accessible markup
- ✅ Cross-theme compatibility

---

### Phase 4: Documentation & Deployment (Est. 1 hour)
**Tasks:**
1. Update README or relevant docs
2. Add usage examples
3. Create changelog entry
4. Code review
5. Deploy to staging
6. Final QA testing

**Deliverables:**
- ✅ Documentation updated
- ✅ Code reviewed and merged
- ✅ Feature deployed

---

## 🎓 Technical Deep Dive

### How Remark Plugins Work

Remark plugins transform markdown abstract syntax trees (AST). The flow is:

```
Markdown Text 
  → Remark Parser 
  → AST (Abstract Syntax Tree)
  → Remark Plugins (transformations)
  → Modified AST
  → Rehype (HTML conversion)
  → React Components (via Streamdown)
```

Our plugin operates at the AST transformation stage, visiting `text` nodes and replacing them with `link` nodes when Salesforce IDs are detected.

### AST Node Structure

**Before transformation:**
```javascript
{
  type: 'text',
  value: 'Check record 001xx000003DHP0AAO for details'
}
```

**After transformation:**
```javascript
[
  { type: 'text', value: 'Check record ' },
  {
    type: 'link',
    url: 'https://my-org.salesforce.com/001xx000003DHP0AAO',
    title: 'View Salesforce record 001xx000003DHP0AAO',
    children: [{ type: 'text', value: '001xx000003DHP0AAO' }]
  },
  { type: 'text', value: ' for details' }
]
```

### Performance Optimization

1. **Early Return:** Skip processing if `instanceUrl` is null
2. **Efficient Regex:** Use word boundaries (`\b`) to avoid unnecessary matches
3. **Minimal Traversal:** Only visit `text` nodes (skip images, links, etc.)
4. **Fast Validation:** Use the optimized `isValidSalesforce18IdFast` function

---

## 🔒 Security Considerations

### URL Validation
- ✅ `instanceUrl` comes from authenticated API (`/api/salesforce/check-onboarding`)
- ✅ Salesforce ID format is strictly validated (18-char + checksum)
- ✅ URLs are constructed programmatically (no user input injection)

### XSS Prevention
- ✅ Remark/Rehype automatically escapes HTML in markdown
- ✅ Link URLs are validated before insertion
- ✅ No `dangerouslySetInnerHTML` used

### Content Security Policy (CSP)
- ⚠️ Ensure CSP allows external Salesforce domain navigation
- ⚠️ Add `salesforce.com` and `force.com` to allowed domains if using strict CSP

---

## 🚀 Future Enhancements

### Potential Improvements (Post-MVP)
1. **Hover Preview:** Show record details on hover (via Salesforce API)
2. **Custom Link Component:** Use Next.js Link or custom component with analytics
3. **Copy Button:** Add copy-to-clipboard button next to each ID
4. **Multi-Org Support:** Detect org prefix and link to correct instance
5. **Record Type Icons:** Show different icons for Account, Contact, Opportunity, etc.
6. **15-char ID Support:** Expand to also detect and convert 15-char IDs
7. **Batch Link Validation:** Verify links are accessible before rendering
8. **Caching:** Cache validated IDs to avoid re-checking on re-renders

---

## 📊 Success Metrics

### Acceptance Criteria
- ✅ Valid 18-char Salesforce IDs are automatically linked
- ✅ Links open correct records in user's Salesforce org
- ✅ No false positives (invalid strings are NOT linked)
- ✅ Code blocks and inline code are NOT affected
- ✅ Performance impact is negligible (<50ms for typical responses)
- ✅ All unit and integration tests pass
- ✅ Accessibility audit passes (WCAG 2.1 AA)

### Performance Targets
- **Rendering Time:** <50ms overhead for 100 IDs in a response
- **Accuracy:** 100% precision (no false positives)
- **Recall:** >99% (catches all valid IDs not in code blocks)

---

## 🔗 References

### Documentation Links
- [Remark Plugin Authoring](https://github.com/remarkjs/remark/blob/main/doc/plugins.md)
- [unist-util-visit](https://github.com/syntax-tree/unist-util-visit)
- [MDAST Specification](https://github.com/syntax-tree/mdast)
- [Streamdown Documentation](https://github.com/streamdown/streamdown)

### Related Files
- `/packages/webapp/lib/client-tools/salesforce.ts` - Contains `isValidSalesforce18IdFast`
- `/packages/webapp/components/ai-elements/response.tsx` - Streamdown wrapper component
- `/packages/webapp/hooks/useOnboardingStatus.tsx` - Provides `instanceUrl`

---

## 📝 Implementation Checklist

### Pre-Implementation
- [ ] Review this plan with team
- [ ] Confirm design/UX requirements
- [ ] Verify technical approach with senior dev
- [ ] Get approval to proceed

### Development
- [ ] Install `unist-util-visit` dependency
- [ ] Create plugin directory structure
- [ ] Implement core plugin logic
- [ ] Write comprehensive unit tests
- [ ] Update Response component
- [ ] Write integration tests
- [ ] Add CSS styling
- [ ] Perform manual testing

### Quality Assurance
- [ ] All tests pass (unit + integration)
- [ ] Code review completed
- [ ] Accessibility audit passed
- [ ] Performance benchmarks met
- [ ] Cross-browser testing complete

### Documentation
- [ ] Add JSDoc comments to plugin
- [ ] Update component documentation
- [ ] Add usage examples
- [ ] Update changelog

### Deployment
- [ ] Deploy to staging environment
- [ ] QA testing on staging
- [ ] Deploy to production
- [ ] Monitor for errors
- [ ] Gather user feedback

---

## 💡 Notes & Assumptions

### Assumptions
1. `instanceUrl` format is always `https://[subdomain].salesforce.com` or `https://[subdomain].lightning.force.com`
2. Users only need links to their primary connected Salesforce org
3. External link icon is acceptable UX (can be disabled per design feedback)
4. Salesforce IDs in code examples should NOT be linked (technical docs)
5. Performance overhead <50ms is acceptable for UX

### Known Limitations
1. Cannot link to records in orgs other than the user's primary connection
2. Cannot validate if a record actually exists (would require API call)
3. Cannot determine record type from ID alone (all IDs use generic URL)
4. 15-character IDs are not supported (only 18-char IDs)

### Risks & Mitigations
| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| False positives link invalid IDs | Medium | Low | Use strict `isValidSalesforce18IdFast` validation |
| Performance degradation | High | Low | Optimize regex, early returns, profiling |
| Breaking existing markdown | High | Low | Comprehensive testing, preserve existing plugins |
| instanceUrl changes mid-session | Medium | Medium | Re-render on instanceUrl change (React memo) |

---

## ✅ Sign-Off

**Prepared By:** Nemo (AI Assistant)  
**Reviewed By:** _[Pending]_  
**Approved By:** _[Pending]_  
**Approval Date:** _[Pending]_  

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-22  
**Status:** Ready for Review  

---

