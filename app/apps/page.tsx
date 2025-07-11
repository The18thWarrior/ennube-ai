
import Image from 'next/image';

import Link from 'next/link';

const apps = [
	{
		name: 'Agents',
		description: 'Manage and interact with your AI agents',
		author: '',
		image: '/logo.png',
		url: '/agents',
	},
	// {
	// 	name: 'Data Loader',
	// 	description: 'Upload and manage your CRM data with ease',
	// 	author: 'promptspellsmit.com',
	// 	image: '/robot-admin-avatar.png',
	// 	url: '/dataloader',
	// },
	{
		name: 'Chat',
		description: 'Engage in conversations with your AI agents',
		author: 'Widenex',
		image: '/ai-interface.png',
		url: '/chat',
	},
	// {
	// 	name: 'DesignerGPT',
	// 	description: 'Creates and hosts beautiful websites, seamlessly integrating DALL·E-generated images.',
	// 	author: 'Pietro Schirano',
	// 	image: '/ai-business-ethics.png',
	// 	url: '/apps/designergpt',
	// },
	// {
	// 	name: 'Laravel GPT',
	// 	description: 'A Laravel expert providing coding advice and solutions.',
	// 	author: 'Simon Benjámin',
	// 	image: '/robot-data-avatar.png',
	// 	url: '/apps/laravel-gpt',
	// },
	// {
	// 	name: 'Code',
	// 	description: 'Reviews code, generates and optimizes functions, writes tests, and adds comments for existing code.',
	// 	author: 'codegenerator.b12.io',
	// 	image: '/ai-crm-transformation.png',
	// 	url: '/apps/code',
	// },
];

export default function AppsLayout() {
       return (
	       <main className="min-h-screen bg-white dark:bg-neutral-950 text-black dark:text-white py-12 px-4">
		       <div className="max-w-4xl mx-auto">
			       <h1 className="text-3xl text-black dark:text-white font-bold mb-2">Apps</h1>
			       <p className="text-neutral-600 dark:text-neutral-400 mb-8">Access a variety of AI-powered applications to enhance your productivity.</p>
			       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
				       {apps.map((app, idx) => (
							       <Link
								       key={app.name}
								       href={app.url}
								       className="bg-neutral-100 dark:bg-neutral-900 rounded-xl shadow-lg p-6 flex flex-col items-center hover:scale-105 transition-transform border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
								       tabIndex={0}
							       >
								       <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-800">
									       <Image
										       src={app.image}
										       alt={app.name}
										       width={48}
										       height={48}
										       className="object-contain rounded-full"
									       />
								       </div>
								       <div className="text-lg font-semibold text-center mb-1 text-black dark:text-white">{app.name}</div>
								       <div className="text-sm text-neutral-600 dark:text-neutral-400 text-center mb-2">{app.description}</div>
								       {/* <div className="text-xs text-neutral-500 text-center">By {app.author}</div> */}
							       </Link>
				       ))}
			       </div>
			       <div className="flex justify-center mt-10">
				       <button className="bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white px-6 py-2 rounded-full hover:bg-neutral-300 dark:hover:bg-neutral-700 transition">See more</button>
			       </div>
		       </div>
	       </main>
       );
}
