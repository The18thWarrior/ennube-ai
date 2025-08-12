import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SignIn } from "@/components/auth-components"

export default async function LandingPage() {
  const session = await auth()
  
  if (session && session.accessToken) {
    redirect("/dashboard")
  } else {
    redirect("/auth/login")
  }
  return <></>
  // Define a button for signed-in users
  // This button will redirect to the dashboard

  // const SignedInButton = ({...props}) => {
  //   return (
  //     <Link href={"/dashboard"} {...props}>
  //       Get Started
  //     </Link>
  //   )
  // }

  // return (
  //   <div className="container mx-auto px-4 py-12">
  //     {/* Hero Section */}
  //     <section className="flex flex-col md:flex-row items-center justify-between py-12">
  //       <div className="md:w-1/2 mb-8 md:mb-0">
  //         <h1 className="text-5xl font-bold mb-6">Supercharge your CRM with AI Agents</h1>
  //         <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
  //           Hire turnkey AI agents to automate repetitive tasks, analyze customer data, and
  //           enhance your CRM workflows. Boost productivity and improve customer relationships.
  //         </p>
  //         <div className="flex flex-col sm:flex-row gap-4">
  //           {session && session.accessToken ? 
  //             <SignedInButton size="lg" className="text-lg px-8"/>
  //             :
  //             <SignIn provider={'auth0'} label="Get Started"/>
  //           }
  //         </div>
  //       </div>
  //       <div className="md:w-1/2">
  //         <img 
  //           src="/ai-interface.png" 
  //           alt="Professional working with AI interface" 
  //           className="rounded-lg shadow-lg"
  //         />
  //       </div>
  //     </section>

  //     {/* AI Workforce Section */}
  //     <section className="py-16 bg-gray-50 dark:bg-gray-900 rounded-xl my-12 px-6">
  //       <div className="text-center mb-12">
  //         <h2 className="text-3xl font-bold mb-4">Meet Your AI Workforce</h2>
  //         <p className="text-xl text-gray-600 dark:text-gray-300">
  //           Our AI agents are designed to handle specific tasks within your CRM ecosystem
  //         </p>
  //       </div>

  //       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
  //         {/* Data Steward */}
  //         <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
  //           <h3 className="text-xl font-bold mb-2">Data Steward</h3>
  //           <p className="text-gray-500 dark:text-gray-400 font-medium mb-3">Data Management Expert</p>
  //           <p className="mb-4">
  //             Maintains the quality of data in your CRM by leveraging online search tools to
  //             verify, enrich, and clean customer information.
  //           </p>
  //           <Link href="/agents/data-steward" className="text-blue-600 dark:text-blue-400 hover:underline">
  //             Learn more →
  //           </Link>
  //         </div>

  //         {/* Prospect Finder */}
  //         <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
  //           <h3 className="text-xl font-bold mb-2">Prospect Finder</h3>
  //           <p className="text-gray-500 dark:text-gray-400 font-medium mb-3">Lead Generation Specialist</p>
  //           <p className="mb-4">
  //             Creates ideal customer profiles, updates them every 30 days, and finds matching
  //             prospects while incorporating feedback from Slack.
  //           </p>
  //           <Link href="/agents/prospect-finder" className="text-blue-600 dark:text-blue-400 hover:underline">
  //             Learn more →
  //           </Link>
  //         </div>

  //         {/* Meetings Booker */}
  //         <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
  //           <h3 className="text-xl font-bold mb-2">Meetings Booker</h3>
  //           <p className="text-gray-500 dark:text-gray-400 font-medium mb-3">Scheduling Specialist</p>
  //           <p className="mb-4">
  //             Sets up appointments with prospects identified by the Prospect Finder, handling
  //             scheduling, reminders, and follow-ups.
  //           </p>
  //           <Link href="/agents/meetings-booker" className="text-blue-600 dark:text-blue-400 hover:underline">
  //             Learn more →
  //           </Link>
  //         </div>
  //       </div>
  //     </section>

  //     {/* How It Works Section */}
  //     <section className="py-16 my-12">
  //       <div className="text-center mb-12">
  //         <h2 className="text-3xl font-bold mb-4">How It Works</h2>
  //         <p className="text-xl text-gray-600 dark:text-gray-300">
  //           Getting started is simple and straightforward
  //         </p>
  //       </div>

  //       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
  //         <div className="text-center">
  //           <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-12 h-12 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl mx-auto mb-4">1</div>
  //           <h3 className="text-xl font-bold mb-3">Connect Your CRM</h3>
  //           <p className="text-gray-600 dark:text-gray-300">
  //             Integrate with your existing CRM system through our secure API connections.
  //           </p>
  //         </div>

  //         <div className="text-center">
  //           <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-12 h-12 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl mx-auto mb-4">2</div>
  //           <h3 className="text-xl font-bold mb-3">Select Your Agents</h3>
  //           <p className="text-gray-600 dark:text-gray-300">
  //             Choose from our marketplace of specialized AI agents based on your business needs.
  //           </p>
  //         </div>

  //         <div className="text-center">
  //           <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-12 h-12 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl mx-auto mb-4">3</div>
  //           <h3 className="text-xl font-bold mb-3">Watch Them Work</h3>
  //           <p className="text-gray-600 dark:text-gray-300">
  //             Your AI agents start working immediately, learning from your data and improving over time.
  //           </p>
  //         </div>
  //       </div>
  //     </section>

  //     {/* Integrations Section */}
  //     <section className="py-16 bg-gray-50 dark:bg-gray-900 rounded-xl my-12 px-6">
  //       <div className="text-center mb-12">
  //         <h2 className="text-3xl font-bold mb-4">Integrations</h2>
  //         <p className="text-xl text-gray-600 dark:text-gray-300">
  //           Seamlessly connect with your favorite tools and platforms
  //         </p>
  //       </div>

  //       <div className="flex flex-wrap justify-center items-center gap-12">
  //         <div className="flex items-center justify-center">
  //           <img src="/salesforce-logo.png" alt="Salesforce" className="h-16 object-contain" />
  //         </div>
  //         <div className="flex items-center justify-center">
  //           <img src="/gmail-logo.webp" alt="Gmail" className="h-12 object-contain" />
  //         </div>
  //         <div className="flex items-center justify-center">
  //           <img src="/google-calendar-icon-2020.png" alt="Google Calendar" className="h-14 object-contain" />
  //         </div>
  //       </div>
  //     </section>

  //     {/* CTA Section */}
  //     <section className="py-16 text-center my-12">
  //       <h2 className="text-4xl font-bold mb-6">Ready to transform your CRM experience?</h2>
  //       <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
  //         Join the growing number of businesses using AI agents to enhance their customer relationship management.
  //       </p>
  //       <Button asChild size="lg" className="text-lg px-12 py-6">
  //         <Link href="/api/auth/signin?callbackUrl=/dashboard">
  //           Get Started Today
  //         </Link>
  //       </Button>
  //     </section>
  //   </div>
  // )
}
