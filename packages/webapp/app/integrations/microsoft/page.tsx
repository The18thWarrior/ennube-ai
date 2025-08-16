export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { getMicrosoftCredentialsById } from '@/lib/db/microsoft-storage'

export default async function MicrosoftPage() {
  const credential = await getMicrosoftCredentialsById();
  if (credential && credential.access_token) {
    redirect('/integrations/microsoft/dashboard')
  } else {
    redirect('/integrations/microsoft/connect')
  }
  return null;
}
