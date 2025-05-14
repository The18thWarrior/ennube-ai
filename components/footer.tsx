import Link from "next/link"
import Image from "next/image"
import { Twitter, Linkedin, Github } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1">
            <Link href="/" className="flex items-center mb-4">
              <Image src="/abstract-purple-logo.png" alt="Ennube.ai Logo" width={40} height={40} />
              <span className="ml-2 text-xl font-semibold">Ennube.ai</span>
            </Link>
            <p className="text-gray-600 text-sm">
              Supercharge your CRM with AI Agents. Automate repetitive tasks and enhance your workflows.
            </p>
            <div className="flex space-x-4 mt-4">
              <Link href="#" className="text-gray-500 hover:text-purple-600">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="#" className="text-gray-500 hover:text-purple-600">
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </Link>
              <Link href="#" className="text-gray-500 hover:text-purple-600">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </Link>
            </div>
          </div>

          {/* Products */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">Products</h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-gray-600 hover:text-purple-600 text-sm">
                  AI Agents
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-purple-600 text-sm">
                  CRM Integration
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-purple-600 text-sm">
                  Analytics
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-purple-600 text-sm">
                  Automation
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-gray-600 hover:text-purple-600 text-sm">
                  About
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-purple-600 text-sm">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-purple-600 text-sm">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-purple-600 text-sm">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">Resources</h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-gray-600 hover:text-purple-600 text-sm">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-purple-600 text-sm">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-purple-600 text-sm">
                  Demo
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-purple-600 text-sm">
                  Support
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom section with legal links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} Ennube.ai. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="#" className="text-gray-500 hover:text-purple-600 text-sm">
                Privacy Policy
              </Link>
              <Link href="#" className="text-gray-500 hover:text-purple-600 text-sm">
                Terms of Service
              </Link>
              <Link href="#" className="text-gray-500 hover:text-purple-600 text-sm">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
