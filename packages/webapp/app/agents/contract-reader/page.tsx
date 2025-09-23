'use client';

import Image from 'next/image';
import UsageLogsList from '@/components/agents/usage-logs-list';
import { ContractResultList } from '@/components/contract-result/contract-result-list';
import { AgentProfileHeader } from '@/components/agents/agent-profile-header';
import ContractReaderExecuteButton from '@/components/agents/contract-reader/contract-reader-execute-button';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
import { Button } from '@/components/ui';

export default function ContractReaderDashboard() {
  const router = useRouter();
  const openAgent = () => {
    const newId = nanoid();
    router.push(`/chat/${newId}?agent=${`contract-reader`}`);
  }
  return (
    <div className="min-h-screen bg-popover ">
      <AgentProfileHeader
              name={"Contract Reader"}
              tagline="I'm your AI contract assistant"
              imageSrc={"/contracts-reader.png"}
              hasImage={true}
              status="Online Now"
              onImageClick={() => {}}
            />
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Contract Reader Overview</h2>
                {/* Inline Prospect Finder Execute Button */}
                <div className={'flex space-x-2'}>
                  <Button variant={'outline_green'} onClick={openAgent}>Chat with Agent</Button>
                  <ContractReaderExecuteButton />
                </div>
            </div>
          <p className="mb-4">
            📄 <span className={"ml-2"}></span> I'm your AI contract assistant. I help your business stay compliant, your CRM stay updated, and your contracts stay organized. With me on your team, your agreements are no longer buried—they're live, accurate, and ready to act on.
          </p>
          <div className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Contract Extraction</h3>
                <p className="text-sm text-muted-foreground ">
                  Reads and extracts terms from contracts (PDFs, Word Docs, scanned files), including start/end dates, renewal terms, and SLAs.
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
                <h3 className="font-medium text-purple-800 dark:text-purple-300 mb-2">CRM Sync & Validation</h3>
                <p className="text-sm text-muted-foreground ">
                  Flags mismatches between signed agreements and CRM records, and keeps your CRM current by updating fields automatically.
                </p>
              </div>
              <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg border border-pink-100 dark:border-pink-800">
                <h3 className="font-medium text-pink-800 dark:text-pink-300 mb-2">Review & Cross-Reference</h3>
                <p className="text-sm text-muted-foreground ">
                  Notifies teams when human review is needed and cross-references related agreements like MSAs and SOWs.
                </p>
              </div>
            </div>
            <div className="py-3 my-2 px-2 bg-accent rounded">
            <h3 className="text-xl font-semibold mt-2">💼 How I Boost Your Team:</h3>
            <p className="m-2">
              Your CRM is only as good as the data inside it. I make sure your contract terms aren't lost in the void or outdated by syncing your signed documents with what's actually in your system. Legal and RevOps love me for catching errors before they become liabilities.
            </p>
            </div>
          </div>
        </div>
        <ContractResultList />
        <UsageLogsList filter="ContractReader" />
      </div>
    </div>
  );
}
