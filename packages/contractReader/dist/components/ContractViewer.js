"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractViewer = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const ContractViewer = ({ result, title = "Contract Information", showRawText = false, onRetry, className = "", }) => {
    const { success, contractData, error, processingTimeMs, rawText } = result;
    return ((0, jsx_runtime_1.jsxs)("div", { className: `contract-viewer ${className}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "contract-viewer__header", children: [(0, jsx_runtime_1.jsx)("h3", { className: "contract-viewer__title", children: title }), (0, jsx_runtime_1.jsxs)("div", { className: "contract-viewer__status", children: [(0, jsx_runtime_1.jsx)("span", { className: `status-badge ${success ? 'status-success' : 'status-error'}`, children: success ? 'Success' : 'Failed' }), (0, jsx_runtime_1.jsxs)("span", { className: "processing-time", children: ["Processed in ", processingTimeMs, "ms"] })] })] }), error && ((0, jsx_runtime_1.jsxs)("div", { className: "contract-viewer__error", children: [(0, jsx_runtime_1.jsx)("p", { className: "error-message", children: error }), onRetry && ((0, jsx_runtime_1.jsx)("button", { onClick: onRetry, className: "retry-button", children: "Retry Processing" }))] })), success && contractData && ((0, jsx_runtime_1.jsx)("div", { className: "contract-viewer__data", children: (0, jsx_runtime_1.jsx)(ContractDataGrid, { data: contractData }) })), showRawText && rawText && ((0, jsx_runtime_1.jsxs)("div", { className: "contract-viewer__raw-text", children: [(0, jsx_runtime_1.jsx)("h4", { children: "Raw Extracted Text" }), (0, jsx_runtime_1.jsx)("pre", { className: "raw-text-content", children: rawText })] }))] }));
};
exports.ContractViewer = ContractViewer;
const ContractDataGrid = ({ data }) => {
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
    const formatValue = (value, type) => {
        if (!value)
            return 'Not specified';
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
                }
                else if (lower === 'no' || lower === 'false' || lower === '0') {
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
    return ((0, jsx_runtime_1.jsx)("div", { className: "contract-data-grid", children: fields.map(({ key, label, type }) => {
            const value = data[key];
            const formattedValue = formatValue(value, type);
            const hasValue = value && value.trim() !== '';
            return ((0, jsx_runtime_1.jsxs)("div", { className: `data-field ${hasValue ? 'has-value' : 'no-value'}`, children: [(0, jsx_runtime_1.jsxs)("label", { className: "field-label", children: [label, ":"] }), (0, jsx_runtime_1.jsx)("div", { className: `field-value field-type-${type}`, children: type === 'address' ? ((0, jsx_runtime_1.jsx)("pre", { className: "address-content", children: formattedValue })) : ((0, jsx_runtime_1.jsx)("span", { children: formattedValue })) })] }, key));
        }) }));
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
//# sourceMappingURL=ContractViewer.js.map