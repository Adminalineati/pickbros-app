import type { ReactNode } from 'react';
import { MobileNavigation } from '@/components/mobile-navigation';
import { Sidebar } from '@/components/sidebar';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="pb-app-bg min-h-dvh lg:flex">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-5 lg:px-8 lg:pb-10 lg:pt-8">
          {children}
        </main>
      </div>
      <MobileNavigation />
    </div>
  );
}
