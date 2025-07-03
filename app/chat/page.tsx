import { redirect } from 'next/navigation';
import { nanoid } from 'nanoid';
import { setThread } from '@/lib/cache/message-history';
import { auth } from '@/auth';

export default async function ChatDefaultPage() {
  const session = await auth();
  if (!session?.user?.auth0?.sub) {
    redirect('/login'); // redirect to login if not authenticated
    return;
  }
  const id = nanoid();
  await setThread(id, session.user.auth0.sub, [], null); // create a new chat
  redirect(`/chat/${id}`); // redirect to chat page, see below
}