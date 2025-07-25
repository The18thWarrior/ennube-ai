'use client';

import DataStewardExecuteButton from '@/components/agents/data-steward/data-steward-execute-button';
import DataStewardHeader from '@/components/agents/data-steward/data-steward-header';
import UsageLogsList from '@/components/agents/usage-logs-list';

export default function DataStewardDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DataStewardHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Data Steward Overview</h2>
            {/* Inline Data Steward Execute Button */}
            <DataStewardExecuteButton />
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            The Data Steward agent keeps your CRM data clean, accurate, and up-to-date. 
            It automatically enriches contact information, removes duplicates, and ensures 
            data quality across your entire database.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
              <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Data Cleansing</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatically identifies and corrects inaccurate or incomplete data.
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
              <h3 className="font-medium text-purple-800 dark:text-purple-300 mb-2">Contact Enrichment</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enhances contact records with additional information from reliable sources.
              </p>
            </div>
            <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg border border-pink-100 dark:border-pink-800">
              <h3 className="font-medium text-pink-800 dark:text-pink-300 mb-2">Duplicate Prevention</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Identifies and merges duplicate records to maintain a clean database.
              </p>
            </div>
          </div>
        </div>
        
        <UsageLogsList />
      </div>
    </div>
  );
}
