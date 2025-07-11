'use client';

import AgentHeader from '@/components/agents/meetings-booker/meetings-booker-header';
import UsageLogsList from '@/components/agents/usage-logs-list';

export default function MeetingsBookerDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AgentHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Meetings Booker Overview</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            👋 I'm your AI scheduling assistant. I handle all your meeting scheduling needs, from finding the
                  perfect time slots to sending invitations and reminders. I integrate with your calendar and email to
                  make scheduling effortless.
          </p>

          <div className="mt-6 space-y-6 text-gray-600">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-300">🎯 What I Do (aka My Toolkit):</h3>
            <ul className="list-disc pl-5 space-y-2">
                <li>🧠 Intelligent time slot suggestions based on your availability</li>
                <li>🔔 Automatic meeting reminders and follow-ups</li>
                <li>🌎 Timezone detection and conversion</li>
                <li>🔄 Meeting rescheduling and cancellation handling</li>
                <li>🎨 Custom scheduling pages for different meeting types</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-300">💼 How I Boost Your Team:</h3>
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
