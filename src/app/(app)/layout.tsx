import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden w-full">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
