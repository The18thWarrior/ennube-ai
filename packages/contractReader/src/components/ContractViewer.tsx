// === components/ContractViewer.tsx ===
// Created: 2025-08-02 15:30
// Purpose: React component for displaying extracted contract data
// Exports:
//   - ContractViewer: Main component for contract data display
//   - ContractViewerProps: Component props interface
// Notes:
//   - Displays structured contract data in a user-friendly format

import React from 'react';
import { ContractData, ProcessingResult } from '../types/index.js';

/**
 * OVERVIEW
 * 
 * Contract Viewer component displays extracted contract data in a structured,
 * user-friendly format. Shows key contract information including dates,
 * parties, terms, and financial details.
 * 
 * Features:
 * - Structured data display with labeled fields
 * - Processing status and timing information
 * - Error display for failed extractions
 * - Responsive design for various screen sizes
 * 
 * Assumptions:
 * - Contract data follows the defined ContractData interface
 * - Some fields may be optional or missing
 * - Component is used within a React application
 * 
 * Future Improvements:
 * - Edit functionality for contract data
 * - Export options (PDF, CSV)
 * - Data validation indicators
 * - History of processing attempts
 */

export interface ContractViewerProps {
  result: ProcessingResult;
  title?: string;
  showRawText?: boolean;
  onRetry?: () => void;
  className?: string;
}

export const ContractViewer: React.FC<ContractViewerProps> = ({
  result,
  title = "Contract Information",
  showRawText = false,
  onRetry,
  className = "",
}) => {
  const { success, contractData, error, processingTimeMs, rawText } = result;

  return (
    <div className={`contract-viewer ${className}`}>
      <div className="contract-viewer__header">
        <h3 className="contract-viewer__title">{title}</h3>
        <div className="contract-viewer__status">
          <span className={`status-badge ${success ? 'status-success' : 'status-error'}`}>
            {success ? 'Success' : 'Failed'}
          </span>
          <span className="processing-time">
            Processed in {processingTimeMs}ms
          </span>
        </div>
      </div>

      {error && (
        <div className="contract-viewer__error">
          <p className="error-message">{error}</p>
          {onRetry && (
            <button onClick={onRetry} className="retry-button">
              Retry Processing
            </button>
          )}
        </div>
      )}

      {success && contractData && (
        <div className="contract-viewer__data">
          <ContractDataGrid data={contractData} />
        </div>
      )}

      {showRawText && rawText && (
        <div className="contract-viewer__raw-text">
          <h4>Raw Extracted Text</h4>
          <pre className="raw-text-content">{rawText}</pre>
        </div>
      )}
    </div>
  );
};

interface ContractDataGridProps {
  data: ContractData;
}

