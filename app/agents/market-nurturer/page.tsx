'use client';

import AgentHeader from '@/components/agents/market-nurturer/market-nurturer-header';
import UsageLogsList from '@/components/agents/usage-logs-list';

export default function MarketNurturerDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AgentHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Market Nurturer Overview</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            👋 I'm your AI marketing assistant. I help you nurture leads and engage customers through personalized content and timely communications.
          </p>

            <div className="mt-6 space-y-6 text-gray-600">

                <h3 className="text-xl font-semibold text-gray-900">📣 What I Do (Mi Arsenal de Marketing):</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>✍️ Craft contenido súper-personalizado for every prospect segment</li>
                  <li>📧 Design and launch email journeys that enamoran y convierten</li>
                  <li>📊 Track cada open, click & scroll—then tweak estrategias en tiempo real</li>
                  <li>🔔 Spot the exact momento a lead is sales-ready and hand it off, rapidito</li>
                  <li>📈 Deliver clear insights on qué historias pegan and quién está listo para comprar</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900">🤝 How I Boost Your Team:</h3>
                <p>
                  You dream the big creative idea; I run the motores. I keep every prospect warm with mensajes
                  relevantes y puntuales so no lead se enfría and your funnel moves with salsa-level ritmo. 🎶
                </p>
              </div>
        </div>
        
        <UsageLogsList />
      </div>
    </div>
  );
}
