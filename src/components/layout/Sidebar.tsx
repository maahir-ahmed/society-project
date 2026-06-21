"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Building2,
  Wallet,
  Printer,
  Users,
  Settings,
  Shield,
  LogOut,
  Globe2,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { SessionUser } from "@/types";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/requests/content",
    label: "Content Requests",
    icon: FileText,
  },
  {
    href: "/requests/room-booking",
    label: "Room Bookings",
    icon: Building2,
  },
  {
    href: "/requests/treasury",
    label: "Treasury",
    icon: Wallet,
  },
  {
    href: "/requests/printing",
    label: "Printing",
    icon: Printer,
  },
  {
    href: "/executive/queue",
    label: "Exec Queue",
    icon: Shield,
    executiveOnly: true,
  },
  {
    href: "/members",
    label: "Members",
    icon: Users,
  },
  {
    href: "/rubric",
    label: "Rubric Portal",
    icon: Globe2,
    executiveOnly: true,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    executiveOnly: true,
  },
];

interface SidebarProps {
  user: SessionUser;
  societyName: string;
  societySlug: string;
  userRole: string;
  primaryColor?: string;
}

export function Sidebar({ user, societyName, societySlug, userRole, primaryColor = "#0052CC" }: SidebarProps) {
  const pathname = usePathname();
  const isExecutive = userRole === "EXECUTIVE";
  const prefix = `/${societySlug}`;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="flex h-full w-64 flex-col bg-gray-900 text-white">
      {/* Society Header */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-700">
        <div
          className="h-8 w-8 rounded-md flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ backgroundColor: primaryColor }}
        >
          {societyName[0]}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{societyName}</p>
          <p className="text-xs text-gray-400 capitalize">{userRole.toLowerCase()}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {navItems
          .filter((item) => !item.executiveOnly || isExecutive)
          .map((item) => {
            const href = `${prefix}${item.href}`;
            const active = pathname.startsWith(href);
            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-white/10 text-white font-medium"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
      </nav>

      {/* User Footer */}
      <div className="border-t border-gray-700 p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={user.image ?? ""} alt={user.name} />
            <AvatarFallback className="bg-gray-600 text-white text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