const ContractDataGrid: React.FC<ContractDataGridProps> = ({ data }) => {
  const fields = [
    { key: 'contractSummary', label: 'Summary', type: 'text' },
    { key: 'contractType', label: 'Type', type: 'text' },
    { key: 'contractStartDate', label: 'Start Date', type: 'date' },
    { key: 'contractEndDate', label: 'End Date', type: 'date' },
    { key: 'customer', label: 'Customer', type: 'text' },
    { key: 'customerAddress', label: 'Customer Address', type: 'address' },
    { key: 'contractTerms', label: 'Terms', type: 'text' },
    { key: 'productsSold', label: 'Products/Services', type: 'text' },
    { key: 'contractAmount', label: 'Amount', type: 'currency' },
    { key: 'subscription', label: 'Subscription', type: 'boolean' },
    { key: 'subscriptionProduct', label: 'Subscription Product', type: 'text' },
    { key: 'customerSignor', label: 'Customer Signatory', type: 'text' },
    { key: 'customerSignedDate', label: 'Customer Signed Date', type: 'date' },
    { key: 'companySignor', label: 'Company Signatory', type: 'text' },
    { key: 'companySignedDate', label: 'Company Signed Date', type: 'date' },
  ];

  const formatValue = (value: string | undefined, type: string): string => {
    if (!value) return 'Not specified';

    switch (type) {
      case 'date':
        // Try to format date if it looks like a date
        if (value.match(/\d{4}-\d{2}-\d{2}/)) {
          return new Date(value).toLocaleDateString();
        }
        return value;
      
      case 'currency':
        // Format currency if it looks like a number
        const numMatch = value.match(/[\d,]+\.?\d*/);
        if (numMatch) {
          const amount = parseFloat(numMatch[0].replace(/,/g, ''));
          if (!isNaN(amount)) {
            return `$${amount.toLocaleString()}`;
          }
        }
        return value;
      
      case 'boolean':
        const lower = value.toLowerCase();
        if (lower === 'yes' || lower === 'true' || lower === '1') {
          return 'Yes';
        } else if (lower === 'no' || lower === 'false' || lower === '0') {
          return 'No';
        }
        return value;
      
      case 'address':
        // Format multi-line addresses
        return value.replace(/,\s*/g, '\n');
      
      default:
        return value;
    }
  };

  return (
    <div className="contract-data-grid">
      {fields.map(({ key, label, type }) => {
        const value = data[key as keyof ContractData];
        const formattedValue = formatValue(value, type);
        const hasValue = value && value.trim() !== '';

        return (
          <div 
            key={key} 
            className={`data-field ${hasValue ? 'has-value' : 'no-value'}`}
          >
            <label className="field-label">{label}:</label>
            <div className={`field-value field-type-${type}`}>
              {type === 'address' ? (
                <pre className="address-content">{formattedValue}</pre>
              ) : (
                <span>{formattedValue}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// CSS-in-JS styles (could be moved to separate CSS file)
const styles = `
.contract-viewer {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  margin: 16px 0;
  background: #ffffff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.contract-viewer__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e0e0e0;
}

.contract-viewer__title {
  margin: 0;
  color: #333;
  font-size: 1.25rem;
  font-weight: 600;
}

.contract-viewer__status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-success {
  background: #e8f5e8;
  color: #2e7d2e;
}

.status-error {
  background: #ffeaea;
  color: #d63031;
}

.processing-time {
  font-size: 0.875rem;
  color: #666;
}

.contract-viewer__error {
  background: #ffeaea;
  border: 1px solid #d63031;
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 20px;
}

.error-message {
  color: #d63031;
  margin: 0 0 12px 0;
}

.retry-button {
  background: #d63031;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.retry-button:hover {
  background: #b71c1c;
}

.contract-data-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.data-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  font-weight: 600;
  color: #555;
  font-size: 0.875rem;
}

.field-value {
  padding: 8px 12px;
  border-radius: 4px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
}

.has-value .field-value {
  background: #ffffff;
  border-color: #dee2e6;
}

.no-value .field-value {
  color: #6c757d;
  font-style: italic;
}

.address-content {
  margin: 0;
  font-family: inherit;
  white-space: pre-line;
  word-break: break-word;
}

.contract-viewer__raw-text {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.contract-viewer__raw-text h4 {
  margin: 0 0 12px 0;
  color: #333;
}

.raw-text-content {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 12px;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 300px;
  overflow-y: auto;
  font-size: 0.875rem;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .contract-data-grid {
    grid-template-columns: 1fr;
  }
  
  .contract-viewer__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
`;

// Inject styles (in a real app, this would be in a CSS file)
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

/*
 * === components/ContractViewer.tsx ===
 * Updated: 2025-08-02 15:30
 * Summary: React component for displaying extracted contract data
 * Key Components:
 *   - ContractViewer: Main component with status and data display
 *   - ContractDataGrid: Structured data grid with formatting
 *   - Embedded CSS styles for consistent appearance
 *   - Responsive design for mobile devices
 * Dependencies:
 *   - Requires: React, ContractData types
 * Version History:
 *   v1.0 – initial contract viewer component
 * Notes:
 *   - Includes data formatting for dates, currency, addresses
 *   - Shows processing status and error handling
 */
