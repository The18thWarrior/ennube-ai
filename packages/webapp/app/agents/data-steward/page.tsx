'use client';

import DataStewardExecuteButton from '@/components/agents/data-steward/data-steward-execute-button';
import DataStewardHeader from '@/components/agents/data-steward/data-steward-header';
import UsageLogsList from '@/components/agents/usage-logs-list';
import { Button } from '@/components/ui';
import { nanoid } from 'nanoid';
import { useRouter } from 'next/navigation';
import { agents } from '@/resources/agent-defintion';

export default function DataStewardDashboard() {
  const router = useRouter();
  const openAgent = () => {
    const newId = nanoid();
    router.push(`/chat/${newId}?agent=${`data-steward`}`);
  }
  return (
    <div className="min-h-screen bg-popover ">
      <DataStewardHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-muted rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Data Steward Overview</h2>
            {/* Inline Data Steward Execute Button */}
            <div className={'flex space-x-2'}>
              <Button variant={'outline_green'} onClick={openAgent}>Chat with Agent</Button>
              <DataStewardExecuteButton />
            </div>
          </div>
          <p className="mb-4">
            The Data Steward agent keeps your CRM data clean, accurate, and up-to-date. 
            It automatically enriches contact information, removes duplicates, and ensures 
            data quality across your entire database.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
              <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Data Cleansing</h3>
              <p className="text-sm text-muted-foreground ">
                Automatically identifies and corrects inaccurate or incomplete data.
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
              <h3 className="font-medium text-purple-800 dark:text-purple-300 mb-2">Contact Enrichment</h3>
              <p className="text-sm text-muted-foreground ">
                Enhances contact records with additional information from reliable sources.
              </p>
            </div>
            <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg border border-pink-100 dark:border-pink-800">
              <h3 className="font-medium text-pink-800 dark:text-pink-300 mb-2">Duplicate Prevention</h3>
              <p className="text-sm text-muted-foreground ">
                Identifies and merges duplicate records to maintain a clean database.
              </p>
            </div>
          </div>
        </div>

        <UsageLogsList filter="DataSteward" />
      </div>
    </div>
  );
}
