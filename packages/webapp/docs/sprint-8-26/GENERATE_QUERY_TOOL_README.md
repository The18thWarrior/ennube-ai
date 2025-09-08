# Generate Query Tool - Quick Reference

This package contains an AI-powered Generate Query Tool that produces SELECT-only SOQL queries from natural language descriptions.

Documentation location:

- `packages/webapp/docs/generate-query-tool.md`

Run tests (uses mocks):

```bash
pnpm --filter @ennube/webapp test
```

Notes:
- Unit tests mock heavy ESM dependencies to avoid Jest import-time errors.
- Integration tests should be run in an environment prepared for ESM modules.
