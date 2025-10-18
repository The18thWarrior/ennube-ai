// app/layout.tsx or app/page.tsx
import { Metadata } from 'next';
import { headers } from 'next/headers'; // Example for server-side theme detection

export async function generateMetadata() {
  const headersList = headers();
  //const theme = headersList.get('x-theme') || 'light'; // Get theme from headers, or default to light

  const faviconPath = '/logo.png'; // Default favicon path

  return {
    title: "Ennube.ai",
    description:
      "Supercharge your CRM with AI Agents",
    icons: {
      icon: faviconPath,
    },
  } as Metadata;
}