// === components/ContractList.tsx ===
// Created: 2025-08-02 15:30
// Purpose: React component for displaying a list of contracts with processing actions
// Exports:
//   - ContractList: Component for contract list display and actions
//   - ContractListProps: Component props interface
// Notes:
//   - Integrates with Salesforce search and contract processing

import React, { useState, useEffect } from 'react';
import { Connection } from 'jsforce';
import { ContractViewer } from './ContractViewer.js';
import { SalesforceService } from '../services/SalesforceService.js';
import { ContractExtractionService } from '../services/ContractExtractionService.js';
import { ProcessingResult } from '../types/index.js';

/**
 * OVERVIEW
 * 
 * Contract List component provides a user interface for:
 * - Searching contracts in Salesforce
 * - Displaying contract metadata
 * - Triggering contract document processing
 * - Showing processing results
 * 
 * Features:
 * - Contract search with filters
 * - Batch processing capabilities
 * - Real-time processing status
 * - Results display with ContractViewer
 * 
 * Assumptions:
 * - Salesforce connection is provided and authenticated
 * - User has proper permissions to access contracts
 * - Processing services are configured correctly
 * 
 * Future Improvements:
 * - Pagination for large contract lists
 * - Advanced filtering options
 * - Export functionality for results
 * - Processing queue management
 */

export interface ContractListProps {
  salesforceConnection: Connection;
  className?: string;
  onContractSelect?: (contractId: string) => void;
  defaultFilters?: {
    status?: string;
    dateRange?: { start: Date; end: Date };
  };
}

interface ContractRecord {
  Id: string;
  Name: string;
  ContractNumber: string;
  Status: string;
  StartDate: string;
  EndDate: string;
  AccountId: string;
  CreatedDate: string;
}

interface ProcessingState {
  [contractId: string]: {
    isProcessing: boolean;
    results?: ProcessingResult[];
    error?: string;
  };
}

export const ContractList: React.FC<ContractListProps> = ({
  salesforceConnection,
  className = "",
  onContractSelect,
  defaultFilters = {},
}) => {
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(defaultFilters.status || '');
  const [processingState, setProcessingState] = useState<ProcessingState>({});
  const [error, setError] = useState<string | null>(null);

  const salesforceService = new SalesforceService(salesforceConnection);
  const extractionService = new ContractExtractionService(salesforceConnection);

  // Load contracts on component mount and filter changes
  useEffect(() => {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  const processContract = async (contractId: string) => {
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
    } catch (err) {
      setProcessingState(prev => ({
        ...prev,
        [contractId]: {
          isProcessing: false,
          error: err instanceof Error ? err.message : 'Processing failed',
        }
      }));
    }
  };

  const clearResults = (contractId: string) => {
    setProcessingState(prev => {
      const newState = { ...prev };
      delete newState[contractId];
      return newState;
    });
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'activated': return '#28a745';
      case 'draft': return '#ffc107';
      case 'expired': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div className={`contract-list ${className}`}>
      <div className="contract-list__header">
        <h2>Contract Documents</h2>
        
        <div className="search-filters">
          <input
            type="text"
            placeholder="Search contracts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="">All Statuses</option>
            <option value="Activated">Activated</option>
            <option value="Draft">Draft</option>
            <option value="Expired">Expired</option>
          </select>
          
          <button onClick={loadContracts} className="refresh-button">
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {loading && (
        <div className="loading-indicator">
          <p>Loading contracts...</p>
        </div>
      )}

      <div className="contracts-grid">
        {contracts.map((contract) => {
          const processing = processingState[contract.Id];
          
          return (
            <div key={contract.Id} className="contract-card">
              <div className="contract-card__header">
                <h3 className="contract-title">{contract.Name}</h3>
                <span 
                  className="contract-status"
                  style={{ color: getStatusColor(contract.Status) }}
                >
                  {contract.Status}
                </span>
              </div>

              <div className="contract-details">
                <p><strong>Contract #:</strong> {contract.ContractNumber}</p>
                <p><strong>Start Date:</strong> {formatDate(contract.StartDate)}</p>
                <p><strong>End Date:</strong> {formatDate(contract.EndDate)}</p>
                <p><strong>Created:</strong> {formatDate(contract.CreatedDate)}</p>
              </div>

              <div className="contract-actions">
                <button
                  onClick={() => processContract(contract.Id)}
                  disabled={processing?.isProcessing}
                  className="process-button"
                >
                  {processing?.isProcessing ? 'Processing...' : 'Extract Contract Data'}
                </button>

                {processing?.results && (
                  <button
                    onClick={() => clearResults(contract.Id)}
                    className="clear-button"
                  >
                    Clear Results
                  </button>
                )}
              </div>

              {processing?.error && (
                <div className="processing-error">
                  <p>Processing failed: {processing.error}</p>
                </div>
              )}

              {processing?.results && (
                <div className="processing-results">
                  {processing.results.map((result, index) => (
                    <ContractViewer
                      key={index}
                      result={result}
                      title={`Document ${index + 1}`}
                      className="embedded-viewer"
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {contracts.length === 0 && !loading && (
        <div className="empty-state">
          <p>No contracts found matching your criteria.</p>
          <button onClick={loadContracts} className="retry-button">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

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

/*
 * === components/ContractList.tsx ===
 * Updated: 2025-08-02 15:30
 * Summary: React component for contract list display and processing
 * Key Components:
 *   - ContractList: Main component with search and processing
 *   - Contract search with filtering capabilities
 *   - Processing state management and results display
 *   - Integration with ContractViewer for results
 * Dependencies:
 *   - Requires: React, jsforce, SalesforceService, ContractExtractionService
 * Version History:
 *   v1.0 – initial contract list component
 * Notes:
 *   - Provides complete UI for contract document processing
 *   - Handles loading states and error conditions
 */
