# Bulk Data Load Tool - Version Comparison

## Overview

This document compares the two versions of the bulk data load field mapping tool and explains when to use each version.

---

## `bulkDataLoadTool` (v1)

### What It Does

The original `bulkDataLoadTool` is an AI-powered intelligent field mapping tool that maps CSV column headers to Salesforce object fields for bulk data loading operations.

### Key Features

1. **Header-Based Mapping**: Takes a comma-separated string of CSV headers as input
2. **External File Processing**: Expects CSV data to be processed externally, only receives headers
3. **Schema Analysis**: Loads Salesforce schema from stored GraphDatabase JSON
4. **AI-Powered Matching**: Uses language models to intelligently match CSV fields to Salesforce fields
5. **Selective Mapping**: Only returns confident matches, filters out unmappable fields

### Input Parameters

```typescript
{
  sobject: string;        // e.g., "Account", "Contact"
  dmlOperation: string;   // "insert", "update", "upsert", "delete"
  headers: string;        // Comma-separated: "First Name,Last Name,Email"
  fileUrl: string;        // URL where CSV file is stored
}
```

### Output

```typescript
{
  sobject: string;
  mappings: Array<FieldMapping>;
  fileUrl: string;
  dmlOperation: string;
  metadata: {
    totalCsvHeaders: number;
    successfulMappings: number;
    unmappedHeaders: string[];
  }
}
```

### Use Cases

- CSV files are already uploaded to external storage (S3, Blob storage, etc.)
- Headers are known in advance
- Need to map fields before processing the actual CSV data
- Separation of concerns: field mapping vs. data processing

### Architecture Flow

```
User provides headers string
    ↓
Load Salesforce schema from GraphDB
    ↓
AI generates field mappings
    ↓
Return mappings + metadata
    ↓
(CSV processing happens separately)
```

---

## `bulkDataLoadTool_v2` (v2)

### What It Does

The enhanced version processes CSV files **directly from message attachments** and generates field mappings in a single operation. It combines CSV parsing, type inference, and field mapping into one comprehensive tool.

### Key Features

1. **Inline File Processing**: Automatically detects and processes CSV attachments from chat messages
2. **Multiple Format Support**: Handles data URLs, base64, signed URLs, ArrayBuffer, Uint8Array
3. **Type Inference**: Automatically infers data types (number, boolean, date, string) from CSV data
4. **Sample Data Return**: Includes sample rows for user validation
5. **Size Validation**: Enforces 12MB file size limit
6. **Native CSV Parsing**: Custom CSV parser with quote handling (no external dependencies)
7. **Type-Aware Mapping**: Uses inferred types to improve mapping accuracy

### Input Parameters

```typescript
{
  sobject: string;              // e.g., "Account", "Contact"
  dmlOperation: string;         // "insert", "update", "upsert", "delete"
  hasHeader: boolean;           // Default: true
  expectedColumns?: string[];   // Optional validation
  returnSample: number;         // Number of sample rows (0-50)
}
```

### Output

```typescript
{
  ok: boolean;
  sobject: string;
  mappings: Array<FieldMapping>;
  dmlOperation: string;
  csvInfo: {
    filename: string;
    totalRows: number;
    columns: string[];
    types: Record<string, 'number' | 'boolean' | 'date' | 'string'>;
    sample: Array<Record<string, any>>;
  };
  metadata: {
    totalCsvHeaders: number;
    successfulMappings: number;
    unmappedHeaders: string[];
    fileSizeBytes: number;
  }
}
```

### Use Cases

- Chat-based CSV upload and processing workflows
- No external file storage required
- Need immediate validation and preview of CSV data
- Type-aware field mapping for better accuracy
- All-in-one operation: upload → parse → analyze → map

### Architecture Flow

```
User attaches CSV to chat message
    ↓
Tool detects CSV in message history
    ↓
Load and validate file (size, format)
    ↓
Parse CSV with header detection
    ↓
Infer column data types
    ↓
Load Salesforce schema from GraphDB
    ↓
AI generates type-aware field mappings
    ↓
Return mappings + CSV info + sample data
```

---

## Comparison Table

| Feature | v1 (bulkDataLoadTool) | v2 (bulkDataLoadTool_v2) |
|---------|----------------------|--------------------------|
| **CSV Input** | Headers string only | Full CSV file attachment |
| **File Processing** | External | Inline (from messages) |
| **File Formats** | N/A | Data URL, base64, signed URL, buffer |
| **Type Inference** | ❌ No | ✅ Yes |
| **Sample Data** | ❌ No | ✅ Yes (configurable) |
| **Size Validation** | ❌ No | ✅ Yes (12MB limit) |
| **Header Detection** | ❌ Manual | ✅ Automatic |
| **Expected Columns** | ❌ No | ✅ Optional validation |
| **Dependencies** | None | None (native parser) |
| **CSV Parser** | N/A | Custom native implementation |
| **Error Handling** | Throws errors | Returns `{ok: false, error}` |
| **File Storage** | Required (external) | Not required |
| **Use Context** | API endpoints | Chat interface |
| **Metadata** | Basic | Comprehensive |

