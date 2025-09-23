'use client';

import AgentHeader from '@/components/agents/market-nurturer/market-nurturer-header';
import UsageLogsList from '@/components/agents/usage-logs-list';

export default function MarketNurturerDashboard() {
  return (
    <div className="min-h-screen bg-popover">
      <AgentHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-muted rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Market Nurturer Overview</h2>
          <p className="mb-4">
            👋 I'm your AI marketing assistant. I help you nurture leads and engage customers through personalized content and timely communications.
          </p>

            <div className="mt-6">
              <h3 className="text-xl font-semibold mb-4">📣 What I Do (Mi Arsenal de Marketing):</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                  <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Personalized Content</h3>
                  <p className="text-sm text-muted-foreground ">
                    ✍️ Crafts super-personalized content for every prospect segment, ensuring every message resonates.
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
                  <h3 className="font-medium text-purple-800 dark:text-purple-300 mb-2">Automated Journeys</h3>
                  <p className="text-sm text-muted-foreground ">
                    📧 Designs and launches email journeys that delight and convert, tracking every open, click, and scroll to optimize in real time.
                  </p>
                </div>
                <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg border border-pink-100 dark:border-pink-800">
                  <h3 className="font-medium text-pink-800 dark:text-pink-300 mb-2">Lead Readiness & Insights</h3>
                  <p className="text-sm text-muted-foreground ">
                    🔔 Spots the exact moment a lead is sales-ready and hands it off fast, delivering clear insights on what stories work and who's ready to buy.
                  </p>
                </div>
              </div>
              <h3 className="text-xl font-semibold mt-8">🤝 How I Boost Your Team:</h3>
              <p>
                You dream the big creative idea; I run the engines. I keep every prospect warm with relevant, timely messages so no lead goes cold and your funnel moves with salsa-level rhythm. 🎶
              </p>
            </div>
        </div>
        
        <UsageLogsList />
      </div>
    </div>
  );
}
