'use client';

import ProspectFinderExecuteButton from '@/components/agents/prospect-finder/prospect-finder-execute-button';
import ProspectFinderHeader from '@/components/agents/prospect-finder/prospect-finder-header';
import UsageLogsList from '@/components/agents/usage-logs-list';
import { CustomerProfileList } from '@/components/customer-profile/customer-profile-list';

export default function ProspectFinderDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ProspectFinderHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Prospect Finder Overview</h2>
            {/* Inline Prospect Finder Execute Button */}
            <ProspectFinderExecuteButton />
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            👋 Where in the world is your next customer? That's my job to find out. I'm your AI-powered, globe-trotting lead scout—sleuthing across the internet to uncover your dream clients.
          </p>

            <div className="mt-6 space-y-6 text-gray-600 dark:text-gray-400">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">🎯 What I Do (aka My Toolkit):</h3>
              <ul className="list-disc pl-5 space-y-2 mb-6 text-gray-600 dark:text-gray-400">
                <li>🧭 Craft and sharpen your Ideal Customer Profile (ICP)</li>
                <li>🛰️ Scan the web and dark corners of data to locate perfect-fit leads</li>
                <li>🕵️‍♀️ Qualify each contact using your exact criteria</li>
                <li>📅 Refresh my list every 30 days with performance-tuned updates</li>
                <li>💬 Sync with your team in Slack to capture frontline feedback</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">💼 How I Boost Your Sales Team:</h3>
              <p className="mb-6 text-gray-600 dark:text-gray-400">
                No more hours lost chasing dead ends. I deliver a steady stream of verified, high-potential leads—so
                your reps can zero in on the win 🏆.
              </p>
            </div>

          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
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
          </div> */}
        </div>
        <CustomerProfileList />  
        <UsageLogsList />
      </div>
    </div>
  );
}
