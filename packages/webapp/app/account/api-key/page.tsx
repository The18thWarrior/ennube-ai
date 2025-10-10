import React from 'react';
import { ApiKeysList } from '@/components/account/api-keys/api-keys-list';

export const metadata = {
  title: 'API Keys',
};

export default function ApiKeyPage() {
  return (
    <div className="p-6">
      <ApiKeysList />
    </div>
  );
}
