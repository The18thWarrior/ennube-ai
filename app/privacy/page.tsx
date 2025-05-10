import Link from "next/link"

export default function PrivacyPolicy() {
  return (
    <div className="bg-white dark:bg-gray-800 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Using max-w-7xl to match the width of the main layout */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
            Ennube.ai Website Privacy Policy
          </h1>
          <p className="mt-2 text-lg leading-8 text-gray-600 dark:text-gray-400">Last updated: May 9 2025</p>
        </div>
        <div className="mt-10">
          <div className="prose prose-lg prose-indigo max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">1. Who We Are</h2>
              <p>
                Ennube Inc. ("Ennube.ai," "we," "us") operates the ennube.ai website, related sub-domains, and marketing
                pages (collectively, the "Site").
              </p>
            </section>
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">2. Scope of This Policy</h2>
              <p>
                This Privacy Policy applies only to information collected through the Site — e.g., when you browse, fill
                out a form, join a mailing list, or create a free account.
              </p>
              <p>
                It does not cover data we access through connected CRMs; that is governed by our Agent CRM Product Terms
                of Service.
              </p>
            </section>
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">3. Information We Collect</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 sm:pl-0"
                      >
                        Category
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Examples
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                        How We Collect
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-gray-100 sm:pl-0">
                        Contact & Account Info
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        Name, email, company, job title, password hash
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">Forms you submit</td>
                    </tr>
                    <tr>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-gray-100 sm:pl-0">
                        Usage Data
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        IP address, browser type, referring URL, pages visited, timestamps
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">Automatic via server logs</td>
                    </tr>
                    <tr>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-gray-100 sm:pl-0">
                        Cookies & Similar Tech
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        Session cookies, analytics events (privacy-focused Plausible)
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">Automatic</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-4">We do not knowingly collect data from children under 16.</p>
            </section>
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">4. Purposes & Legal Bases</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 sm:pl-0"
                      >
                        Purpose
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Lawful basis (GDPR Art. 6)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-gray-100 sm:pl-0">
                        Provide & secure the Site
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        Legitimate interests / contract
                      </td>
                    </tr>
                    <tr>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-gray-100 sm:pl-0">
                        Respond to inquiries
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">Contract</td>
                    </tr>
                    <tr>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-gray-100 sm:pl-0">
                        Analytics & performance
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        Legitimate interests (opt-out available)
                      </td>
                    </tr>
                    <tr>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-gray-100 sm:pl-0">
                        Marketing emails
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">Consent (you must opt in)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">5. Sharing & Disclosure</h2>
              <p>We never sell personal data. We share only with:</p>
              <ul className="list-disc pl-5 mt-2">
                <li>Trusted sub-processors (cloud hosting, analytics) bound by strict DPAs;</li>
                <li>Professional advisers under confidentiality;</li>
                <li>Authorities when legally required;</li>
                <li>Successors in a merger or acquisition (advance notice will be provided).</li>
              </ul>
              <p className="mt-2">
                Live list:{" "}
                <Link href="/subprocessors" className="text-indigo-600 hover:text-indigo-500">
                  ennube.ai/subprocessors
                </Link>
              </p>
            </section>
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">6. International Transfers</h2>
              <p>
                Primary servers are in the United States. For EU/UK data we rely on Standard Contractual Clauses plus
                additional safeguards.
              </p>
            </section>
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">7. Security</h2>
              <p>TLS 1.3 for data in transit; AES-256 for data at rest.</p>
              <p>Annual SOC 2 Type II audit.</p>
              <p>Role-based access control and MFA for all employees.</p>
            </section>
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">8. Retention</h2>
              <p>
                Contact & account data are kept until you delete your account or ask us to erase it. Server logs are
                retained 12 months, then aggregated.
              </p>
            </section>
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">9. Your Rights</h2>
              <p>
                Depending on your jurisdiction you may access, correct, delete, port, or restrict processing. Email{" "}
                <a href="mailto:privacy@ennube.ai" className="text-indigo-600 hover:text-indigo-500">
                  privacy@ennube.ai
                </a>
                .
              </p>
            </section>
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">10. Cookies</h2>
              <p>
                We use first-party session cookies and Plausible Analytics (no cross-site tracking). You can disable
                cookies in your browser; some features may break.
              </p>
            </section>
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">11. Third-Party Links</h2>
              <p>External sites are governed by their own privacy policies.</p>
            </section>
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">12. Changes</h2>
              <p>Material changes will be posted here and, if significant, emailed 30 days in advance.</p>
            </section>
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">13. Contact</h2>
              <p>Ennube Inc.</p>
              <p>2100 Addison St. Suite 300, Berkeley, CA 94704</p>
              <p>
                <a href="mailto:privacy@ennube.ai" className="text-indigo-600 hover:text-indigo-500">
                  privacy@ennube.ai
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
