'use client';

import { SnackbarProvider as NotistackProvider } from 'notistack';

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  return (
    <NotistackProvider
      maxSnack={3}
      autoHideDuration={5000}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
    >
      {children}
    </NotistackProvider>
  );
}
