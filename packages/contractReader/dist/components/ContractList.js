"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractList = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
// === components/ContractList.tsx ===
// Created: 2025-08-02 15:30
// Purpose: React component for displaying a list of contracts with processing actions
// Exports:
//   - ContractList: Component for contract list display and actions
//   - ContractListProps: Component props interface
// Notes:
//   - Integrates with Salesforce search and contract processing
const react_1 = require("react");
const ContractViewer_js_1 = require("./ContractViewer.js");
const SalesforceService_js_1 = require("../services/SalesforceService.js");
const ContractExtractionService_js_1 = require("../services/ContractExtractionService.js");
const ContractList = ({ salesforceConnection, className = "", onContractSelect, defaultFilters = {}, }) => {
    const [contracts, setContracts] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [searchTerm, setSearchTerm] = (0, react_1.useState)('');
    const [statusFilter, setStatusFilter] = (0, react_1.useState)(defaultFilters.status || '');
    const [processingState, setProcessingState] = (0, react_1.useState)({});
    const [error, setError] = (0, react_1.useState)(null);
    const salesforceService = new SalesforceService_js_1.SalesforceService(salesforceConnection);
    const extractionService = new ContractExtractionService_js_1.ContractExtractionService(salesforceConnection);
    // Load contracts on component mount and filter changes
    (0, react_1.useEffect)(() => {
        loadContracts();
    }, [searchTerm, statusFilter]);
    const loadContracts = async () => {
        setLoading(true);
        setError(null);
        try {
            const searchCriteria = {
                name: searchTerm || undefined,
                status: statusFilter || undefined,
                limit: 50,
            };
            const contractRecords = await salesforceService.searchContracts(searchCriteria);
            setContracts(contractRecords);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load contracts');
        }
        finally {
            setLoading(false);
        }
    };
    const processContract = async (contractId) => {
        setProcessingState(prev => ({
            ...prev,
            [contractId]: { isProcessing: true }
        }));
        try {
            const results = await extractionService.extractFromSalesforce(contractId, {
                includeRawText: false,
                extractTables: true,
            });
            setProcessingState(prev => ({
                ...prev,
                [contractId]: {
                    isProcessing: false,
                    results,
                }
            }));
            if (onContractSelect) {
                onContractSelect(contractId);
            }
        }
        catch (err) {
            setProcessingState(prev => ({
                ...prev,
                [contractId]: {
                    isProcessing: false,
                    error: err instanceof Error ? err.message : 'Processing failed',
                }
            }));
        }
    };
    const clearResults = (contractId) => {
        setProcessingState(prev => {
            const newState = { ...prev };
            delete newState[contractId];
            return newState;
        });
    };
    const formatDate = (dateString) => {
        if (!dateString)
            return 'Not set';
        return new Date(dateString).toLocaleDateString();
    };
    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'activated': return '#28a745';
            case 'draft': return '#ffc107';
            case 'expired': return '#dc3545';
            default: return '#6c757d';
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: `contract-list ${className}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "contract-list__header", children: [(0, jsx_runtime_1.jsx)("h2", { children: "Contract Documents" }), (0, jsx_runtime_1.jsxs)("div", { className: "search-filters", children: [(0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Search contracts...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "search-input" }), (0, jsx_runtime_1.jsxs)("select", { value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), className: "status-filter", children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "All Statuses" }), (0, jsx_runtime_1.jsx)("option", { value: "Activated", children: "Activated" }), (0, jsx_runtime_1.jsx)("option", { value: "Draft", children: "Draft" }), (0, jsx_runtime_1.jsx)("option", { value: "Expired", children: "Expired" })] }), (0, jsx_runtime_1.jsx)("button", { onClick: loadContracts, className: "refresh-button", children: "Refresh" })] })] }), error && ((0, jsx_runtime_1.jsxs)("div", { className: "error-banner", children: [(0, jsx_runtime_1.jsx)("p", { children: error }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setError(null), children: "\u00D7" })] })), loading && ((0, jsx_runtime_1.jsx)("div", { className: "loading-indicator", children: (0, jsx_runtime_1.jsx)("p", { children: "Loading contracts..." }) })), (0, jsx_runtime_1.jsx)("div", { className: "contracts-grid", children: contracts.map((contract) => {
                    const processing = processingState[contract.Id];
                    return ((0, jsx_runtime_1.jsxs)("div", { className: "contract-card", children: [(0, jsx_runtime_1.jsxs)("div", { className: "contract-card__header", children: [(0, jsx_runtime_1.jsx)("h3", { className: "contract-title", children: contract.Name }), (0, jsx_runtime_1.jsx)("span", { className: "contract-status", style: { color: getStatusColor(contract.Status) }, children: contract.Status })] }), (0, jsx_runtime_1.jsxs)("div", { className: "contract-details", children: [(0, jsx_runtime_1.jsxs)("p", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "Contract #:" }), " ", contract.ContractNumber] }), (0, jsx_runtime_1.jsxs)("p", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "Start Date:" }), " ", formatDate(contract.StartDate)] }), (0, jsx_runtime_1.jsxs)("p", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "End Date:" }), " ", formatDate(contract.EndDate)] }), (0, jsx_runtime_1.jsxs)("p", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "Created:" }), " ", formatDate(contract.CreatedDate)] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "contract-actions", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => processContract(contract.Id), disabled: processing?.isProcessing, className: "process-button", children: processing?.isProcessing ? 'Processing...' : 'Extract Contract Data' }), processing?.results && ((0, jsx_runtime_1.jsx)("button", { onClick: () => clearResults(contract.Id), className: "clear-button", children: "Clear Results" }))] }), processing?.error && ((0, jsx_runtime_1.jsx)("div", { className: "processing-error", children: (0, jsx_runtime_1.jsxs)("p", { children: ["Processing failed: ", processing.error] }) })), processing?.results && ((0, jsx_runtime_1.jsx)("div", { className: "processing-results", children: processing.results.map((result, index) => ((0, jsx_runtime_1.jsx)(ContractViewer_js_1.ContractViewer, { result: result, title: `Document ${index + 1}`, className: "embedded-viewer" }, index))) }))] }, contract.Id));
                }) }), contracts.length === 0 && !loading && ((0, jsx_runtime_1.jsxs)("div", { className: "empty-state", children: [(0, jsx_runtime_1.jsx)("p", { children: "No contracts found matching your criteria." }), (0, jsx_runtime_1.jsx)("button", { onClick: loadContracts, className: "retry-button", children: "Try Again" })] }))] }));
};
exports.ContractList = ContractList;
// CSS styles for the component
const listStyles = `
.contract-list {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.contract-list__header {
  margin-bottom: 24px;
}

.contract-list__header h2 {
  margin: 0 0 16px 0;
  color: #333;
}

.search-filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.search-input, .status-filter {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.search-input {
  flex: 1;
  min-width: 200px;
}

.refresh-button, .process-button, .clear-button, .retry-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.refresh-button {
  background: #007bff;
  color: white;
}

.process-button {
  background: #28a745;
  color: white;
}

.process-button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.clear-button {
  background: #ffc107;
  color: #000;
}

.retry-button {
  background: #dc3545;
  color: white;
}

.error-banner {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-banner button {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #721c24;
}

.loading-indicator {
  text-align: center;
  padding: 40px;
  color: #666;
}

.contracts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.contract-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.contract-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.contract-title {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
  flex: 1;
  margin-right: 12px;
}

.contract-status {
  font-weight: 600;
  font-size: 0.875rem;
  padding: 4px 8px;
  border-radius: 12px;
  background: rgba(0,0,0,0.1);
}

.contract-details {
  margin-bottom: 16px;
}

.contract-details p {
  margin: 4px 0;
  font-size: 0.875rem;
  color: #555;
}

.contract-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.processing-error {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
  padding: 12px;
  border-radius: 4px;
  margin-top: 12px;
}

.processing-results {
  margin-top: 16px;
  border-top: 1px solid #e0e0e0;
  padding-top: 16px;
}

.embedded-viewer {
  margin-bottom: 16px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-state p {
  margin-bottom: 16px;
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .contracts-grid {
    grid-template-columns: 1fr;
  }
  
  .search-filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .contract-card__header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .contract-status {
    margin-top: 8px;
    align-self: flex-start;
  }
}
`;
// Inject styles
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = listStyles;
    document.head.appendChild(styleSheet);
}
//# sourceMappingURL=ContractList.js.map