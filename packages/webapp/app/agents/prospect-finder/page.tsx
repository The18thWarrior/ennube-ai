'use client';

import ProspectFinderExecuteButton from '@/components/agents/prospect-finder/prospect-finder-execute-button';
import ProspectFinderHeader from '@/components/agents/prospect-finder/prospect-finder-header';
import UsageLogsList from '@/components/agents/usage-logs-list';
import { CustomerProfileList } from '@/components/customer-profile/customer-profile-list';
import { Button } from '@/components/ui';
import { nanoid } from 'nanoid';
import { useRouter } from 'next/navigation';

export default function ProspectFinderDashboard() {
  const router = useRouter();
  const openAgent = () => {
    const newId = nanoid();
    router.push(`/chat/${newId}?agent=${`contract-reader`}`);
  }
  return (
    <div className="min-h-screen bg-popover ">
      <ProspectFinderHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-muted rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Prospect Finder Overview</h2>
            {/* Inline Prospect Finder Execute Button */}

            <div className={'flex space-x-2'}>
              <Button variant={'outline_green'} onClick={openAgent}>Chat with Agent</Button>
              <ProspectFinderExecuteButton />
            </div>
          </div>
          <p className="mb-4">
            👋 Where in the world is your next customer? That's my job to find out. I'm your AI-powered, globe-trotting lead scout—sleuthing across the internet to uncover your dream clients.
          </p>

            <div className="mt-6">
              <h3 className="text-xl font-semibold  mb-4">🎯 What I Do (aka My Toolkit):</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-popover p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                  <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">ICP Crafting</h3>
                  <p className="text-sm">
                    Crafts and sharpens your Ideal Customer Profile (ICP) to target the right prospects for your business.
                  </p>
                </div>
                <div className="bg-popover p-4 rounded-lg border border-purple-100 dark:border-purple-800">
                  <h3 className="font-medium text-purple-800 dark:text-purple-300 mb-2">Lead Discovery</h3>
                  <p className="text-sm">
                    Scans the web and hidden data sources to locate perfect-fit leads, qualifying each contact using your exact criteria.
                  </p>
                </div>
                <div className="bg-popover p-4 rounded-lg border border-pink-100 dark:border-pink-800">
                  <h3 className="font-medium text-pink-800 dark:text-pink-300 mb-2">Automated Refresh & Team Sync</h3>
                  <p className="text-sm">
                    Refreshes your lead list every 30 days and syncs with your team in Slack to capture frontline feedback.
                  </p>
                </div>
              </div>
              <h3 className="text-xl font-semibold mt-8">💼 How I Boost Your Sales Team:</h3>
              <p className="mb-6">
                No more hours lost chasing dead ends. I deliver a steady stream of verified, high-potential leads—so
                your reps can zero in on the win 🏆.
              </p>
            </div>

          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
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
          </div> */}
        </div>
        <CustomerProfileList />
        <UsageLogsList filter="ProspectFinder" />
      </div>
    </div>
  );
}