---

## When to Use Each Version

### Use `bulkDataLoadTool` (v1) When:

- ✅ CSV files are stored externally (S3, Azure Blob, etc.)
- ✅ Building traditional REST API endpoints
- ✅ Headers are known/extracted separately
- ✅ Need to separate field mapping from data processing
- ✅ Working with very large files (>12MB)
- ✅ CSV processing happens in a separate service/workflow

### Use `bulkDataLoadTool_v2` (v2) When:

- ✅ Building chat-based interfaces with file uploads
- ✅ Need all-in-one CSV processing
- ✅ Want to preview/validate CSV data before processing
- ✅ Files are under 12MB
- ✅ No external file storage available
- ✅ Need type inference for better mapping accuracy
- ✅ Want to provide sample data to users for validation
- ✅ Building conversational AI workflows

---

## Technical Implementation Details

### v1 Implementation Highlights

```typescript
// Simple input
const mappings = await bulkDataLoadTool.execute({
  sobject: "Account",
  dmlOperation: "insert",
  headers: "Company Name,Phone,Website",
  fileUrl: "https://storage.example.com/file.csv"
});
```

**Pros:**
- Lightweight and focused
- Clear separation of concerns
- Works with any file storage solution

**Cons:**
- Requires external CSV parsing
- No built-in validation
- No type awareness

### v2 Implementation Highlights

```typescript
// File is already in message context
const result = await bulkDataLoadTool_v2.execute({
  sobject: "Account",
  dmlOperation: "insert",
  hasHeader: true,
  returnSample: 5
}, { messages }); // Messages contain file attachment

if (result.ok) {
  // result.csvInfo.sample contains preview data
  // result.mappings contains AI-generated mappings
  // result.csvInfo.types contains inferred types
}
```

**Pros:**
- All-in-one processing
- Type inference improves mapping accuracy
- Sample data for validation
- No external storage needed
- Better error handling

**Cons:**
- 12MB file size limit
- More complex implementation
- Tightly coupled to message context

---

## Migration Guide

### From v1 to v2

If you want to migrate from v1 to v2:

1. **Remove external file storage** (if no longer needed)
2. **Update tool registration** to use v2
3. **Remove manual CSV parsing** logic
4. **Update input parameters** (remove `fileUrl`, `headers`)
5. **Handle new response format** (includes `csvInfo`)

Example:

```typescript
// v1
const headers = extractHeadersFromCsv(csvFile);
const result = await bulkDataLoadTool.execute({
  sobject: "Contact",
  dmlOperation: "insert",
  headers: headers.join(','),
  fileUrl: uploadedUrl
});

// v2
const result = await bulkDataLoadTool_v2.execute({
  sobject: "Contact",
  dmlOperation: "insert",
  hasHeader: true,
  returnSample: 5
}, { messages }); // File in messages

if (result.ok) {
  console.log('Columns:', result.csvInfo.columns);
  console.log('Types:', result.csvInfo.types);
  console.log('Sample:', result.csvInfo.sample);
}
```

---

## Performance Considerations

### v1 Performance Profile

- **Memory**: Low (only headers processed)
- **Processing Time**: Fast (no CSV parsing)
- **Network**: Requires external file fetch (separate)
- **Scalability**: Excellent (stateless, minimal processing)

### v2 Performance Profile

- **Memory**: Moderate (full CSV in memory, max 12MB)
- **Processing Time**: Moderate (includes parsing + type inference)
- **Network**: Good (file already in message context)
- **Scalability**: Good (limited by file size cap)

---

## Security Considerations

### v1 Security

- ✅ No file content exposure (headers only)
- ✅ External file access control (managed separately)
- ⚠️ File URL must be validated
- ⚠️ No built-in size limits

### v2 Security

- ✅ File size validation (12MB limit)
- ✅ Content inspection before processing
- ✅ No external URL vulnerabilities
- ✅ File format validation
- ⚠️ File content stored in message context
- ⚠️ Memory consumption for large files

---

## Future Enhancements

### Potential v3 Features

- **Streaming CSV Processing**: Handle files >12MB with streaming
- **Advanced Type Detection**: Better date format detection, custom types
- **Mapping Templates**: Save and reuse common mappings
- **Data Transformation**: Built-in data cleaning/transformation rules
- **Batch Processing**: Process multiple files simultaneously
- **Excel Support**: Extend to .xlsx/.xls formats
- **Validation Rules**: Field-level validation before import
- **Rollback Support**: Transaction management for bulk operations
- **Progress Tracking**: Real-time progress updates for large files
- **Error Recovery**: Partial import with error reporting

---

## Conclusion

Both versions serve distinct purposes:

- **v1** is ideal for **traditional API workflows** with external storage
- **v2** is perfect for **conversational AI interfaces** with inline processing

Choose based on your architecture, use case, and file size requirements. In many cases, you may want to support **both versions** to handle different scenarios.

---

## Questions or Issues?

See the main documentation or contact the development team for support.
