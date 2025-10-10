
import WelcomeMessage from '@/components/account/welcome-message';
import { Badge } from '@/components/ui';
import Image from 'next/image';

import Link from 'next/link';

const apps = [
	{
		name: 'Agents',
		description: 'Manage and interact with your AI agents',
		author: '',
		image: '/logo.png',
		url: '/agents',
    active: true
	},
	{
		name: 'Chat',
		description: 'Engage in conversations with your AI agents',
		author: '',
		image: '/ai-interface.png',
		url: '/chat',
    active: true
	},
	{
		name: 'Data Loader',
		description: 'Upload and manage your CRM data with ease',
		author: '',
		image: '/robot-admin-avatar.png',
		url: '/dataloader',
    active: false
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
	       <main className="min-h-screen py-12 px-4">
            <WelcomeMessage />
		       <div className="max-w-4xl mx-auto">
			       <h1 className="text-xl font-bold mb-2">Apps</h1>
			       <p className="mb-8">AI Agent powered applications that enhance your productivity and seamlessly connect your business systems.</p>
			       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
				       {apps.map((app, idx) => (
                      app.active ? (
							       <Link
								       key={app.name}
								       href={app.url}
								       className="rounded-xl shadow-lg p-6 flex flex-col items-center hover:scale-105 transition-transform border focus:outline-none focus:ring-2 focus:ring-blue-500"
								       tabIndex={0}
							       >
								       <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full ">
									       <Image
										       src={app.image}
										       alt={app.name}
										       width={48}
										       height={48}
										       className="object-contain rounded-full"
									       />
								       </div>
								       <div className="text-lg font-semibold text-center mb-1 ">{app.name}</div>
								       <div className="text-sm text-center mb-2">{app.description}</div>
								       {/* <div className="text-xs text-muted text-center">By {app.author}</div> */}
							       </Link>
                      ): (
                        <div
                          key={app.name}
                          className="bg-muted rounded-xl shadow-lg p-6 flex flex-col items-center hover:scale-105 transition-transform border focus:outline-none focus:ring-2 focus:ring-blue-500"
                          tabIndex={0}
                        >
                          <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full ">
                            <Image
                              src={app.image}
                              alt={app.name}
                              width={48}
                              height={48}
                              className="object-contain rounded-full"
                            />
                          </div>
                          <div className="text-lg font-semibold text-center mb-1">{app.name}</div>
                          <div className={`text-sm text-center mb-2`}>{app.description}</div>

                          <Badge variant={'success'} className={'float-right'}>Coming Soon</Badge>
                          {/* <div className="text-xs text-muted text-center">By {app.author}</div> */}
                        </div>
                      )
				       ))}
			       </div>
			       {/* <div className="flex justify-center mt-10">
				       <button className="bg-muted  text-black dark:text-white px-6 py-2 rounded-full hover:bg-muted dark:hover:bg-muted transition">See more</button>
			       </div> */}
		       </div>
	       </main>
       );
}
