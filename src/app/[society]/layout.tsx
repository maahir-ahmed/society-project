"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

interface SocietyLayoutProps {
  children: React.ReactNode;
}

export default function SocietyLayout({ children }: SocietyLayoutProps) {
  const { data: session } = useSession();
  const params = useParams<{ society: string }>();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!session?.user) return null;

  const membership = (session.user as any).memberships?.find(
    (m: any) => m.society.slug === params.society
  );

  const societyName = membership?.society?.name ?? params.society;
  const userRole = membership?.role ?? "SUBCOMMITTEE";
  const primaryColor = membership?.society?.primaryColor ?? "#0052CC";

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar
          user={session.user as any}
          societyName={societyName}
          societySlug={params.society}
          userRole={userRole}
          primaryColor={primaryColor}
        />
      </div>

      {/* Mobile Sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="fixed left-0 top-0 h-full z-50">
            <Sidebar
              user={session.user as any}
              societyName={societyName}
              societySlug={params.society}
              userRole={userRole}
              primaryColor={primaryColor}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          societySlug={params.society}
          onMobileMenuToggle={() => setMobileOpen((v) => !v)}
          mobileMenuOpen={mobileOpen}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
