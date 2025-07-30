# @ennube-ai/data-validation

**Version:** 1.0.0

## Overview

A React component library and utilities for comparing records across multiple data sources and detecting anomalies at the property level.

Features:
- Automatic row matching by identifier
- Per-property anomaly detection (Same, Similar, Different)
- Single and multi-row comparison components
- Loading indicators and subtle animations
- Tailwind CSS based styling

## Installation

```bash
# Using npm
npm install @ennube-ai/data-validation

# Using yarn
yarn add @ennube-ai/data-validation
``` 

This package expects Tailwind CSS to be configured in your project. Import the styles entry if needed:

```css
/* In your main CSS or Tailwind entry */
@import '@ennube-ai/data-validation/dist/tailwind.css';
```

## Usage

### matchRows
```ts
import { matchRows } from '@ennube-ai/data-validation';

const salesforce = [{ id: 1, address: '123 A St.' }];
const netsuite = [{ id: 1, address: '123 A Street' }];
const groups = matchRows([salesforce, netsuite], 'id');
```

### detectAnomalies
```ts
import { detectAnomalies } from '@ennube-ai/data-validation';
const group = groups[0];
const results = detectAnomalies(group, 0.8);
```

### SingleRecordValidator
```tsx
import React from 'react';
import { SingleRecordValidator } from '@ennube-ai/data-validation';

const data1 = [{ id: 'A1', name: 'Alice Corp', address: '123 Main St.' }];
const data2 = [{ id: 'A1', name: 'Alice Corp', address: '123 Main Street' }];

<SingleRecordValidator
  sources={[data1, data2]}
  idKey="id"
  threshold={0.8}
/>
```

### MultiRowValidator
```tsx
import React from 'react';
import { MultiRowValidator } from '@ennube-ai/data-validation';

const sourceA = [{ id: 'A1', name: 'Alice' }, { id: 'B2', name: 'Bob' }];
const sourceB = [{ id: 'A1', name: 'Alice Corp' }, { id: 'B2', name: 'Bobby' }];

<MultiRowValidator
  sources={[sourceA, sourceB]}
  idKey="id"
  threshold={0.75}
/>
```

## Testing

```bash
npm test
```  

Tests are implemented with Jest and React Testing Library.

## Development

- Build: `npm run build`
- Test: `npm run test`

---

*Generated on 2025-07-19*
