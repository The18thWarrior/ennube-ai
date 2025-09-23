'use client';

import AgentHeader from '@/components/agents/meetings-booker/meetings-booker-header';
import UsageLogsList from '@/components/agents/usage-logs-list';

export default function MeetingsBookerDashboard() {
  return (
    <div className="min-h-screen bg-popover">
      <AgentHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-muted rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Meetings Booker Overview</h2>
          <p className="mb-4">
            👋 I'm your AI scheduling assistant. I handle all your meeting scheduling needs, from finding the
                  perfect time slots to sending invitations and reminders. I integrate with your calendar and email to
                  make scheduling effortless.
          </p>

          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-4">🎯 What I Do (aka My Toolkit):</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Smart Time Suggestions</h3>
                <p className="text-sm text-muted-foreground ">
                  🧠 Intelligently suggests optimal time slots based on your real-time availability and preferences.
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
                <h3 className="font-medium text-purple-800 dark:text-purple-300 mb-2">Reminders & Rescheduling</h3>
                <p className="text-sm text-muted-foreground ">
                  🔔 Sends automatic meeting reminders, handles follow-ups, and manages rescheduling or cancellations with ease.
                </p>
              </div>
              <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg border border-pink-100 dark:border-pink-800">
                <h3 className="font-medium text-pink-800 dark:text-pink-300 mb-2">Timezone & Custom Pages</h3>
                <p className="text-sm text-muted-foreground ">
                  � Detects and converts timezones, and provides custom scheduling pages for different meeting types.
                </p>
              </div>
            </div>
            <h3 className="text-xl font-semibold mt-8">💼 How I Boost Your Team:</h3>
            <p>
              No more back-and-forth emails trying to find a time that works. I handle the scheduling logistics so
              you can focus on the meetings themselves and the relationships that matter.
            </p>
          </div>
        </div>
        
        <UsageLogsList />
      </div>
    </div>
  );
}
